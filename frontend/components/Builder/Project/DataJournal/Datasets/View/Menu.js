import { useState } from "react";
import { Accordion, Icon } from "semantic-ui-react";
import { saveAs } from "file-saver";
import moment from "moment";
import { jsonToCSV } from "react-papaparse";
import useTranslation from "next-translate/useTranslation";

import AddColumnModal from "./Menu/AddColumnModal";
import Variable from "./Menu/Variable";
import { useDatasetSave } from "./Menu/UpdateDatasource";

export default function Menu({
  dataset,
  data,
  variables,
  settings,
  components,
  updateDataset,
  onVariableChange,
  onSaved,
}) {
  const { t } = useTranslation("builder");
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(
    components.map((_, index) => index) || []
  );

  const { save, saving } = useDatasetSave({
    dataset,
    content: { modified: { data, variables, settings } },
    onSaved,
  });

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

  return (
    <div className="database">
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
        <button
          type="button"
          className="primaryAction saveAction"
          onClick={save}
          disabled={saving}
        >
          <img
            src="/assets/icons/visualize/save.svg"
            alt=""
            aria-hidden="true"
          />
          <span>
            {saving
              ? t("dataJournal.datasetMenu.actions.saving", {}, {
                  default: "Saving…",
                })
              : t("dataJournal.datasetMenu.actions.save", {}, {
                  default: "Save",
                })}
          </span>
        </button>
        <div className="metaStrip">
          <span>{dataOriginLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{lastUpdatedLabel}</span>
        </div>
      </div>

      <div className="toolbar">
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
      </div>

      <div className="variables-section">
        <div className="section-header">
          {t("dataJournal.datasetMenu.sections.userVariables", {}, {
            default: "User Variables",
          })}
        </div>
        <div className="variables">
          {variables
            .filter((column) => column.type === "user")
            .map((column, num) => (
              <Variable
                key={num}
                column={column}
                onVariableChange={onVariableChange}
              />
            ))}
        </div>
      </div>

      <div className="variables-section">
        <div className="section-header">
          {t("dataJournal.datasetMenu.sections.generalVariables", {}, {
            default: "General Variables",
          })}
        </div>
        <div className="variables">
          {variables
            .filter((column) => column.type === "general")
            .map((column, num) => (
              <Variable
                key={num}
                column={column}
                onVariableChange={onVariableChange}
              />
            ))}
        </div>
      </div>

      <Accordion exclusive={false} fluid>
        {components.map((task, index) => (
          <div key={index}>
            <Accordion.Title
              active={activeIndex.includes(index)}
              index={index}
              onClick={handleClick}
            >
              <div className="task">
                <Icon name="dropdown" />
                <div>
                  <div className="title">{task?.name}</div>
                  <div className="subtitle">
                    {task?.subtitle} - {task?.testId}
                  </div>
                </div>
              </div>
            </Accordion.Title>
            <Accordion.Content active={activeIndex.includes(index)}>
              <div className="variables-section">
                <div className="section-header">
                  {t("dataJournal.datasetMenu.sections.taskVariables", {}, {
                    default: "Task Variables",
                  })}
                </div>
                <div className="variables">
                  {variables
                    .filter((column) => column.type === "task")
                    .filter((column) => column.testId === task?.testId)
                    .map((column, num) => (
                      <Variable
                        key={num}
                        column={column}
                        onVariableChange={onVariableChange}
                      />
                    ))}
                </div>
              </div>
            </Accordion.Content>
          </div>
        ))}
      </Accordion>
    </div>
  );
}
