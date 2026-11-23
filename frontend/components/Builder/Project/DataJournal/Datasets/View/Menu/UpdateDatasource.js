import { useRef } from "react";
import { useApolloClient, useMutation } from "@apollo/client";
import { customAlphabet } from "nanoid";

import {
  CREATE_DATASOURCE,
  UPDATE_DATASOURCE,
} from "../../../../../../Mutations/Datasource";
import { GET_DATASOURCE_COLLABORATOR_CANDIDATES } from "../../../../../../Queries/Datasource";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

// `datasourceId` names the dataset being saved in place: the server lets only
// its editors replace a file it already has (pages/api/journal-data.ts).
async function postDataFile({ year, month, day, content, datasourceId }) {
  const metadata = {
    id: content.token,
    payload: "modified",
    timestampUploaded: Date.now(),
  };

  const dataFile = {
    metadata: {
      ...metadata,
      variables: content.variables,
      settings: content.settings,
    },
    data: content.data,
  };

  const datasourceParam = datasourceId
    ? `&datasource=${encodeURIComponent(datasourceId)}`
    : "";
  const res = await fetch(
    `/api/journal-data?y=${year}&m=${month}&d=${day}${datasourceParam}`,
    {
      method: "POST",
      body: JSON.stringify(dataFile),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );
  return { res, metadata };
}

function resolveSaveAddress(dataset) {
  const address =
    dataset?.content?.[dataset?.content?.isModified ? "modified" : "uploaded"]
      ?.address;

  const isTemplateData =
    dataset?.dataOrigin === "TEMPLATE" &&
    !dataset?.content?.isTemplateModified;
  // A dataset cloned from a template journal still points at the template's
  // files until its first save, which must go to a file of its own.
  const usesSourceFiles = Boolean(dataset?.content?.filesFromSource);

  if (
    address &&
    address?.year != null &&
    address?.month != null &&
    address?.day != null &&
    address?.token &&
    !isTemplateData &&
    !usesSourceFiles
  ) {
    return {
      year: address.year,
      month: address.month,
      day: address.day,
      token: address.token,
    };
  }

  return freshSaveAddress();
}

/** A new file address: today's date and a new token. */
function freshSaveAddress() {
  const curDate = new Date();
  return {
    year: parseInt(curDate.getFullYear(), 10),
    month: parseInt(curDate.getMonth(), 10) + 1,
    day: parseInt(curDate.getDate(), 10),
    token: nanoid(),
  };
}

/**
 * Persists dataset changes: in-place when writeMode is `editable`,
 * or create a copy when `copyOnWrite` via {@link saveAsCopy}.
 *
 * Reads latest `dataset` / `content` from refs so debounced autosave
 * does not persist a stale snapshot.
 */
export function useDatasetSaveOrCopy({
  dataset,
  content,
  writeMode,
  currentVizPartId,
  projectId,
  studyId,
  onSaved,
  onCopied,
  tAlerts,
}) {
  const client = useApolloClient();
  const [updateDatasource, { loading: updateLoading }] =
    useMutation(UPDATE_DATASOURCE);
  const [createDatasource, { loading: createLoading }] =
    useMutation(CREATE_DATASOURCE);

  const datasetRef = useRef(dataset);
  datasetRef.current = dataset;
  const contentRef = useRef(content);
  contentRef.current = content;
  const writeModeRef = useRef(writeMode);
  writeModeRef.current = writeMode;
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;
  const onCopiedRef = useRef(onCopied);
  onCopiedRef.current = onCopied;
  const tAlertsRef = useRef(tAlerts);
  tAlertsRef.current = tAlerts;
  const currentVizPartIdRef = useRef(currentVizPartId);
  currentVizPartIdRef.current = currentVizPartId;
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;
  const studyIdRef = useRef(studyId);
  studyIdRef.current = studyId;

  const saveInPlace = async ({ quiet = false } = {}) => {
    const currentDataset = datasetRef.current;
    const currentContent = contentRef.current;
    const alerts = tAlertsRef.current;

    const fileContent = {
      variables: currentContent?.modified?.variables,
      settings: currentContent?.modified?.settings,
      data: currentContent?.modified?.data,
    };
    let address = resolveSaveAddress(currentDataset);
    let { res, metadata } = await postDataFile({
      ...address,
      datasourceId: currentDataset?.id,
      content: { ...fileContent, token: address.token },
    });
    // Refused: the file is shared with a dataset this editor may not change
    // (an older template copy still reading its template's file). Save to a
    // file of this dataset's own instead.
    if (res?.status === 403) {
      address = freshSaveAddress();
      ({ res, metadata } = await postDataFile({
        ...address,
        content: { ...fileContent, token: address.token },
      }));
    }
    const { year, month, day, token } = address;

    if (!res?.ok) {
      alert(
        alerts?.error?.(res?.statusText) ??
          `There was an error: ${res?.statusText}`,
      );
      return;
    }

    const prevContent = currentDataset?.content || {};
    const nextContent = {
      ...prevContent,
      filesFromSource: false,
      isModified: true,
      isTemplateModified: currentDataset?.dataOrigin === "TEMPLATE",
      modified: {
        address: { year, month, day, token },
        metadata,
      },
    };

    await updateDatasource({
      variables: {
        id: currentDataset?.id,
        data: {
          content: nextContent,
        },
      },
      update(cache) {
        if (!currentDataset?.id) return;
        cache.modify({
          id: cache.identify({
            __typename: "Datasource",
            id: currentDataset.id,
          }),
          fields: {
            content() {
              return nextContent;
            },
            updatedAt() {
              return new Date().toISOString();
            },
          },
        });
      },
    });
    // Quiet autosave: skip list refetch — local state is already correct and
    // refetch/rehydrate remounts the grid. Callers still receive onSaved for
    // explicit (non-quiet) saves.
    if (!quiet && typeof onSavedRef.current === "function") {
      await onSavedRef.current();
    }
    if (!quiet) {
      alert(alerts?.updated ?? "The data has been updated");
    }
  };

  /**
   * Create a fresh dataset owned by the caller: a snapshot of what is on
   * screen, written to a file of its own, connected to the current journal
   * part. Nothing is shared with the source — not its files, not its
   * collaborators. A study dataset becomes an uploaded one (frozen rows).
   */
  const saveAsCopy = async ({ copyTitle, shareWithTeam = false }) => {
    const currentDataset = datasetRef.current;
    const currentContent = contentRef.current;
    const alerts = tAlertsRef.current;

    const curDate = new Date();
    const year = parseInt(curDate.getFullYear(), 10);
    const month = parseInt(curDate.getMonth(), 10) + 1;
    const day = parseInt(curDate.getDate(), 10);
    const token = nanoid();

    const sourceOrigin = currentDataset?.dataOrigin;
    const copyOrigin = sourceOrigin === "SIMULATED" ? "SIMULATED" : "UPLOADED";
    const isStudyLike =
      sourceOrigin === "STUDY" || sourceOrigin === "TEMPLATE";
    // Study columns are grouped by task components, which a snapshot no
    // longer has: keep them all as plain columns, user columns as they are.
    const variables = isStudyLike
      ? (currentContent?.modified?.variables || []).map((v) =>
          v?.type === "user" ? v : { ...v, type: "general" },
        )
      : currentContent?.modified?.variables;

    const { res, metadata } = await postDataFile({
      year,
      month,
      day,
      content: {
        token,
        variables,
        settings: currentContent?.modified?.settings,
        data: currentContent?.modified?.data,
      },
    });

    if (!res?.ok) {
      alert(
        alerts?.error?.(res?.statusText) ??
          `There was an error: ${res?.statusText}`,
      );
      return;
    }

    const address = { year, month, day, token };
    const createInput = {
      title: copyTitle,
      description: currentDataset?.description ?? undefined,
      dataOrigin: copyOrigin,
      settings: currentDataset?.settings ?? undefined,
      // Private to its maker whatever study or board it sits in: the team
      // rule is off and no collaborators are added (keystone Datasource).
      sharedWithTeam: false,
      // listed under "Me", not "Uploaded"
      isCopy: true,
      // Only the copy's own file: the reader takes uploaded.address, later
      // saves take modified.address, and both point here.
      content: {
        isModified: true,
        uploaded: { address },
        modified: { address, metadata },
      },
      ...(currentVizPartIdRef.current && {
        journal: { connect: [{ id: currentVizPartIdRef.current }] },
      }),
      ...(projectIdRef.current && {
        project: { connect: { id: projectIdRef.current } },
      }),
      ...(studyIdRef.current && {
        study: { connect: { id: studyIdRef.current } },
      }),
    };

    const { data: createData } = await createDatasource({
      variables: { data: createInput },
    });
    const newId = createData?.createDatasource?.id;
    // Sharing with the team, if asked, puts the study's and board's people on
    // the copy's collaborator list — the same list its author edits later.
    if (newId && shareWithTeam) {
      try {
        const { data: candidatesData } = await client.query({
          query: GET_DATASOURCE_COLLABORATOR_CANDIDATES,
          variables: { id: newId },
          fetchPolicy: "network-only",
        });
        const people = candidatesData?.datasourceCollaboratorCandidates || [];
        if (people.length) {
          await updateDatasource({
            variables: {
              id: newId,
              data: {
                collaborators: { connect: people.map((p) => ({ id: p.id })) },
              },
            },
          });
        }
      } catch (err) {
        // the copy exists and stays private; say so rather than fail silently
        alert(
          alerts?.shareError?.(err?.message) ??
            `Your copy was made, but your team could not be added: ${err?.message || ""}`,
        );
      }
    }
    if (typeof onSavedRef.current === "function") {
      await onSavedRef.current();
    }
    if (newId && typeof onCopiedRef.current === "function") {
      await onCopiedRef.current(newId);
    }
    alert(
      alerts?.copySuccess ??
        "We made a copy you own. You're now editing the copy.",
    );
  };

  const save = async () => {
    if (writeModeRef.current === "readOnly") return;
    if (writeModeRef.current === "copyOnWrite") return;
    await saveInPlace();
  };

  return {
    save,
    saveInPlace,
    saveAsCopy,
    saving: updateLoading || createLoading,
  };
}

/** @deprecated Prefer useDatasetSaveOrCopy */
export function useDatasetSave({ dataset, content, onSaved }) {
  return useDatasetSaveOrCopy({
    dataset,
    content,
    writeMode: "editable",
    currentVizPartId: null,
    projectId: null,
    studyId: null,
    onSaved,
    onCopied: null,
    tAlerts: null,
  });
}
