// Add/DatasetForm.js
import Papa from "papaparse";
import { customAlphabet } from "nanoid";
import { useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../../DesignSystem/Button";
import InfoPopover from "../../../../../DesignSystem/InfoPopover";
import {
  collectSharingProfileIdsFromStudyAndProject,
  getSharingRecipientEntries,
} from "../../../../../../lib/dataJournalDatasources";
import {
  columnNamesFromUploadData,
  normalizeRowKeys,
} from "../../../../../../lib/normalizeVariableName";
import {
  DEFAULT_SIMULATED_PARTICIPANTS,
  MAX_SIMULATED_PARTICIPANTS,
  collectFlowTaskNodes,
  createSimulationSeed,
  defaultSimulationSetting,
  generateSimulatedDataset,
  normalizeSimulationSetting,
  simulationVariableKey,
  validateSimulationSetting,
} from "../../../../../../lib/simulateStudyDataset";
import SimulatedSourceConfig from "./SimulatedSourceConfig";
import useSimulationSource from "./useSimulationSource";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

export default function DatasetForm({
  datasetName,
  setDatasetName,
  dataOrigin,
  setDataOrigin,
  file,
  setFile,
  createDatasource,
  projectId,
  studyId,
  studyData,
  studyLoading,
  studyError,
  projectBoardForSharing,
  selectedVizPartId,
  currentUserId,
  canSimulate = false,
  loading,
  error,
  onCancel,
  onCreated,
}) {
  const { t } = useTranslation("builder");
  const [collaboratorsCanEdit, setCollaboratorsCanEdit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [simulationConfig, setSimulationConfig] = useState(() => ({
    participants: DEFAULT_SIMULATED_PARTICIPANTS,
    seed: createSimulationSeed(),
    variables: {},
  }));

  const isSimulated = canSimulate && dataOrigin === "SIMULATED";
  const simulationSource = useSimulationSource({
    studyId,
    skip: !isSimulated,
  });

  const participantsCount = Number(simulationConfig.participants);
  const simulationInvalid =
    !Number.isInteger(participantsCount) ||
    participantsCount < 1 ||
    participantsCount > MAX_SIMULATED_PARTICIPANTS ||
    Object.values(simulationConfig.variables).some(
      (setting) => validateSimulationSetting(setting) != null,
    );

  const buildSimulatedContent = () => {
    const { flow, variablesByTaskId } = simulationSource;
    const variables = {};
    collectFlowTaskNodes(flow).forEach((node) => {
      (variablesByTaskId[node?.componentID] || []).forEach((variable) => {
        const key = simulationVariableKey(node.id, variable.varName);
        const setting =
          simulationConfig.variables[key] || defaultSimulationSetting();
        variables[key] = normalizeSimulationSetting(setting);
      });
    });
    const config = {
      participants: participantsCount,
      seed: simulationConfig.seed,
      variables,
    };
    const { data, variables: columns, components } = generateSimulatedDataset({
      flow,
      variablesByTaskId,
      config,
    });
    return {
      simulated: {
        config,
        generatedAt: new Date().toISOString(),
        metadata: { variables: columns, settings: {} },
        components,
        data,
      },
    };
  };

  const sharingIds = useMemo(
    () =>
      collectSharingProfileIdsFromStudyAndProject(
        studyData?.study,
        projectBoardForSharing,
        currentUserId,
      ),
    [studyData?.study, projectBoardForSharing, currentUserId],
  );

  const sharingRecipientsTooltip = useMemo(() => {
    const entries = getSharingRecipientEntries(
      studyData?.study,
      projectBoardForSharing,
      currentUserId,
    );
    if (!entries.length) return "";
    return entries
      .map((e) => {
        const rolesLabel = e.roles
          .map((role) =>
            t(`dataJournal.datasets.sharing.roles.${role}`, {}, {
              default: "Collaborator",
            }),
          )
          .join(
            t("dataJournal.datasets.sharing.rolesSeparator", {}, {
              default: ", ",
            }),
          );
        return t(
          "dataJournal.datasets.sharing.tooltipRow",
          {
            name: e.username || e.id,
            roles: rolesLabel,
          },
          { default: "{{name}} — {{roles}}" },
        );
      })
      .join("\n");
  }, [studyData?.study, projectBoardForSharing, currentUserId, t]);

  const toJson = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete(results) {
          resolve(results.data);
        },
        error(err) {
          reject(err);
        },
      });
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const buildSharingPayload = () => {
    const payload = {
      collaboratorsCanEdit,
    };
    if (sharingIds.length > 0) {
      payload.collaborators = {
        connect: sharingIds.map((id) => ({ id })),
      };
    }
    if (selectedVizPartId) {
      payload.journal = { connect: [{ id: selectedVizPartId }] };
    }
    return payload;
  };

  const handleCreateDataset = async () => {
    if (!datasetName || !dataOrigin || submitting || loading) return;

    const mutationVariables = {
      data: {
        title: datasetName,
        dataOrigin: dataOrigin,
        ...(projectId && { project: { connect: { id: projectId } } }),
        ...(studyId && { study: { connect: { id: studyId } } }),
        ...buildSharingPayload(),
      },
    };

    setSubmitting(true);
    setUploadError(null);
    try {
      let createResult = null;

      if (dataOrigin === "STUDY") {
        if (!studyId || !studyData?.study) {
          // nothing to connect to – bail out early
          return;
        }
        mutationVariables.data.study = { connect: { id: studyId } };
        createResult = await createDatasource({ variables: mutationVariables });
      } else if (isSimulated) {
        if (!studyId || !simulationSource.study || simulationInvalid) return;
        mutationVariables.data.content = buildSimulatedContent();
        createResult = await createDatasource({ variables: mutationVariables });
      } else if (dataOrigin === "UPLOADED" && file) {
        let data;
        if (file.type === "application/json") {
          const text = await file.text();
          data = JSON.parse(text);
        } else {
          data = await toJson(file);
        }

        const normalizedData = data.map(normalizeRowKeys);
        const variableNames = columnNamesFromUploadData(normalizedData);
        const variables = variableNames.map((variable) => ({
          field: variable,
          type: "general",
          editable: true,
        }));

        const metadata = {
          id: nanoid(),
          payload: "upload",
          timestampUploaded: Date.now(),
          variables: variables,
        };

        const dataFile = {
          metadata,
          data: normalizedData,
        };

        const curDate = new Date();
        const date = {
          year: parseInt(curDate.getFullYear()),
          month: parseInt(curDate.getMonth()) + 1,
          day: parseInt(curDate.getDate()),
        };

        const saveRes = await fetch(
          `/api/journal-data?y=${date.year}&m=${date.month}&d=${date.day}`,
          {
            method: "POST",
            body: JSON.stringify(dataFile),
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          },
        );
        // Never create a datasource that points at a file that was not stored.
        if (!saveRes.ok) {
          const body = await saveRes.json().catch(() => ({}));
          setUploadError(body?.error || saveRes.statusText);
          return;
        }

        const fileAddress = {
          ...date,
          token: metadata?.id,
        };

        mutationVariables.data.content = {
          uploaded: {
            address: fileAddress,
            metadata: {
              id: metadata?.id,
              payload: metadata?.payload,
              timestampUploaded: metadata?.timestampUploaded,
            },
          },
        };

        createResult = await createDatasource({ variables: mutationVariables });
      }
      // TEMPLATE: reserved for future extension

      if (createResult?.data?.createDatasource && onCreated) {
        await onCreated(createResult.data.createDatasource, dataOrigin);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasStudy = !!studyData?.study;
  const currentStudyTitle = hasStudy
    ? studyData.study.title
    : t(
        "dataJournal.datasetForm.study.currentStudyMissing",
        {},
        { default: "No study linked to this project" }
      );

  const invalidSimulatedVariables = Object.values(simulationConfig.variables).filter(
    (setting) => validateSimulationSetting(setting) != null,
  ).length;

  const getCreateBlocker = () => {
    if (!datasetName) {
      return t("dataJournal.datasetForm.blockers.name", {}, {
        default: "Add a dataset name to continue.",
      });
    }
    if (!dataOrigin) {
      return t("dataJournal.datasetForm.blockers.source", {}, {
        default: "Choose a data source to continue.",
      });
    }
    if (dataOrigin === "UPLOADED" && !file) {
      return t("dataJournal.datasetForm.blockers.file", {}, {
        default: "Choose a CSV or JSON file to upload.",
      });
    }
    if ((dataOrigin === "STUDY" || dataOrigin === "SIMULATED") && !hasStudy) {
      return t("dataJournal.datasetForm.blockers.noStudy", {}, {
        default: "This project has no linked study.",
      });
    }
    if (dataOrigin === "SIMULATED") {
      if (simulationSource.loading || !simulationSource.study) {
        return t("dataJournal.datasetForm.blockers.studyLoading", {}, {
          default: "Loading the study flow…",
        });
      }
      if (
        !Number.isInteger(participantsCount) ||
        participantsCount < 1 ||
        participantsCount > MAX_SIMULATED_PARTICIPANTS
      ) {
        return t(
          "dataJournal.datasetForm.blockers.participants",
          { max: MAX_SIMULATED_PARTICIPANTS },
          { default: "The number of participants must be a whole number from 1 to {{max}}." },
        );
      }
      if (invalidSimulatedVariables > 0) {
        return t(
          "dataJournal.datasetForm.blockers.variables",
          { count: invalidSimulatedVariables },
          { default: "Fix the settings of {{count}} variable(s) marked in red." },
        );
      }
    }
    return null;
  };

  const createBlocker = submitting || loading ? null : getCreateBlocker();
  const createDisabled = submitting || loading || Boolean(createBlocker);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: isSimulated ? "1100px" : "520px",
        margin: "0 auto",
        padding: "20px 24px",
        background: "#ffffff",
        borderRadius: "10px",
        boxShadow:
          "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.05)",
      }}
    >
      <h3
        className="MH-Type-Title-Large"
        style={{
          margin: 0,
          color: "#1a202c",
        }}
      >
        {t("dataJournal.datasetForm.title", {}, { default: "New dataset" })}
      </h3>
      <p
        className="MH-Type-Body-Base"
        style={{
          marginTop: "6px",
          marginBottom: "18px",
          color: "#4a5568",
        }}
      >
        {t("dataJournal.datasetForm.subtitle", {}, {
          default: "Name your dataset and choose where the data should come from.",
        })}
      </p>

      {/* Dataset name */}
      <div style={{ marginBottom: "20px" }}>
        <label
          className="MH-Type-Label-Base"
          style={{
            display: "block",
            marginBottom: "6px",
            color: "#2d3748",
          }}
        >
          {t("dataJournal.datasetForm.nameLabel", {}, { default: "Dataset name" })}
        </label>
        <input
          className="MH-Type-Body-Base"
          type="text"
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
          placeholder={t("dataJournal.datasetForm.namePlaceholder", {}, {
            default: "e.g. Pre-test responses, Spring 2026",
          })}
          style={{
            width: "100%",
            padding: "9px 11px",
            borderRadius: "6px",
            border: "1px solid #cbd5e0",
            outline: "none",
          }}
        />
        <p
          className="MH-Type-Body-Base"
          style={{
            marginTop: "6px",
            marginBottom: 0,
            color: "#a0aec0",
          }}
        >
          {t("dataJournal.datasetForm.nameHelp", {}, {
            default: "You can rename this later from the dataset settings.",
          })}
        </p>
      </div>

      {/* Status / errors */}
      {(loading || studyLoading) && (
        <p
          className="MH-Type-Body-Base"
          style={{
            color: "#718096",
            marginBottom: "10px",
          }}
        >
          {t("dataJournal.datasetForm.loadingDataSources", {}, {
            default: "Loading data sources…",
          })}
        </p>
      )}
      {error && (
        <p
          className="MH-Type-Body-Base"
          style={{
            color: "#c53030",
            marginBottom: "10px",
          }}
        >
          {t("dataJournal.datasetForm.errorCreatingDataset", {}, {
            default: "Error creating dataset:",
          })}{" "}
          {error.message}
        </p>
      )}
      {uploadError && (
        <p
          className="MH-Type-Body-Base"
          style={{
            color: "#c53030",
            marginBottom: "10px",
          }}
        >
          {t("dataJournal.datasetForm.errorUploadingFile", {}, {
            default: "Error uploading file:",
          })}{" "}
          {uploadError}
        </p>
      )}
      {studyError && (
        <p
          className="MH-Type-Body-Base"
          style={{
            color: "#c53030",
            marginBottom: "10px",
          }}
        >
          {t("dataJournal.datasetForm.errorLoadingStudy", {}, {
            default: "Error loading study:",
          })}{" "}
          {studyError.message}
        </p>
      )}

      {/* Data origin */}
      <fieldset
        style={{
          margin: 0,
          padding: "12px 12px 10px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        <legend
          className="MH-Type-Label-Base"
          style={{
            padding: "0 6px",
            color: "#2d3748",
          }}
        >
          {t("dataJournal.datasetForm.dataSourceLabel", {}, {
            default: "Data source",
          })}
        </legend>

        {/* Study option */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            padding: "8px 6px",
            borderRadius: "6px",
            cursor: hasStudy ? "pointer" : "not-allowed",
            opacity: hasStudy ? 1 : 0.6,
          }}
        >
          <input
            type="radio"
            name="dataOrigin"
            value="STUDY"
            checked={dataOrigin === "STUDY"}
            onChange={(e) => hasStudy && setDataOrigin(e.target.value)}
            style={{ marginRight: "8px", marginTop: "3px" }}
            disabled={!hasStudy}
          />
          <div>
            <div
              className="MH-Type-Label-Large"
              style={{ color: "#2d3748" }}
            >
              {t("dataJournal.datasetForm.study.optionTitle", {}, {
                default: "Use data from the current study",
              })}
            </div>
            <div
              className="MH-Type-Body-Base"
              style={{
                color: hasStudy ? "#4a5568" : "#c53030",
                marginTop: "2px",
              }}
            >
              {hasStudy
                ? t(
                    "dataJournal.datasetForm.study.currentStudy",
                    { title: currentStudyTitle },
                    { default: "Study: {{title}}" }
                  )
                : t("dataJournal.datasetForm.study.optionDisabled", {}, {
                    default:
                      "No study is linked to this project. Link a study to enable this option.",
                  })}
            </div>
          </div>
        </label>

        {/* Upload option */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            padding: "8px 6px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          <input
            type="radio"
            name="dataOrigin"
            value="UPLOADED"
            checked={dataOrigin === "UPLOADED"}
            onChange={(e) => setDataOrigin(e.target.value)}
            style={{ marginRight: "8px", marginTop: "3px" }}
          />
          <div>
            <div
              className="MH-Type-Label-Large"
              style={{ color: "#2d3748" }}
            >
              {t("dataJournal.datasetForm.upload.optionTitle", {}, {
                default: "Upload a CSV or JSON file",
              })}
            </div>
            <div
              className="MH-Type-Body-Base"
              style={{
                color: "#4a5568",
                marginTop: "2px",
              }}
            >
              {t("dataJournal.datasetForm.upload.optionDescription", {}, {
                default: "Create a dataset from a file on your computer.",
              })}
            </div>

            {dataOrigin === "UPLOADED" && (
              <div style={{ marginTop: "8px" }}>
                <input
                  className="MH-Type-Body-Base"
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                />
                <div
                  className="MH-Type-Body-Base"
                  style={{
                    marginTop: "4px",
                    color: "#a0aec0",
                  }}
                >
                  {t("dataJournal.datasetForm.upload.fileHelp", {}, {
                    default: "First row should contain column names.",
                  })}
                </div>
              </div>
            )}
          </div>
        </label>

        {canSimulate && (
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              padding: "8px 6px",
              borderRadius: "6px",
              cursor: hasStudy ? "pointer" : "not-allowed",
              opacity: hasStudy ? 1 : 0.6,
            }}
          >
            <input
              type="radio"
              name="dataOrigin"
              value="SIMULATED"
              checked={dataOrigin === "SIMULATED"}
              onChange={(e) => hasStudy && setDataOrigin(e.target.value)}
              style={{ marginRight: "8px", marginTop: "3px" }}
              disabled={!hasStudy}
            />
            <div>
              <div
                className="MH-Type-Label-Large"
                style={{ color: "#2d3748" }}
              >
                {t("dataJournal.datasetForm.simulated.optionTitle", {}, {
                  default: "Simulated",
                })}
              </div>
              <div
                className="MH-Type-Body-Base"
                style={{
                  color: hasStudy ? "#4a5568" : "#c53030",
                  marginTop: "2px",
                }}
              >
                {hasStudy
                  ? t("dataJournal.datasetForm.simulated.optionDescription", {}, {
                      default:
                        "Generate a sham dataset showing what the current study could produce. Only testers can see it.",
                    })
                  : t("dataJournal.datasetForm.study.optionDisabled", {}, {
                      default:
                        "No study is linked to this project. Link a study to enable this option.",
                    })}
              </div>
            </div>
          </label>
        )}
        {isSimulated && (
          <div style={{ padding: "0 6px 8px 28px" }}>
            <SimulatedSourceConfig
              source={simulationSource}
              config={simulationConfig}
              onConfigChange={setSimulationConfig}
            />
          </div>
        )}

        {/* Template option (placeholder for later) */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            padding: "8px 6px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          <input
            type="radio"
            name="dataOrigin"
            value="TEMPLATE"
            checked={dataOrigin === "TEMPLATE"}
            onChange={(e) => setDataOrigin(e.target.value)}
            style={{ marginRight: "8px", marginTop: "3px" }}
          />
          <div>
            <div
              className="MH-Type-Label-Large"
              style={{ color: "#2d3748" }}
            >
              {t("dataJournal.datasetForm.template.optionTitle", {}, {
                default: "Copy from an existing dataset",
              })}
            </div>
            <div
              className="MH-Type-Body-Base"
              style={{
                color: "#4a5568",
                marginTop: "2px",
              }}
            >
              {t("dataJournal.datasetForm.template.optionDescription", {}, {
                default: "Choose a template dataset (coming soon).",
              })}
            </div>
          </div>
        </label>
      </fieldset>

      {(sharingIds.length > 0 || selectedVizPartId) && (
        <div
          className="MH-Type-Body-Base"
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            color: "#4a5568",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <span style={{ flex: "1 1 auto" }}>
              {sharingIds.length > 0
                ? t(
                    "dataJournal.datasets.sharing.summary",
                    { count: sharingIds.length },
                    {
                      default:
                        "This dataset will be shared with {{count}} people tied to this journal’s study or project.",
                    },
                  )
                : t("dataJournal.datasets.sharing.summaryJournalOnly", {}, {
                    default:
                      "This dataset will be linked to your current journal; collaborators may be added automatically.",
                  })}
            </span>
            {sharingIds.length > 0 && sharingRecipientsTooltip ? (
              <InfoPopover
                content={sharingRecipientsTooltip}
                ariaLabel={t(
                  "dataJournal.datasets.sharing.whoTooltipAria",
                  {},
                  { default: "Who will receive access" },
                )}
                side="top"
              />
            ) : sharingIds.length === 0 && selectedVizPartId ? (
              <InfoPopover
                content={t(
                  "dataJournal.datasets.sharing.journalOnlyTooltip",
                  {},
                  {
                    default:
                      "Collaborators from this journal’s study or project will be connected when you create the dataset.",
                  },
                )}
                ariaLabel={t(
                  "dataJournal.datasets.sharing.whoTooltipAria",
                  {},
                  { default: "Who will receive access" },
                )}
                side="top"
              />
            ) : null}
          </p>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={collaboratorsCanEdit}
              onChange={(e) => setCollaboratorsCanEdit(e.target.checked)}
            />
            <span>
              {t("dataJournal.datasets.sharing.allowEditingLabel", {}, {
                default: "Allow journal collaborators to edit this dataset",
              })}
            </span>
          </label>
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          marginTop: "18px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {createBlocker && (
          <p
            id="datasetFormCreateBlocker"
            className="MH-Type-Body-Base"
            role="status"
            style={{
              margin: "0 auto 0 0",
              color: "var(--MH-Theme-Error-Dark, #b3261e)",
            }}
          >
            {createBlocker}
          </p>
        )}
        <Button variant="outline" onClick={onCancel} type="button">
          {t("dataJournal.datasetForm.actions.cancel", {}, { default: "Cancel" })}
        </Button>
        <Button
          variant="filled"
          onClick={handleCreateDataset}
          disabled={createDisabled}
          aria-describedby={createBlocker ? "datasetFormCreateBlocker" : undefined}
          type="button"
        >
          {t("dataJournal.datasetForm.actions.create", {}, {
            default: "Create dataset",
          })}
        </Button>
      </div>
    </div>
  );
}
