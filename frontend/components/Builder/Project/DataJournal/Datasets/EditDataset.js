import { useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import Tooltip from "../../../../DesignSystem/Tooltip";
import DeleteConfirmModal from "../Helpers/DeleteConfirmModal";
import {
  UPDATE_DATASOURCE,
  DELETE_DATASOURCE,
} from "../../../../Mutations/Datasource";
import {
  canRenameDatasource,
  getDatasourceDeleteDisabledReason,
} from "../../../../../lib/dataJournalDatasources";

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
    if (renameDisabled) return;
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

  const renameDisabled = !canRenameDatasource(dataset, user?.id);

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

  const saveDisabled =
    renameDisabled || loading || !title || title === dataset.title;

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

      {renameDisabled && (
        <p
          style={{
            fontSize: "0.85rem",
            color: "#718096",
            marginBottom: "10px",
          }}
        >
          {t("dataJournal.datasets.renameDisabledNotOwner", {}, {
            default: "Only the creator of this dataset can rename it.",
          })}
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
          disabled={renameDisabled}
          style={{
            width: "100%",
            padding: "9px 11px",
            borderRadius: "6px",
            border: "1px solid #cbd5e0",
            fontSize: "0.95rem",
            outline: "none",
            opacity: renameDisabled ? 0.65 : 1,
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
          <Button
            variant="filled"
            onClick={handleUpdate}
            disabled={saveDisabled}
            type="button"
          >
            {loading
              ? t("dataJournal.datasets.saving", {}, { default: "Saving…" })
              : t("dataJournal.datasets.saveChanges", {}, {
                  default: "Save changes",
                })}
          </Button>
          <Button variant="outline" onClick={onCancel} type="button">
            {t("dataJournal.datasets.cancel", {}, { default: "Cancel" })}
          </Button>
        </div>

        {deleteDisabled ? (
          <Tooltip content={deleteTooltip} side="top">
            <span style={{ display: "inline-flex", cursor: "not-allowed" }}>
              <Button
                variant="outline"
                type="button"
                disabled
                style={{
                  color: "#c0392b",
                  borderColor: "#f5c2bf",
                  pointerEvents: "none",
                }}
              >
                {t("dataJournal.datasets.deleteLabel", {}, {
                  default: "Delete",
                })}
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={loading}
            type="button"
            style={{ color: "#c0392b", borderColor: "#f5c2bf" }}
          >
            {loading
              ? t("dataJournal.datasets.deleting", {}, {
                  default: "Deleting…",
                })
              : t("dataJournal.datasets.deleteDataset", {}, {
                  default: "Delete dataset",
                })}
          </Button>
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
  );
}
