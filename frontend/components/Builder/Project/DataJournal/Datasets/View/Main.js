import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import debounce from "lodash.debounce";
import useTranslation from "next-translate/useTranslation";

import { getDatasourceWriteMode } from "../../../../../../lib/dataJournalDatasources";
import { useDataJournal } from "../../Context/DataJournalContext";
import { StyledDatasetView } from "../../styles/StyledDatasetView";

import Menu from "./Menu";
import Table from "./Table";
import useDatasourceData from "../../DataLoader/useDatasourceData";
import { useDatasetSaveOrCopy } from "./Menu/UpdateDatasource";

const AUTOSAVE_DEBOUNCE_MS = 500;

export default function DatasetView({ dataset, user, onSaved, onCopied }) {
  const { t } = useTranslation("builder");
  const { user: ctxUser, projectId, studyId, selectedJournal } =
    useDataJournal();
  const effectiveUser = user || ctxUser;
  const currentVizPartId = selectedJournal?.id ?? null;

  const writeMode = useMemo(
    () =>
      getDatasourceWriteMode(dataset, {
        userId: effectiveUser?.id,
        currentVizPartId,
      }),
    [dataset, effectiveUser?.id, currentVizPartId],
  );

  const {
    data: fetchedData,
    variables: fetchedVariables,
    settings: fetchedSettings,
    components: fetchedComponents = [],
    loading: fetchLoading,
    error: fetchError,
    emptyReason: fetchedEmptyReason,
  } = useDatasourceData({ datasource: dataset, user: effectiveUser });

  const [data, setData] = useState([]);
  const [variables, setVariables] = useState([]);
  const [settings, setSettings] = useState({ filter: {} });
  const [components, setComponents] = useState([]);
  const [emptyReason, setEmptyReason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [collaboratorsCanEditOnCopy, setCollaboratorsCanEditOnCopy] =
    useState(true);
  /** Only hydrate from network when switching datasets — not after each autosave. */
  const [hydratedForId, setHydratedForId] = useState(null);

  const writeModeRef = useRef(writeMode);
  writeModeRef.current = writeMode;

  useEffect(() => {
    setCopyModalOpen(false);
  }, [dataset?.id]);

  useEffect(() => {
    if (
      fetchedData == null ||
      fetchedVariables == null ||
      fetchedSettings == null
    ) {
      return;
    }
    if (fetchLoading) return;
    if (hydratedForId === dataset?.id) return;

    setData(fetchedData);
    setVariables(fetchedVariables);
    setSettings(fetchedSettings);
    setComponents(Array.isArray(fetchedComponents) ? fetchedComponents : []);
    setEmptyReason(fetchedEmptyReason || null);
    setHydratedForId(dataset?.id ?? null);
    setLoading(false);
  }, [
    dataset?.id,
    fetchedData,
    fetchedVariables,
    fetchedSettings,
    fetchedComponents,
    fetchedEmptyReason,
    fetchLoading,
    hydratedForId,
  ]);

  useEffect(() => {
    if (fetchError) {
      setError(fetchError);
      setLoading(false);
    }
  }, [fetchError]);

  const content = useMemo(
    () => ({ modified: { data, variables, settings } }),
    [data, variables, settings],
  );

  const tAlerts = useMemo(
    () => ({
      updated: t("dataJournal.datasetMenu.alerts.updated", {}, {
        default: "The data has been updated",
      }),
      copySuccess: t("dataJournal.datasets.copyOnSave.successAlert", {}, {
        default:
          "We made a copy you own. You're now editing the copy.",
      }),
      error: (statusText) =>
        t(
          "dataJournal.datasetMenu.alerts.saveError",
          { statusText: statusText || "" },
          { default: "There was an error: {{statusText}}" },
        ),
    }),
    [t],
  );

  const { saveInPlace, saveAsCopy, saving } = useDatasetSaveOrCopy({
    dataset,
    content,
    writeMode,
    currentVizPartId,
    projectId,
    studyId,
    onSaved,
    onCopied,
    tAlerts,
  });

  const saveInPlaceRef = useRef(saveInPlace);
  saveInPlaceRef.current = saveInPlace;
  const saveAsCopyRef = useRef(saveAsCopy);
  saveAsCopyRef.current = saveAsCopy;

  const debouncedSaveRef = useRef(null);

  useEffect(() => {
    const d = debounce(() => {
      if (writeModeRef.current !== "editable") return;
      saveInPlaceRef.current?.({ quiet: true });
    }, AUTOSAVE_DEBOUNCE_MS);
    debouncedSaveRef.current = d;
    return () => {
      d.cancel();
    };
  }, [dataset?.id]);

  useEffect(
    () => () => {
      debouncedSaveRef.current?.flush?.();
    },
    [],
  );

  const openCopyModal = useCallback(() => {
    setCollaboratorsCanEditOnCopy(dataset?.collaboratorsCanEdit !== false);
    setCopyModalOpen(true);
  }, [dataset?.collaboratorsCanEdit]);

  const schedulePersist = useCallback(() => {
    const mode = writeModeRef.current;
    if (mode === "readOnly") return;
    if (mode === "copyOnWrite") {
      openCopyModal();
      return;
    }
    debouncedSaveRef.current?.();
  }, [openCopyModal]);

  const updateDataset = useCallback(
    ({ updatedVariables, updatedSettings, updatedData }) => {
      if (updatedVariables) setVariables(updatedVariables);
      if (updatedSettings) setSettings(updatedSettings);
      if (updatedData) setData(updatedData);
      schedulePersist();
    },
    [schedulePersist],
  );

  const onVariableChange = useCallback(
    ({ variable, property, value }) => {
      setVariables((prev) => {
        let updatedVariables = prev.map((v) =>
          v.field === variable ? { ...v, [property]: value } : v,
        );
        if (property === "isDeleted" && value === true) {
          updatedVariables = updatedVariables.filter(
            (v) => v.field !== variable,
          );
        }
        return updatedVariables;
      });
      schedulePersist();
    },
    [schedulePersist],
  );

  const handleConfirmCopy = useCallback(async () => {
    const prefix = t("dataJournal.datasets.copyTitlePrefix", {}, {
      default: "Copy of ",
    });
    const baseTitle =
      dataset?.title ||
      t("dataJournal.datasetMenu.header.untitledDataset", {}, {
        default: "Untitled dataset",
      });
    await saveAsCopyRef.current?.({
      copyTitle: `${prefix}${baseTitle}`,
      collaboratorsCanEdit: collaboratorsCanEditOnCopy,
    });
    setCopyModalOpen(false);
  }, [t, dataset?.title, collaboratorsCanEditOnCopy]);

  const handleCopyModalClose = useCallback(() => {
    setCopyModalOpen(false);
  }, []);

  const gridReadOnly = writeMode === "readOnly";
  const awaitingInitialHydration = hydratedForId !== dataset?.id;
  const isGridEmpty = !data?.length;

  if ((loading || fetchLoading) && awaitingInitialHydration) {
    return (
      <div>
        {t("dataJournal.datasets.view.loading", {}, {
          default: "Loading dataset…",
        })}
      </div>
    );
  }
  if (error || fetchError) {
    return (
      <div style={{ color: "red" }}>
        {t(
          "dataJournal.datasets.view.error",
          { message: error?.message || fetchError?.message },
          { default: "Error: {{message}}" },
        )}
      </div>
    );
  }

  return (
    <StyledDatasetView>
      <div className="dataset-content">
        <div className="left-panel">
          <Menu
            dataset={dataset}
            data={data}
            variables={variables}
            components={components}
            updateDataset={updateDataset}
            onVariableChange={onVariableChange}
            writeMode={writeMode}
            copyModalOpen={copyModalOpen}
            onCopyModalClose={handleCopyModalClose}
            onConfirmCopy={handleConfirmCopy}
            collaboratorsCanEditOnCopy={collaboratorsCanEditOnCopy}
            onCollaboratorsCanEditOnCopyChange={setCollaboratorsCanEditOnCopy}
            saving={saving}
          />
        </div>

        <div className="right-panel">
          {isGridEmpty ? (
            <div className="datasetEmpty">
              <p className="datasetEmptyTitle">
                {t("dataJournal.datasets.view.empty.title", {}, {
                  default: "This dataset is empty",
                })}
              </p>
              <p className="datasetEmptyBody">
                {emptyReason === "noneIncluded"
                  ? t("dataJournal.datasets.view.empty.noneIncluded", {}, {
                      default:
                        "No participants are included in the analysis yet. Include them in Test & Collect, then return here.",
                    })
                  : t("dataJournal.datasets.view.empty.generic", {}, {
                      default: "There are no rows to display.",
                    })}
              </p>
            </div>
          ) : (
            <Table
              data={data}
              variables={variables}
              settings={settings}
              updateDataset={updateDataset}
              readOnly={gridReadOnly}
            />
          )}
        </div>
      </div>
    </StyledDatasetView>
  );
}
