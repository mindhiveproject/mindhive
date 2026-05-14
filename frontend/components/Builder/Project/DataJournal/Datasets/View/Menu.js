import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Accordion, Icon } from "semantic-ui-react";
import { saveAs } from "file-saver";
import moment from "moment";
import { jsonToCSV } from "react-papaparse";
import useTranslation from "next-translate/useTranslation";

import InfoTooltip from "../../../../../DesignSystem/InfoTooltip";
import Chips from "../../../../../DesignSystem/Chip";
import AddColumnModal from "./Menu/AddColumnModal";
import Variable from "./Menu/Variable";
import { useDatasetSaveOrCopy } from "./Menu/UpdateDatasource";
import DeleteConfirmModal from "../../Helpers/DeleteConfirmModal";

function TaskAccordionItem({
  task,
  index,
  isOpen,
  handleClick,
  variables,
  renderFilteredVariableRows,
  t,
}) {
  const panelRef = useRef(null);
  const wasOpenRef = useRef(isOpen);

  useLayoutEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          panelRef.current?.focus({ preventScroll: false });
        });
      });
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const taskName = task?.name || "";
  const panelId = `dj-dataset-task-vars-${task?.testId ?? index}`;
  const triggerId = `${panelId}-trigger`;

  const expandLabel = t(
    "dataJournal.datasetMenu.taskAccordion.expand",
    {},
    { default: "Expand" },
  );
  const collapseLabel = t(
    "dataJournal.datasetMenu.taskAccordion.collapse",
    {},
    { default: "Collapse" },
  );
  const chipAria = isOpen
    ? t(
        "dataJournal.datasetMenu.taskAccordion.collapseChipAria",
        { name: taskName },
        { default: "Collapse variables for {{name}}" },
      )
    : t(
        "dataJournal.datasetMenu.taskAccordion.expandChipAria",
        { name: taskName },
        { default: "Expand variables for {{name}}" },
      );
  const panelAriaLabel = t(
    "dataJournal.datasetMenu.taskAccordion.panelAriaLabel",
    { name: taskName },
    { default: "Variables for {{name}}" },
  );

  const taskColumns = variables.filter(
    (column) =>
      column.type === "task" && column.testId === task?.testId,
  );

  return (
    <div>
      <Accordion.Title
        active={isOpen}
        index={index}
        onClick={handleClick}
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <div className="task">
          <div>
            <div className="title">{task?.name}</div>
            <div className="subtitle">
              {task?.subtitle}
              {isOpen &&
              task?.testId != null &&
              String(task.testId).trim() !== "" ? (
                <>
                  {task?.subtitle ? " - " : null}
                  {task.testId}
                </>
              ) : null}
            </div>
          </div>
          <Chips
            label={isOpen ? collapseLabel : expandLabel}
            selected={isOpen}
            shape="square"
            style={{ fontSize: "12px" }}
            ariaLabel={chipAria}
            leading={
              isOpen ? (
                <img src="/assets/icons/collapse.svg" alt="collapse" style={{opacity: 0.75, width: 16, height: 16}}/>
              ) : (
                <img src="/assets/icons/expand.svg" alt="expand" style={{opacity: 0.75, width: 16, height: 16}}/>
              )
            }
       
          />
        </div>
      </Accordion.Title>
      <Accordion.Content active={isOpen}>
        <div
          ref={panelRef}
          id={panelId}
          tabIndex={-1}
          className="variables"
          role="region"
          aria-label={panelAriaLabel}
        >
          {renderFilteredVariableRows(
            taskColumns,
            `task-var-${task?.testId ?? index}`,
          )}
        </div>
      </Accordion.Content>
    </div>
  );
}

