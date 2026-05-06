import { useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../DesignSystem/Chip";
import CompactActionButton from "../../../../DesignSystem/CompactActionButton";
import InfoTooltip from "../../../../DesignSystem/InfoTooltip";
import DeleteConfirmModal from "../Helpers/DeleteConfirmModal";
import { DELETE_DATASOURCE } from "../../../../Mutations/Datasource";
import {
  getDatasourceDeleteDisabledReason,
  getDatasourceListInclusionKind,
} from "../../../../../lib/dataJournalDatasources";
import { StyledDatasetCard } from "../styles/StyledDataJournal";

const INCLUSION_ICON_SRC = {
  workspace: "/assets/icons/project.svg",
  viaPart: "/assets/icons/link.svg",
  yourLibrary: "/assets/icons/user.svg",
  other: "/assets/icons/info.svg",
};

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
        iconSrc: INCLUSION_ICON_SRC.workspace,
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
        iconSrc: INCLUSION_ICON_SRC.viaPart,
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
        iconSrc: INCLUSION_ICON_SRC.yourLibrary,
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
        iconSrc: INCLUSION_ICON_SRC.other,
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
    await deleteDatasource({
      variables: { id: datasource.id },
      refetchQueries: ["GET_DATASOURCES"],
    });
    setDeleteConfirmOpen(false);
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
  const {
    label: inclusionLabel,
    tooltip: inclusionTooltip,
    iconSrc: inclusionIconSrc,
  } = inclusionLabelAndTooltip(t, inclusionKind);

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

  const editLabel = t("dataJournal.datasets.editLabel", {}, {
    default: "Edit dataset",
  });
  const deleteLabel = t("dataJournal.datasets.deleteLabel", {}, {
    default: "Delete",
  });

  const deleteButton = (
    <CompactActionButton
      kind="delete"
      ariaLabel={deleteLabel}
      title={deleteLabel}
      disabled={loading}
      onClick={(e) => {
        e.stopPropagation();
        setDeleteConfirmOpen(true);
      }}
    />
  );

  const originChipLabel = t(
    "dataJournal.datasets.meta.dataOrigin",
    { origin: originLabel },
    { default: "Origin: {{origin}}" },
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
          <div className="dataset-actions" onClick={(e) => e.stopPropagation()}>
            <CompactActionButton
              icon={
                <img
                  src="/assets/icons/pencil.svg"
                  alt=""
                  aria-hidden
                  width={20}
                  height={20}
                />
              }
              ariaLabel={editLabel}
              title={editLabel}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
            />
            {deleteDisabled ? (
              <InfoTooltip content={deleteTooltip} position="topLeft" portal>
                <span
                  style={{ display: "inline-flex", cursor: "not-allowed" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <CompactActionButton
                    kind="delete"
                    ariaLabel={deleteLabel}
                    title={deleteLabel}
                    disabled
                    style={{ pointerEvents: "none" }}
                  />
                </span>
              </InfoTooltip>
            ) : (
              deleteButton
            )}
          </div>
        </div>

        <div className="dataset-meta">
          <div className="dataset-badges" onClick={(e) => e.stopPropagation()}>
            <InfoTooltip
              content={t("dataJournal.datasets.originTooltip", {}, {
                default: "How this dataset was created.",
              })}
              position="topLeft"
              portal
            >
              <span style={{ display: "inline-flex" }}>
                <Chip
                  label={originChipLabel}
                  leading={
                    <img
                      src="/assets/icons/document.svg"
                      alt=""
                      aria-hidden
                      width={20}
                      height={20}
                      style={{ opacity: 0.8 }}
                    />
                  }
                  shape="square"
                  style={{ color: "#5D5763" }}
                />
              </span>
            </InfoTooltip>
            <InfoTooltip content={inclusionTooltip} position="topLeft" portal>
              <span style={{ display: "inline-flex" }}>
                <Chip
                  label={inclusionLabel}
                  leading={
                    <img
                      src={inclusionIconSrc}
                      alt=""
                      aria-hidden
                      width={20}
                      height={20}
                    />
                  }
                  shape="square"
                  style={{ opacity: 0.8 }}
                />
              </span>
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
      <DeleteConfirmModal
        open={deleteConfirmOpen}
        title={t("dataJournal.datasets.deleteLabel", {}, { default: "Delete" })}
        message={t("dataJournal.datasets.deleteConfirm", {}, {
          default: "Are you sure you want to delete this dataset?",
        })}
        confirmLabel={t("dataJournal.datasets.deleteLabel", {}, { default: "Delete" })}
        loading={loading}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </StyledDatasetCard>
  );
}
