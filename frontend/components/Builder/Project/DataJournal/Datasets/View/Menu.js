import { useState } from "react";
import { Accordion, Icon, Dropdown, DropdownMenu } from "semantic-ui-react";
import { saveAs } from "file-saver";
import moment from "moment";
import { jsonToCSV } from "react-papaparse";
import useTranslation from "next-translate/useTranslation";

import OperationModal from "./Menu/OperationModal";
import Variable from "./Menu/Variable";
import UpdateDatasource from "./Menu/UpdateDatasource";

export default function Menu({
  dataset,
  data,
  variables,
  settings,
  components,
  updateDataset,
  onVariableChange,
  setPage,
  onSave,
}) {
  const { t } = useTranslation("builder");
  const [activeIndex, setActiveIndex] = useState(
    components.map((_, index) => index) || []
  );

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

  return (
    <div className="database">
      <div className="header">
        <div>
          <img
            src="/assets/icons/visualize/database.svg"
            alt={t("dataJournal.datasetMenu.alt.database", {}, {
              default: "Database",
            })}
          />
        </div>
        <div>
          {t("dataJournal.datasetMenu.header.activeData", {}, {
            default: "Active Data",
          })}
        </div>
        <div className="header-actions">
          <div
            className="dataButtonPart menuButtonThin blueFrame"
            onClick={() => setPage("browse")}
          >
            <img
              src="/assets/icons/visualize/folder_open_blue.svg"
              alt={t("dataJournal.datasetMenu.alt.return", {}, {
                default: "Return",
              })}
            />
            <div>
              <a>
                {t("dataJournal.datasetMenu.actions.returnToNavigation", {}, {
                  default: "Return to Navigation",
                })}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="options">
        <UpdateDatasource
          dataset={dataset}
          content={{ modified: { data, variables, settings } }}
        />
        <div className="optionsFrame">
          <Dropdown
            icon={
              <div className="optionsButtonGreen">
                <img
                  src="/assets/icons/visualize/add_notes.svg"
                  alt={t("dataJournal.datasetMenu.alt.addColumn", {}, {
                    default: "Add a column",
                  })}
                />
                <div>
                  {t("dataJournal.datasetMenu.actions.addColumn", {}, {
                    default: "Add a column",
                  })}
                </div>
              </div>
            }
            direction="left"
          >
            <DropdownMenu>
              <OperationModal
                type="copy"
                data={data}
                variables={variables}
                updateDataset={updateDataset}
                title={t("dataJournal.datasetMenu.operations.copyExisting", {}, {
                  default: "Copy existing variable",
                })}
                iconSrc="/assets/icons/visualize/content_paste_go.svg"
              />
              <OperationModal
                type="compute"
                data={data}
                variables={variables}
                updateDataset={updateDataset}
                title={t("dataJournal.datasetMenu.operations.computeNew", {}, {
                  default: "Compute new variable",
                })}
                iconSrc="/assets/icons/visualize/table_chart_view.svg"
              />
              <OperationModal
                type="reverse"
                data={data}
                variables={variables}
                updateDataset={updateDataset}
                title={t("dataJournal.datasetMenu.operations.reverseScore", {}, {
                  default: "Reverse score",
                })}
                iconSrc="/assets/icons/visualize/database_reverse.svg"
              />
              <OperationModal
                type="recode"
                data={data}
                variables={variables}
                updateDataset={updateDataset}
                title={t("dataJournal.datasetMenu.operations.recodeVariable", {}, {
                  default: "Recode a variable",
                })}
                iconSrc="/assets/icons/visualize/database_recode.svg"
              />
            </DropdownMenu>
          </Dropdown>
          <div className="optionsButtonGreen" onClick={downloadData}>
            <div>
              <Icon name="download" color="grey" />
            </div>
            <div>
              <a>
                {t("dataJournal.datasetMenu.actions.download", {}, {
                  default: "Download",
                })}
              </a>
            </div>
          </div>
          <div className="optionsButtonYellow" onClick={hideAllColumns}>
            <Icon name="eye slash" color="grey" />
            <div>
              <a>
                {t("dataJournal.datasetMenu.actions.hideAll", {}, {
                  default: "Hide all",
                })}
              </a>
            </div>
          </div>
          <div className="optionsButtonYellow" onClick={showAllColumns}>
            <Icon name="eye" color="grey" />
            <div>
              <a>
                {t("dataJournal.datasetMenu.actions.showAll", {}, {
                  default: "Show all",
                })}
              </a>
            </div>
          </div>
        </div>
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