export default function Menu({
  dataset,
  data,
  variables,
  settings,
  components,
  updateDataset,
  onVariableChange,
  onSaved,
  onCopied,
  writeMode,
  currentVizPartId,
  projectId,
  studyId,
}) {
  const { t } = useTranslation("builder");
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [collaboratorsCanEditOnCopy, setCollaboratorsCanEditOnCopy] =
    useState(true);
  const [activeIndex, setActiveIndex] = useState([]);
  const [variableSearch, setVariableSearch] = useState("");

  const dataOrigin = dataset?.dataOrigin;
  const isUploadDataset =
    dataOrigin === "UPLOADED" || dataOrigin === "SIMULATED";
  const isStudyDataset = dataOrigin === "STUDY" || dataOrigin === "TEMPLATE";

  const canMutateStructure =
    writeMode === "editable" || writeMode === "copyOnWrite";

  const userVariables = useMemo(
    () => variables.filter((column) => column.type === "user"),
    [variables],
  );

  const generalVariables = useMemo(
    () => variables.filter((column) => column.type === "general"),
    [variables],
  );

  const uploadedVariables = useMemo(
    () => (isUploadDataset ? generalVariables : []),
    [isUploadDataset, generalVariables],
  );

  const originalVariables = useMemo(
    () => (isStudyDataset ? generalVariables : []),
    [isStudyDataset, generalVariables],
  );

  const hasAnyTaskVariables = useMemo(
    () => variables.some((column) => column.type === "task"),
    [variables],
  );

  const tasksWithVariables = useMemo(
    () =>
      (components || []).filter((task) =>
        variables.some(
          (column) =>
            column.type === "task" && column.testId === task?.testId,
        ),
      ),
    [components, variables],
  );

  const showTaskAccordion =
    (components || []).length > 0 &&
    tasksWithVariables.length > 0;

  useEffect(() => {
    setActiveIndex(tasksWithVariables.map((_, index) => index));
  }, [dataset?.id, tasksWithVariables.length]);

  const filterVariablesBySearch = (columns) => {
    const q = variableSearch.trim().toLowerCase();
    if (!q) return columns;
    return columns.filter((column) => {
      const display = String(column.displayName || "").toLowerCase();
      const field = String(column.field || "").toLowerCase();
      return display.includes(q) || field.includes(q);
    });
  };

  const hasActiveVariableSearch = variableSearch.trim().length > 0;

  const renderFilteredVariableRows = (sourceColumns, keyPrefix) => {
    const filtered = filterVariablesBySearch(sourceColumns);
    if (
      filtered.length === 0 &&
      sourceColumns.length > 0 &&
      hasActiveVariableSearch
    ) {
      return (
        <div className="variables-section__searchEmpty" role="status">
          {t(
            "dataJournal.datasetMenu.variablesSearch.noMatches",
            {},
            { default: "No variables match your search." },
          )}
        </div>
      );
    }
    return filtered.map((column, index) => (
      <Variable
        key={column.field || `${keyPrefix}-${index}`}
        column={column}
        onVariableChange={onVariableChange}
        allowRename={canMutateStructure}
      />
    ));
  };

  const tAlerts = {
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
  };

  const { save, saveAsCopy, saving } = useDatasetSaveOrCopy({
    dataset,
    content: { modified: { data, variables, settings } },
    writeMode,
    currentVizPartId,
    projectId,
    studyId,
    onSaved,
    onCopied,
    tAlerts,
  });

  const openCopyModal = () => {
    setCollaboratorsCanEditOnCopy(dataset?.collaboratorsCanEdit !== false);
    setCopyModalOpen(true);
  };

  const handleConfirmCopy = async () => {
    const prefix = t("dataJournal.datasets.copyTitlePrefix", {}, {
      default: "Copy of ",
    });
    const baseTitle =
      dataset?.title ||
      t("dataJournal.datasetMenu.header.untitledDataset", {}, {
        default: "Untitled dataset",
      });
    await saveAsCopy({
      copyTitle: `${prefix}${baseTitle}`,
      collaboratorsCanEdit: collaboratorsCanEditOnCopy,
    });
    setCopyModalOpen(false);
  };

  const handleSaveClick = () => {
    if (writeMode === "copyOnWrite") {
      openCopyModal();
      return;
    }
    save();
  };

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    let newIndex;
    if (activeIndex.includes(index)) {
      newIndex = activeIndex.filter((i) => i !== index);
    } else {
      newIndex = [...activeIndex, index];
    }
    setActiveIndex(newIndex);
  };

  const hideAllColumns = () => {
    const updatedVariables = variables.map((variable) => ({
      ...variable,
      hide: true,
    }));
    updateDataset({ updatedVariables });
  };

  const showAllColumns = () => {
    const updatedVariables = variables.map((variable) => ({
      ...variable,
      hide: false,
    }));
    updateDataset({ updatedVariables });
  };

  const downloadData = () => {
    let userInput = prompt(
      t("dataJournal.datasetMenu.downloadPrompt", {}, {
        default:
          "Give a name to the CSV you're about to download\nNo need to add '.csv' we're taking care of that!",
      })
    );
    const name = `${userInput}_${moment().format()}`;
    if (userInput !== null) {
      const visibleColumns = variables
        .filter((variable) => !variable.hide)
        .map((variable) => variable.field);
      const visibleData = data.map((row) => {
        let visibleRow = {};
        visibleColumns.forEach((column) => {
          visibleRow[column] = row[column];
        });
        return visibleRow;
      });
      const csv = jsonToCSV({ fields: visibleColumns, data: visibleData });
      const blob = new Blob([csv], {
        type: "text/csv",
      });
      saveAs(blob, `${name}.csv`);
    }
  };

  const datasetTitle =
    dataset?.title ||
    t("dataJournal.datasetMenu.header.untitledDataset", {}, {
      default: "Untitled dataset",
    });

  const dataOriginLabel = t(
    "dataJournal.datasetMenu.meta.dataOrigin",
    { origin: dataset?.dataOrigin || "—" },
    { default: "Origin: {{origin}}" },
  );

  const lastUpdatedLabel = dataset?.updatedAt
    ? t(
        "dataJournal.datasetMenu.meta.lastUpdated",
        { when: moment(dataset.updatedAt).fromNow() },
        { default: "Updated {{when}}" },
      )
    : t(
        "dataJournal.datasetMenu.meta.neverUpdated",
        {},
        { default: "Never updated" },
      );

  const collabCount = dataset?.collaborators?.length ?? 0;
  const sharedWithTooltip =
    collabCount > 0
      ? (dataset.collaborators || [])
          .map((c) => c?.username || c?.id)
          .filter(Boolean)
          .join(", ")
      : "";

  const saveLabel =
    writeMode === "copyOnWrite"
      ? t("dataJournal.datasetMenu.actions.saveAsCopy", {}, {
          default: "Save as copy…",
        })
      : t("dataJournal.datasetMenu.actions.save", {}, { default: "Save" });

  const savingLabel =
    writeMode === "copyOnWrite"
      ? t("dataJournal.datasetMenu.actions.copying", {}, {
          default: "Copying…",
        })
      : t("dataJournal.datasetMenu.actions.saving", {}, {
          default: "Saving…",
        });

  const readOnlyToolbarHint = t(
    "dataJournal.datasetMenu.readOnlyToolbarHint",
    {},
    {
      default:
        "Open this journal from a workspace to edit or copy this dataset.",
    },
  );

  return (
    <div className="database">
      <DeleteConfirmModal
        open={copyModalOpen}
        title=""
        message={t("dataJournal.datasets.copyConfirm.message", {}, {
          default:
            "A new dataset you own will be created with your changes and linked to this journal. Journal collaborators can be given access below.",
        })}
        confirmLabel={t("dataJournal.datasets.copyConfirm.confirm", {}, {
          default: "Save copy",
        })}
        confirmPrimary
        loading={saving}
        onClose={() => setCopyModalOpen(false)}
        onConfirm={handleConfirmCopy}
        extraContent={
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={collaboratorsCanEditOnCopy}
              onChange={(e) => setCollaboratorsCanEditOnCopy(e.target.checked)}
            />
            <span>
              {t("dataJournal.datasets.sharing.allowEditingLabel", {}, {
                default: "Allow journal collaborators to edit this copy",
              })}
            </span>
          </label>
        }
      />

      <div className="header">
        <img
          className="header-icon"
          src="/assets/icons/visualize/database.svg"
          alt={t("dataJournal.datasetMenu.alt.database", {}, {
            default: "Database",
          })}
        />
        <h3 className="header-title" title={datasetTitle}>
          {datasetTitle}
        </h3>
        {writeMode !== "readOnly" ? (
          <button
            type="button"
            className="primaryAction saveAction"
            onClick={handleSaveClick}
            disabled={saving}
          >
            <img
              src="/assets/icons/visualize/save.svg"
              alt=""
              aria-hidden="true"
            />
            <span>{saving ? savingLabel : saveLabel}</span>
          </button>
        ) : null}
        <div className="metaStrip">
          <span>{dataOriginLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{lastUpdatedLabel}</span>
          {collabCount > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <InfoTooltip content={sharedWithTooltip} position="topLeft" portal>
                <span style={{ cursor: "default" }}>
                  {t(
                    "dataJournal.datasetMenu.meta.sharedWithCount",
                    { count: collabCount },
                    { default: "Shared: {{count}}" },
                  )}
                </span>
              </InfoTooltip>
            </>
          ) : null}
        </div>
      </div>

      <div className="toolbar">
        {canMutateStructure ? (
          <button
            type="button"
            className="toolbarChip toolbarChip--primary"
            onClick={() => setIsAddColumnOpen(true)}
          >
            <img
              src="/assets/icons/visualize/add_notes.svg"
              alt=""
              aria-hidden="true"
            />
            <span>
              {t("dataJournal.datasetMenu.actions.addColumn", {}, {
                default: "Add a column",
              })}
            </span>
          </button>
        ) : (
          <InfoTooltip content={readOnlyToolbarHint} position="topLeft" portal>
            <span style={{ display: "inline-flex" }}>
              <button
                type="button"
                className="toolbarChip toolbarChip--primary"
                disabled
                style={{ opacity: 0.55, cursor: "not-allowed" }}
              >
                <img
                  src="/assets/icons/visualize/add_notes.svg"
                  alt=""
                  aria-hidden="true"
                />
                <span>
                  {t("dataJournal.datasetMenu.actions.addColumn", {}, {
                    default: "Add a column",
                  })}
                </span>
              </button>
            </span>
          </InfoTooltip>
        )}
        <AddColumnModal
          open={isAddColumnOpen}
          onClose={() => setIsAddColumnOpen(false)}
          data={data}
          variables={variables}
          updateDataset={updateDataset}
        />
        <button
          type="button"
          className="toolbarChip"
          onClick={downloadData}
        >
          <img
            src="/assets/icons/download.svg"
            alt=""
            aria-hidden="true"
          />
          <span>
            {t("dataJournal.datasetMenu.actions.download", {}, {
              default: "Download",
            })}
          </span>
        </button>
        {canMutateStructure ? (
          <>
            <button
              type="button"
              className="toolbarChip"
              onClick={hideAllColumns}
            >
              <img
                src="/assets/icons/eye_close.svg"
                alt=""
                aria-hidden="true"
              />
              <span>
                {t("dataJournal.datasetMenu.actions.hideAllVariables", {}, {
                  default: "Hide all variables",
                })}
              </span>
            </button>
            <button
              type="button"
              className="toolbarChip"
              onClick={showAllColumns}
            >
              <img
                src="/assets/icons/eye_open.svg"
                alt=""
                aria-hidden="true"
              />
              <span>
                {t("dataJournal.datasetMenu.actions.showAllVariables", {}, {
                  default: "Show all variables",
                })}
              </span>
            </button>
          </>
        ) : null}
      </div>

      <div className="variables-global-search">
        <input
          id="dataset-menu-variables-search"
          type="search"
          className="variables-global-search__input"
          value={variableSearch}
          onChange={(e) => setVariableSearch(e.target.value)}
          placeholder={t(
            "dataJournal.datasetMenu.variablesSearch.placeholder",
            {},
            { default: "Search variables…" },
          )}
          aria-label={t(
            "dataJournal.datasetMenu.variablesSearch.ariaLabel",
            {},
            { default: "Search variables" },
          )}
        />
      </div>

      {isStudyDataset && originalVariables.length > 0 ? (
        <div className="variables-section">
          <div className="section-header">
            {t("dataJournal.datasetMenu.sections.originalVariables", {}, {
              default: "Original variables",
            })}
          </div>
          <div className="variables">
            {renderFilteredVariableRows(originalVariables, "original-var")}
          </div>
        </div>
      ) : null}

      {showTaskAccordion ? (
        <div className="variables-section variables-section--taskAccordion">
          <div className="section-header">
            {t("dataJournal.datasetMenu.sections.taskVariables", {}, {
              default: "Task Variables",
            })}
          </div>
          <Accordion exclusive={false} fluid>
            {tasksWithVariables.map((task, index) => (
              <TaskAccordionItem
                key={task?.testId ?? index}
                task={task}
                index={index}
                isOpen={activeIndex.includes(index)}
                handleClick={handleClick}
                variables={variables}
                renderFilteredVariableRows={renderFilteredVariableRows}
                t={t}
              />
            ))}
          </Accordion>
        </div>
      ) : null}

      {isUploadDataset && uploadedVariables.length > 0 ? (
        <div className="variables-section">
          <div className="section-header">
            {t("dataJournal.datasetMenu.sections.uploadedVariables", {}, {
              default: "Uploaded variables",
            })}
          </div>
          <div className="variables">
            {renderFilteredVariableRows(uploadedVariables, "uploaded-var")}
          </div>
        </div>
      ) : null}

      {userVariables.length > 0 ? (
        <div className="variables-section">
          <div className="section-header">
            {t("dataJournal.datasetMenu.sections.userVariables", {}, {
              default: "User variables",
            })}
          </div>
          <div className="variables">
            {renderFilteredVariableRows(userVariables, "user-var")}
          </div>
        </div>
      ) : null}
    </div>
  );
}
