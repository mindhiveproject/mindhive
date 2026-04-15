import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import InfoTooltip from "../../../../DesignSystem/InfoTooltip";
import { DELETE_DATASOURCE } from "../../../../Mutations/Datasource";
import {
  getDatasourceDeleteDisabledReason,
} from "../../../../../lib/dataJournalDatasources";
import { StyledDatasetCard } from "../styles/StyledDataJournal";

export default function DatasetCard({ datasource, user, onEdit, onView }) {
  const { t } = useTranslation("builder");
  const [deleteDatasource, { loading }] = useMutation(DELETE_DATASOURCE);

  const handleEdit = () => {
    if (onEdit) onEdit(datasource);
  };

  const handleView = () => {
    if (onView) onView(datasource);
  };

  const deleteReason = getDatasourceDeleteDisabledReason(datasource, user?.id);
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

  const handleDelete = async () => {
    if (deleteDisabled) return;
    const confirmed = confirm(
      t("dataJournal.datasets.deleteConfirm", {}, {
        default: "Are you sure you want to delete this dataset?",
      }),
    );
    if (!confirmed) return;
    await deleteDatasource({
      variables: { id: datasource.id },
      refetchQueries: ["GET_DATASOURCES"],
    });
  };

  const originLabels = {
    STUDY: "Study data",
    SIMULATED: "Simulated",
    UPLOADED: "Uploaded",
    TEMPLATE: "Template",
  };

  const originLabel =
    originLabels[datasource.dataOrigin] || datasource.dataOrigin;

  const formattedDate = datasource.updatedAt
    ? new Date(datasource.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Never";

  const deleteButton = (
    <button
      type="button"
      className="delete-btn"
      onClick={(e) => {
        e.stopPropagation();
        handleDelete();
      }}
      aria-label={t("dataJournal.datasets.deleteLabel", {}, {
        default: "Delete",
      })}
      disabled={loading}
    >
      🗑️{" "}
      {t("dataJournal.datasets.deleteLabel", {}, { default: "Delete" })}
    </button>
  );

  return (
    <StyledDatasetCard>
      <div className="dataset-card" onClick={handleView}>
        <div className="dataset-header">
          <h4 className="dataset-title">
            {datasource.title || "Untitled Dataset"}
          </h4>
          <div className="dataset-actions">
            <button
              type="button"
              className="edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              aria-label={t("dataJournal.datasets.editLabel", {}, {
                default: "Edit dataset",
              })}
            >
              ✏️{" "}
              {t("dataJournal.datasets.editLabel", {}, { default: "Edit dataset" })}
            </button>
            {deleteDisabled ? (
              <InfoTooltip content={deleteTooltip} position="topRight" portal>
                <span
                  style={{ display: "inline-flex", cursor: "not-allowed" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="delete-btn"
                    aria-label={t("dataJournal.datasets.deleteLabel", {}, {
                      default: "Delete",
                    })}
                    disabled
                    style={{ pointerEvents: "none" }}
                  >
                    🗑️{" "}
                    {t("dataJournal.datasets.deleteLabel", {}, {
                      default: "Delete",
                    })}
                  </button>
                </span>
              </InfoTooltip>
            ) : (
              deleteButton
            )}
          </div>
        </div>

        <div className="dataset-meta">
          <div className="origin-badge">{originLabel}</div>
          <div className="dataset-info">
            <span className="author">
              by {datasource.author?.username || "Unknown"}
            </span>
            <span className="updated">• Last updated {formattedDate}</span>
          </div>
        </div>
      </div>
    </StyledDatasetCard>
  );
}
