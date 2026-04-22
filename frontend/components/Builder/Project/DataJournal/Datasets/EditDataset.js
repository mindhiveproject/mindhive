import { useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import InfoTooltip from "../../../../DesignSystem/InfoTooltip";
import DeleteConfirmModal from "../Helpers/DeleteConfirmModal";
import {
  UPDATE_DATASOURCE,
  DELETE_DATASOURCE,
} from "../../../../Mutations/Datasource";
import { getDatasourceDeleteDisabledReason } from "../../../../../lib/dataJournalDatasources";
import {
  StyledDataArea,
  StyledDataJournal,
  StyledRightPanel,
} from "../styles/StyledDataJournal";

export default function EditDataset({ dataset, user, onCancel, refetchDatasources }) {
  const { t } = useTranslation("builder");
  const [title, setTitle] = useState(dataset.title || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [updateDatasource] = useMutation(UPDATE_DATASOURCE, {
    onCompleted: () => {
      if (refetchDatasources) refetchDatasources();
      onCancel();
    },
    onError: (err) => setError(err.message),
  });

  const [deleteDatasource] = useMutation(DELETE_DATASOURCE, {
    onCompleted: () => {
      if (refetchDatasources) refetchDatasources();
      onCancel();
    },
    onError: (err) => setError(err.message),
  });

  const handleUpdate = () => {
    if (!title || title === dataset.title) return;
    setLoading(true);
    updateDatasource({
      variables: {
        id: dataset.id,
        data: { title },
      },
    }).finally(() => setLoading(false));
  };

  const deleteReason = getDatasourceDeleteDisabledReason(dataset, user?.id);
  const deleteDisabled = deleteReason != null;

  const deleteTooltip =
    deleteReason === "publicTemplate"
      ? t(
          "dataJournal.datasets.deleteDisabledPublicTemplate",
          {},
          {
            default:
              "This dataset is linked to a public template and cannot be deleted.",
          },
        )
      : deleteReason === "notOwner"
        ? t(
            "dataJournal.datasets.deleteDisabledNotOwner",
            {},
            {
              default: "Only the creator of this dataset can delete it.",
            },
          )
        : "";

  const handleDelete = () => {
    if (deleteDisabled) return;
    setLoading(true);
    deleteDatasource({
      variables: { id: dataset.id },
    })
      .then(() => setDeleteConfirmOpen(false))
      .finally(() => setLoading(false));
  };

  const saveDisabled = loading || !title || title === dataset.title;

  return (
    <StyledDataArea>
      <StyledDataJournal>
        <StyledRightPanel>
          <div
            style={{
              maxWidth: "520px",
              margin: "0 auto",
              padding: "20px 24px",
              background: "#ffffff",
              borderRadius: "10px",
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.05)",
              fontFamily:
                "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1.4rem",
                color: "#1a202c",
              }}
            >
              Edit dataset
            </h3>
            <p
              style={{
                marginTop: "6px",
                marginBottom: "18px",
                fontSize: "0.95rem",
                color: "#4a5568",
              }}
            >
              Update this dataset’s name or delete it if you no longer need it.
            </p>

            {error && (
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#c53030",
                  marginBottom: "10px",
                }}
              >
                Error: {error}
              </p>
            )}

            {/* Current info */}
            <div
              style={{
                marginBottom: "16px",
                fontSize: "0.85rem",
                color: "#718096",
              }}
            >
              <span style={{ fontWeight: 600, color: "#4a5568" }}>
                Dataset ID:
              </span>{" "}
              {dataset.id}
            </div>

            {/* Title field */}
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
                Dataset name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Dataset title"
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
                This name is shown in the dataset list and analysis views.
              </p>
            </div>

            {loading && (
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#718096",
                  marginBottom: "10px",
                }}
              >
                Working…
              </p>
            )}

            {/* Actions: primary save + secondary cancel + danger delete */}
            <div
              style={{
                marginTop: "18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleUpdate}
                  disabled={saveDisabled}
                  type="button"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: saveDisabled ? "#cbd5e0" : "#3182ce",
                    color: "#fff",
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    cursor: saveDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Saving…" : "Save changes"}
                </button>
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
                  Cancel
                </button>
              </div>

              {deleteDisabled ? (
                <InfoTooltip content={deleteTooltip} position="topRight" portal>
                  <span style={{ display: "inline-flex", cursor: "not-allowed" }}>
                    <button
                      type="button"
                      disabled
                      style={{
                        padding: "8px 14px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#feb2b2",
                        color: "#fff",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        cursor: "not-allowed",
                        pointerEvents: "none",
                      }}
                    >
                      {t("dataJournal.datasets.deleteLabel", {}, {
                        default: "Delete",
                      })}
                    </button>
                  </span>
                </InfoTooltip>
              ) : (
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={loading}
                  type="button"
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: loading ? "#feb2b2" : "#e53e3e",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading
                    ? t("dataJournal.datasets.deleting", {}, {
                        default: "Deleting…",
                      })
                    : t("dataJournal.datasets.deleteDataset", {}, {
                        default: "Delete dataset",
                      })}
                </button>
              )}
            </div>
            <DeleteConfirmModal
              open={deleteConfirmOpen}
              title={t("dataJournal.datasets.deleteLabel", {}, { default: "Delete" })}
              message={t("dataJournal.datasets.deleteConfirm", {}, {
                default: "Are you sure you want to delete this dataset?",
              })}
              confirmLabel={t("dataJournal.datasets.deleteDataset", {}, {
                default: "Delete dataset",
              })}
              loading={loading}
              onClose={() => setDeleteConfirmOpen(false)}
              onConfirm={handleDelete}
            />
          </div>
        </StyledRightPanel>
      </StyledDataJournal>
    </StyledDataArea>
  );
}
