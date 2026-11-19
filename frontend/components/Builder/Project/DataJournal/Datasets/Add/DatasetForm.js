// Add/DatasetForm.js
import Papa from "papaparse";
import { customAlphabet } from "nanoid";
import { useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../../DesignSystem/Button";
import Checkbox from "../../../../../DesignSystem/Checkbox";
import Input from "../../../../../DesignSystem/Input";
import Radio from "../../../../../DesignSystem/Radio";
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

const TEXT_STRONG = "var(--MH-Theme-Neutrals-Black, #171717)";
const TEXT_MUTED = "var(--MH-Theme-Neutrals-Dark, #6A6A6A)";
const TEXT_ERROR = "var(--MH-Theme-Error-Dark, #b3261e)";

/**
 * One data source choice: a bordered row with a radio, a title and a
 * description, highlighted when selected. Extra content (file picker,
 * simulation settings) renders inside the row once it is selected.
 */
function SourceOption({
  value,
  selected,
  disabled = false,
  onSelect,
  title,
  description,
  descriptionTone = "muted",
  badge = null,
  children = null,
}) {
  const titleId = `datasetSource-${value}`;
  return (
    <div
      role="presentation"
      onClick={() => !disabled && !selected && onSelect(value)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 4,
        padding: "2px 12px 8px 2px",
        borderRadius: 8,
        border: `1px solid ${
          selected ? "var(--MH-Theme-Primary-Dark, #336F8A)" : "#E6E6E6"
        }`,
        background: selected ? "var(--MH-Theme-Primary-Lighter, #F4F8F7)" : "#FFFFFF",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <Radio
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect(value)}
        ariaLabelledBy={titleId}
      />
      <div style={{ flex: "1 1 auto", minWidth: 0, paddingTop: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span id={titleId} className="MH-Type-Label-Large" style={{ color: TEXT_STRONG }}>
            {title}
          </span>
          {badge}
        </div>
        {description ? (
          <div
            className="MH-Type-Body-Base"
            style={{
              color: descriptionTone === "error" ? TEXT_ERROR : TEXT_MUTED,
              marginTop: 2,
            }}
          >
            {description}
          </div>
        ) : null}
        {children ? (
          <div style={{ marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

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
        maxWidth: isSimulated ? "1100px" : "720px",
        margin: "12px auto 0",
        padding: "16px 24px",
        boxSizing: "border-box",
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
          color: TEXT_STRONG,
        }}
      >
        {t("dataJournal.datasetForm.title", {}, { default: "New dataset" })}
      </h3>
      <p
        className="MH-Type-Body-Base"
        style={{
          marginTop: "2px",
          marginBottom: "12px",
          color: TEXT_MUTED,
        }}
      >
        {t("dataJournal.datasetForm.subtitle", {}, {
          default: "Name your dataset and choose where the data should come from.",
        })}
      </p>

      {/* Dataset name */}
      <div style={{ marginBottom: "12px" }}>
        <Input
          label={t("dataJournal.datasetForm.nameLabel", {}, { default: "Dataset name" })}
          value={datasetName}
          onChange={setDatasetName}
          placeholder={t("dataJournal.datasetForm.namePlaceholder", {}, {
            default: "e.g. Pre-test responses, Spring 2026",
          })}
        />
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
      <fieldset style={{ margin: 0, padding: 0, border: "none", minWidth: 0 }}>
        <legend
          className="MH-Type-Label-Base"
          style={{ padding: 0, marginBottom: 8, color: TEXT_STRONG }}
        >
          {t("dataJournal.datasetForm.dataSourceLabel", {}, {
            default: "Data source",
          })}
        </legend>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 8,
          }}
        >
          <SourceOption
            value="STUDY"
            selected={dataOrigin === "STUDY"}
            disabled={!hasStudy}
            onSelect={setDataOrigin}
            title={t("dataJournal.datasetForm.study.optionTitle", {}, {
              default: "Use data from the current study",
            })}
            description={
              hasStudy
                ? t(
                    "dataJournal.datasetForm.study.currentStudy",
                    { title: currentStudyTitle },
                    { default: "Study: {{title}}" },
                  )
                : studyLoading
                  ? t("dataJournal.datasetForm.study.loading", {}, {
                      default: "Loading the study…",
                    })
                  : t("dataJournal.datasetForm.study.optionDisabled", {}, {
                      default:
                        "No study is linked to this project. Link a study to enable this option.",
                    })
            }
            descriptionTone={hasStudy || studyLoading ? "muted" : "error"}
          />

          <SourceOption
            value="UPLOADED"
            selected={dataOrigin === "UPLOADED"}
            onSelect={setDataOrigin}
            title={t("dataJournal.datasetForm.upload.optionTitle", {}, {
              default: "Upload a CSV or JSON file",
            })}
            description={
              dataOrigin === "UPLOADED"
                ? null
                : t("dataJournal.datasetForm.upload.optionDescription", {}, {
                    default: "Create a dataset from a file on your computer.",
                  })
            }
          >
            {dataOrigin === "UPLOADED" ? (
              <>
                <input
                  className="MH-Type-Body-Small"
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  style={{ maxWidth: "100%" }}
                />
                <div
                  className="MH-Type-Body-Small"
                  style={{ marginTop: 2, color: TEXT_MUTED }}
                >
                  {t("dataJournal.datasetForm.upload.fileHelp", {}, {
                    default: "First row should contain column names.",
                  })}
                </div>
              </>
            ) : null}
          </SourceOption>

          {canSimulate && (
            <SourceOption
              value="SIMULATED"
              selected={dataOrigin === "SIMULATED"}
              disabled={!hasStudy}
              onSelect={setDataOrigin}
              title={t("dataJournal.datasetForm.simulated.optionTitle", {}, {
                default: "Simulated",
              })}
              description={
                hasStudy
                  ? t("dataJournal.datasetForm.simulated.optionDescription", {}, {
                      default:
                        "Generate a sham dataset showing what the current study could produce. Only testers can see it.",
                    })
                  : studyLoading
                  ? t("dataJournal.datasetForm.study.loading", {}, {
                      default: "Loading the study…",
                    })
                  : t("dataJournal.datasetForm.study.optionDisabled", {}, {
                      default:
                        "No study is linked to this project. Link a study to enable this option.",
                    })
              }
              descriptionTone={hasStudy || studyLoading ? "muted" : "error"}
            />
          )}

        </div>
        {isSimulated ? (
          <div style={{ marginTop: 12 }}>
            <SimulatedSourceConfig
              source={simulationSource}
              config={simulationConfig}
              onConfigChange={setSimulationConfig}
            />
          </div>
        ) : null}
      </fieldset>

      {(sharingIds.length > 0 || selectedVizPartId) && (
        <div
          className="MH-Type-Body-Base"
          style={{
            marginTop: 8,
            marginLeft: -12,
            display: "flex",
            alignItems: "center",
            gap: 2,
            color: TEXT_STRONG,
          }}
        >
          <Checkbox
            checked={collaboratorsCanEdit}
            onChange={setCollaboratorsCanEdit}
            ariaLabelledBy="datasetFormAllowEditing"
          />
          <span
            id="datasetFormAllowEditing"
            style={{ cursor: "pointer", marginRight: 6 }}
            onClick={() => setCollaboratorsCanEdit((v) => !v)}
          >
            {t("dataJournal.datasets.sharing.allowEditingLabel", {}, {
              default: "Allow journal collaborators to edit this dataset",
            })}
          </span>
          <InfoPopover
            content={
              <span style={{ display: "block", maxWidth: 320 }}>
                {sharingIds.length > 0
                  ? t(
                      "dataJournal.datasets.sharing.summary",
                      { count: sharingIds.length },
                      {
                        default:
                          "Everyone working on this study or project can see this dataset. {{count}} of them will be added as collaborators.",
                      },
                    )
                  : t("dataJournal.datasets.sharing.summaryJournalOnly", {}, {
                      default:
                        "This dataset will be linked to your current journal; collaborators may be added automatically.",
                    })}
                {sharingRecipientsTooltip ? (
                  <span style={{ display: "block", marginTop: 6 }}>
                    {sharingRecipientsTooltip}
                  </span>
                ) : null}
              </span>
            }
            ariaLabel={t(
              "dataJournal.datasets.sharing.whoTooltipAria",
              {},
              { default: "Who will receive access" },
            )}
            side="top"
          />
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          marginTop: "12px",
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
