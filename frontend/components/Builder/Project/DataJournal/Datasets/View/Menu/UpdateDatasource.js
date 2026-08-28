import { useRef } from "react";
import { useMutation } from "@apollo/client";
import { customAlphabet } from "nanoid";

import {
  CREATE_DATASOURCE,
  UPDATE_DATASOURCE,
} from "../../../../../../Mutations/Datasource";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

async function postDataFile({ year, month, day, content }) {
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

  const res = await fetch(`/api/save?y=${year}&m=${month}&d=${day}`, {
    method: "POST",
    body: JSON.stringify(dataFile),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return { res, metadata };
}

function resolveSaveAddress(dataset) {
  const address =
    dataset?.content?.[dataset?.content?.isModified ? "modified" : "uploaded"]
      ?.address;

  const isTemplateData =
    dataset?.dataOrigin === "TEMPLATE" &&
    !dataset?.content?.isTemplateModified;

  if (
    address &&
    address?.year != null &&
    address?.month != null &&
    address?.day != null &&
    address?.token &&
    !isTemplateData
  ) {
    return {
      year: address.year,
      month: address.month,
      day: address.day,
      token: address.token,
    };
  }

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

    const { year, month, day, token } = resolveSaveAddress(currentDataset);

    const { res, metadata } = await postDataFile({
      year,
      month,
      day,
      content: {
        token,
        variables: currentContent?.modified?.variables,
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

    const prevContent = currentDataset?.content || {};
    const nextContent = {
      ...prevContent,
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
   * Create a new datasource (copy) with uploaded modified file; connects to current journal part.
   */
  const saveAsCopy = async ({
    copyTitle,
    collaboratorsCanEdit = true,
  }) => {
    const currentDataset = datasetRef.current;
    const currentContent = contentRef.current;
    const alerts = tAlertsRef.current;

    const curDate = new Date();
    const year = parseInt(curDate.getFullYear(), 10);
    const month = parseInt(curDate.getMonth(), 10) + 1;
    const day = parseInt(curDate.getDate(), 10);
    const token = nanoid();

    const { res, metadata } = await postDataFile({
      year,
      month,
      day,
      content: {
        token,
        variables: currentContent?.modified?.variables,
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

    const prevContent = currentDataset?.content || {};
    const collaboratorIds = (currentDataset?.collaborators || [])
      .map((c) => c?.id)
      .filter(Boolean);

    const createInput = {
      title: copyTitle,
      dataOrigin: currentDataset?.dataOrigin,
      settings: currentDataset?.settings ?? undefined,
      collaboratorsCanEdit,
      content: {
        ...prevContent,
        isModified: true,
        isTemplateModified: currentDataset?.dataOrigin === "TEMPLATE",
        modified: {
          address: { year, month, day, token },
          metadata,
        },
      },
      ...(collaboratorIds.length > 0 && {
        collaborators: {
          connect: collaboratorIds.map((id) => ({ id })),
        },
      }),
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
