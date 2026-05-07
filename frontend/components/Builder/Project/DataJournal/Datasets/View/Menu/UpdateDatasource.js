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

  const res = await fetch(`/api/save/?y=${year}&m=${month}&d=${day}`, {
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

  const saveInPlace = async () => {
    const { year, month, day, token } = resolveSaveAddress(dataset);

    const { res, metadata } = await postDataFile({
      year,
      month,
      day,
      content: {
        token,
        variables: content?.modified?.variables,
        settings: content?.modified?.settings,
        data: content?.modified?.data,
      },
    });

    if (!res?.ok) {
      alert(
        tAlerts?.error?.(res?.statusText) ??
          `There was an error: ${res?.statusText}`
      );
      return;
    }

    const prevContent = dataset?.content || {};
    await updateDatasource({
      variables: {
        id: dataset?.id,
        data: {
          content: {
            ...prevContent,
            isModified: true,
            isTemplateModified: dataset?.dataOrigin === "TEMPLATE",
            modified: {
              address: { year, month, day, token },
              metadata,
            },
          },
        },
      },
    });
    if (typeof onSaved === "function") {
      await onSaved();
    }
    alert(
      tAlerts?.updated ??
        "The data has been updated"
    );
  };

  /**
   * Create a new datasource (copy) with uploaded modified file; connects to current journal part.
   */
  const saveAsCopy = async ({
    copyTitle,
    collaboratorsCanEdit = true,
  }) => {
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
        variables: content?.modified?.variables,
        settings: content?.modified?.settings,
        data: content?.modified?.data,
      },
    });

    if (!res?.ok) {
      alert(
        tAlerts?.error?.(res?.statusText) ??
          `There was an error: ${res?.statusText}`
      );
      return;
    }

    const prevContent = dataset?.content || {};
    const collaboratorIds = (dataset?.collaborators || [])
      .map((c) => c?.id)
      .filter(Boolean);

    const createInput = {
      title: copyTitle,
      dataOrigin: dataset?.dataOrigin,
      settings: dataset?.settings ?? undefined,
      collaboratorsCanEdit,
      content: {
        ...prevContent,
        isModified: true,
        isTemplateModified: dataset?.dataOrigin === "TEMPLATE",
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
      ...(currentVizPartId && {
        journal: { connect: [{ id: currentVizPartId }] },
      }),
      ...(projectId && { project: { connect: { id: projectId } } }),
      ...(studyId && { study: { connect: { id: studyId } } }),
    };

    const { data: createData } = await createDatasource({
      variables: { data: createInput },
    });
    const newId = createData?.createDatasource?.id;
    if (typeof onSaved === "function") {
      await onSaved();
    }
    if (newId && typeof onCopied === "function") {
      await onCopied(newId);
    }
    alert(
      tAlerts?.copySuccess ??
        "We made a copy you own. You're now editing the copy."
    );
  };

  const save = async () => {
    if (writeMode === "readOnly") return;
    if (writeMode === "copyOnWrite") return;
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
