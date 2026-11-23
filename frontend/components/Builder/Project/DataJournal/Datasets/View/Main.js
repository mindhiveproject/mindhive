import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import debounce from "lodash.debounce";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { getDatasourceWriteMode } from "../../../../../../lib/dataJournalDatasources";
import { GET_DATA_JOURNALS } from "../../../../../Queries/DataArea";
import { useDataJournal } from "../../Context/DataJournalContext";
import { StyledDatasetView } from "../../styles/StyledDatasetView";

import Menu from "./Menu";
import Table from "./Table";
import useDatasourceData from "../../DataLoader/useDatasourceData";
import { useDatasetSaveOrCopy } from "./Menu/UpdateDatasource";

const AUTOSAVE_DEBOUNCE_MS = 500;

/** Shallow copies of the rows, so grid edits never touch the loaded data. */
function copyRows(rows) {
  return Array.isArray(rows) ? rows.map((row) => ({ ...row })) : rows;
}

export default function DatasetView({ dataset, user, onSaved, onCopied }) {
  const { t } = useTranslation("builder");
  const { user: ctxUser, projectId, studyId } =
    useDataJournal();
  const effectiveUser = user || ctxUser;

  // The journals of this study/board (the same query as the journal list, so
  // usually cached). A copy is attached to the journal only when there is
  // exactly one; with several it is left unattached for the student to link.
  const journalsWhere =
    projectId && studyId
      ? {
          OR: [
            { project: { id: { equals: projectId } } },
            { study: { id: { equals: studyId } } },
          ],
        }
      : projectId
        ? { project: { id: { equals: projectId } } }
        : studyId
          ? { study: { id: { equals: studyId } } }
          : null;
  const { data: journalsData } = useQuery(GET_DATA_JOURNALS, {
    variables: { where: journalsWhere },
    skip: !journalsWhere,
  });
  const journalParts = (journalsData?.vizJournals || []).flatMap(
    (vj) => vj?.vizParts || [],
  );
  const copyJournal = journalParts.length === 1 ? journalParts[0] : null;

  const writeMode = useMemo(
    () =>
      getDatasourceWriteMode(dataset, { userId: effectiveUser?.id }),
    [dataset, effectiveUser?.id],
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
  const [shareWithTeamOnCopy, setShareWithTeamOnCopy] = useState(false);
  const [copyTitle, setCopyTitle] = useState("");
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

    // the grid edits rows in place: give it copies so the loaded rows stay
    // as saved (declining a copy restores them)
    setData(copyRows(fetchedData));
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
      shareError: (message) =>
        t(
          "dataJournal.datasets.copyOnSave.shareErrorAlert",
          { message: message || "" },
          {
            default:
              "Your copy was made, but your team could not be added: {{message}}",
          },
        ),
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
    currentVizPartId: copyJournal?.id ?? null,
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

  // "Copy of <title>", which the student can rename in the prompt
  const defaultCopyTitle = useCallback(() => {
    const prefix = t("dataJournal.datasets.copyTitlePrefix", {}, {
      default: "Copy of ",
    });
    const baseTitle =
      dataset?.title ||
      t("dataJournal.datasetMenu.header.untitledDataset", {}, {
        default: "Untitled dataset",
      });
    return `${prefix}${baseTitle}`;
  }, [t, dataset?.title]);

  const openCopyModal = useCallback(() => {
    // a copy is private unless its maker chooses to share it with the team
    setShareWithTeamOnCopy(false);
    setCopyTitle(defaultCopyTitle());
    setCopyModalOpen(true);
  }, [defaultCopyTitle]);

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
    try {
      await saveAsCopyRef.current?.({
        copyTitle: copyTitle.trim() || defaultCopyTitle(),
        shareWithTeam: shareWithTeamOnCopy,
      });
      setCopyModalOpen(false);
    } catch (err) {
      // nothing was created (or only an unused file): keep the prompt open
      alert(
        t(
          "dataJournal.datasets.copyOnSave.errorAlert",
          { message: err?.message || "" },
          { default: "The copy could not be made: {{message}}" },
        ),
      );
    }
  }, [t, copyTitle, defaultCopyTitle, shareWithTeamOnCopy]);

  // Declining the copy undoes the edit: a shared dataset never changes in
  // place, so keeping the edit on screen would show work that is not saved.
  // Only in copy-first mode: an editor's changes are already saved, and the
  // loaded data is older than what is on screen.
  const handleCopyModalClose = useCallback(() => {
    setCopyModalOpen(false);
    if (writeModeRef.current !== "copyOnWrite") return;
    if (fetchedData != null) setData(copyRows(fetchedData));
    if (fetchedVariables != null) setVariables(fetchedVariables);
    if (fetchedSettings != null) setSettings(fetchedSettings);
  }, [fetchedData, fetchedVariables, fetchedSettings]);

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
            // collaborators edit in place and may also make a copy of their own
            canCopy={
              writeMode === "copyOnWrite" ||
              (writeMode === "editable" &&
                dataset?.author?.id !== effectiveUser?.id)
            }
            copyJournalTitle={copyJournal ? copyJournal.title || "" : null}
            onRequestCopy={openCopyModal}
            copyModalOpen={copyModalOpen}
            onCopyModalClose={handleCopyModalClose}
            onConfirmCopy={handleConfirmCopy}
            shareWithTeamOnCopy={shareWithTeamOnCopy}
            onShareWithTeamOnCopyChange={setShareWithTeamOnCopy}
            copyTitle={copyTitle}
            onCopyTitleChange={setCopyTitle}
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
