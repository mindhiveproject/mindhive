import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import InfoTooltip from "../../../../DesignSystem/InfoTooltip";
import { DELETE_DATASOURCE } from "../../../../Mutations/Datasource";
import {
  getDatasourceDeleteDisabledReason,
  getDatasourceListInclusionKind,
} from "../../../../../lib/dataJournalDatasources";
import { StyledDatasetCard } from "../styles/StyledDataJournal";

function inclusionLabelAndTooltip(t, kind) {
  switch (kind) {
    case "workspace":
      return {
        label: t("dataJournal.datasets.inclusion.journalLabel", {}, {
          default: "This journal",
        }),
        tooltip: t("dataJournal.datasets.inclusion.journalTooltip", {}, {
          default: "This dataset is linked to a Data Journal you own.",
        }),
      };
    case "viaPart":
      return {
        label: t("dataJournal.datasets.inclusion.viaPartLabel", {}, {
          default: "Linked from a template",
        }),
        tooltip: t("dataJournal.datasets.inclusion.viaPartTooltip", {}, {
          default:
            "This dataset is linked to a Data Journal template.",
        }),
      };
    case "yourLibrary":
      return {
        label: t("dataJournal.datasets.inclusion.yourLibraryLabel", {}, {
          default: "Your dataset",
        }),
        tooltip: t("dataJournal.datasets.inclusion.yourLibraryTooltip", {}, {
          default:
            "You created this dataset, but it is not currently attached to this project or study. It appears here so you can find and reuse it.",
        }),
      };
    default:
      return {
        label: t("dataJournal.datasets.inclusion.otherLabel", {}, {
          default: "Also in this list",
        }),
        tooltip: t("dataJournal.datasets.inclusion.otherTooltip", {}, {
          default:
            "This dataset matched the list filter in another way (for example a public template). It may not be stored on this project or study.",
        }),
      };
  }
}

export default function DatasetCard({
  datasource,
  user,
  projectId,
  studyId,
  onEdit,
  onView,
}) {
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

  const originKey = datasource.dataOrigin
    ? `dataJournal.sideNav.dataOrigin.${datasource.dataOrigin}`
    : null;
  const originLabel = originKey
    ? t(originKey, {}, { default: datasource.dataOrigin || "" })
    : datasource.dataOrigin;

  const formattedDate = datasource.updatedAt
    ? new Date(datasource.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const inclusionKind = getDatasourceListInclusionKind(datasource, {
    projectId,
    studyId,
    userId: user?.id,
  });
  const { label: inclusionLabel, tooltip: inclusionTooltip } =
    inclusionLabelAndTooltip(t, inclusionKind);

  const authorIsUser =
    user?.id && datasource?.author?.id && datasource.author.id === user.id;
  const authorLine = authorIsUser
    ? t("dataJournal.datasets.meta.byYou", {}, { default: "by you" })
    : t(
        "dataJournal.datasets.meta.byAuthor",
        {
          author:
            datasource.author?.username ||
            t("dataJournal.datasets.meta.unknownAuthor", {}, {
              default: "Unknown",
            }),
        },
        { default: "by {{author}}" },
      );

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
      {t("dataJournal.datasets.deleteLabel", {}, { default: "Delete" })}
    </button>
  );

  return (
    <StyledDatasetCard>
      <div className="dataset-card" onClick={handleView}>
        <div className="dataset-header">
          <h4 className="dataset-title">
            {datasource.title ||
              t("dataJournal.datasets.untitled", {}, {
                default: "Untitled Dataset",
              })}
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
              {t("dataJournal.datasets.editLabel", {}, { default: "Edit dataset" })}
            </button>
            {deleteDisabled ? (
              <InfoTooltip content={deleteTooltip} position="topLeft" portal>
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
          <div className="dataset-badges" onClick={(e) => e.stopPropagation()}>
            <div className="origin-badge">{originLabel}</div>
            <InfoTooltip content={inclusionTooltip} position="topLeft" portal>
              <span className="inclusion-badge">{inclusionLabel}</span>
            </InfoTooltip>
          </div>
          <div className="dataset-info">
            <span className="author">{authorLine}</span>
            <span className="updated">
              {formattedDate
                ? `• ${t(
                    "dataJournal.datasets.meta.lastUpdated",
                    { date: formattedDate },
                    { default: "Last updated {{date}}" },
                  )}`
                : `• ${t("dataJournal.datasets.meta.lastUpdatedNever", {}, {
                    default: "Never",
                  })}`}
            </span>
          </div>
        </div>
      </div>
    </StyledDatasetCard>
  );
}
