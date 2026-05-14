// Add/DatasetForm.js
import Papa from "papaparse";
import { customAlphabet } from "nanoid";
import { useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import InfoTooltip from "../../../../../DesignSystem/InfoTooltip";
import {
  collectSharingProfileIdsFromStudyAndProject,
  getSharingRecipientEntries,
} from "../../../../../../lib/dataJournalDatasources";

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
  loading,
  error,
  onCancel,
}) {
  const { t } = useTranslation("builder");
  const [collaboratorsCanEdit, setCollaboratorsCanEdit] = useState(true);

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

  const getColumnNames = ({ data }) => {
    const allKeys = data
      .map((line) => Object.keys(line))
      .reduce((a, b) => a.concat(b), []);
    const keys = Array.from(new Set(allKeys)).sort();
    return keys;
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
    if (!datasetName || !dataOrigin) return;

    const mutationVariables = {
      data: {
        title: datasetName,
        dataOrigin: dataOrigin,
        ...(projectId && { project: { connect: { id: projectId } } }),
        ...(studyId && { study: { connect: { id: studyId } } }),
        ...buildSharingPayload(),
      },
    };

    if (dataOrigin === "STUDY") {
      if (!studyId || !studyData?.study) {
        // nothing to connect to – bail out early
        return;
      }
      mutationVariables.data.study = { connect: { id: studyId } };
      await createDatasource({ variables: mutationVariables });
    } else if (dataOrigin === "UPLOADED" && file) {
      let data;
      if (file.type === "application/json") {
        const text = await file.text();
        data = JSON.parse(text);
      } else {
        data = await toJson(file);
      }

      const variableNames = getColumnNames({ data });
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
        data: data,
      };

      const curDate = new Date();
      const date = {
        year: parseInt(curDate.getFullYear()),
        month: parseInt(curDate.getMonth()) + 1,
        day: parseInt(curDate.getDate()),
      };

      await fetch(`/api/save/?y=${date.year}&m=${date.month}&d=${date.day}`, {
        method: "POST",
        body: JSON.stringify(dataFile),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

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

      await createDatasource({ variables: mutationVariables });
    }
    // TEMPLATE: reserved for future extension
  };

  const hasStudy = !!studyData?.study;
  const currentStudyTitle = hasStudy
    ? studyData.study.title
    : t(
        "dataJournal.datasetForm.study.currentStudyMissing",
        {},
        { default: "No study linked to this project" }
      );

  const createDisabled =
    !datasetName ||
    !dataOrigin ||
    (dataOrigin === "UPLOADED" && !file) ||
    (dataOrigin === "STUDY" && !hasStudy);

  return (
    <div
      style={{
        maxWidth: "520px",
        margin: "0 auto",
        padding: "20px 24px",
        background: "#ffffff",
        borderRadius: "10px",
        boxShadow:
          "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.05)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "1.4rem",
          color: "#1a202c",
        }}
      >
        {t("dataJournal.datasetForm.title", {}, { default: "New dataset" })}
      </h3>
      <p
        style={{
          marginTop: "6px",
          marginBottom: "18px",
          fontSize: "0.95rem",
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
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#2d3748",
          }}
        >
          {t("dataJournal.datasetForm.nameLabel", {}, { default: "Dataset name" })}
        </label>
        <input
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
            fontSize: "0.95rem",
            outline: "none",
          }}
        />
        <p
          style={{
            marginTop: "6px",
            marginBottom: 0,
            fontSize: "0.8rem",
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
          style={{
            fontSize: "0.85rem",
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
          style={{
            fontSize: "0.85rem",
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
      {studyError && (
        <p
          style={{
            fontSize: "0.85rem",
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
          style={{
            padding: "0 6px",
            fontSize: "0.9rem",
            fontWeight: 600,
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
              style={{ fontWeight: 500, color: "#2d3748", fontSize: "0.95rem" }}
            >
              {t("dataJournal.datasetForm.study.optionTitle", {}, {
                default: "Use data from the current study",
              })}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
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
              style={{ fontWeight: 500, color: "#2d3748", fontSize: "0.95rem" }}
            >
              {t("dataJournal.datasetForm.upload.optionTitle", {}, {
                default: "Upload a CSV or JSON file",
              })}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
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
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  style={{ fontSize: "0.85rem" }}
                />
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "0.75rem",
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
              style={{ fontWeight: 500, color: "#2d3748", fontSize: "0.95rem" }}
            >
              {t("dataJournal.datasetForm.template.optionTitle", {}, {
                default: "Copy from an existing dataset",
              })}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
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
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: "0.85rem",
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
              <InfoTooltip
                content={sharingRecipientsTooltip}
                position="topLeft"
                portal
              >
                <button
                  type="button"
                  aria-label={t(
                    "dataJournal.datasets.sharing.whoTooltipAria",
                    {},
                    { default: "Who will receive access" },
                  )}
                  style={{
                    flex: "0 0 auto",
                    margin: 0,
                    padding: 2,
                    border: "none",
                    background: "transparent",
                    cursor: "help",
                    lineHeight: 0,
                  }}
                >
                  <img
                    src="/assets/icons/info.svg"
                    alt=""
                    width={18}
                    height={18}
                    style={{ display: "block", opacity: 0.65 }}
                  />
                </button>
              </InfoTooltip>
            ) : sharingIds.length === 0 && selectedVizPartId ? (
              <InfoTooltip
                content={t(
                  "dataJournal.datasets.sharing.journalOnlyTooltip",
                  {},
                  {
                    default:
                      "Collaborators from this journal’s study or project will be connected when you create the dataset.",
                  },
                )}
                position="topLeft"
                portal
              >
                <button
                  type="button"
                  aria-label={t(
                    "dataJournal.datasets.sharing.whoTooltipAria",
                    {},
                    { default: "Who will receive access" },
                  )}
                  style={{
                    flex: "0 0 auto",
                    margin: 0,
                    padding: 2,
                    border: "none",
                    background: "transparent",
                    cursor: "help",
                    lineHeight: 0,
                  }}
                >
                  <img
                    src="/assets/icons/info.svg"
                    alt=""
                    width={18}
                    height={18}
                    style={{ display: "block", opacity: 0.65 }}
                  />
                </button>
              </InfoTooltip>
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
          gap: "8px",
        }}
      >
        <button
          onClick={onCancel}
          type="button"
          style={{
            padding: "8px 14px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#4a5568",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          {t("dataJournal.datasetForm.actions.cancel", {}, { default: "Cancel" })}
        </button>
        <button
          onClick={handleCreateDataset}
          disabled={createDisabled}
          type="button"
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: createDisabled ? "#cbd5e0" : "#3182ce",
            color: "#fff",
            fontWeight: 500,
            fontSize: "0.9rem",
            cursor: createDisabled ? "not-allowed" : "pointer",
          }}
        >
          {t("dataJournal.datasetForm.actions.create", {}, {
            default: "Create dataset",
          })}
        </button>
      </div>
    </div>
  );
}
