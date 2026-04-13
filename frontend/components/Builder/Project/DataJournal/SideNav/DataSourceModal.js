import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_DATASOURCES } from "../../../../Queries/Datasource";
import { UPDATE_VIZPART } from "../../../../Mutations/VizPart";
import { GET_DATA_JOURNALS } from "../../../../Queries/DataArea";

import { useDataJournal } from "../Context/DataJournalContext"; // Adjust path

import {
  StyledModalOverlay,
  StyledModalContent,
  StyledModalHeader,
  StyledModalBody,
  StyledModalFooter,
  StyledModalClose,
  StyledModalButton,
  StyledDataSourceList,
  StyledDataSourceOption,
} from "../styles/StyledDataSourceModal"; // Adjust if moved

export default function DataSourceModal({ isOpen, onClose, journal }) {
  const { t } = useTranslation("builder");
  const { projectId, studyId } = useDataJournal(); // Use context
  const [selectedDatasources, setSelectedDatasources] = useState(
    () => journal?.datasources?.map((ds) => ds.id) || []
  );

  const journalDatasourceIdsKey = useMemo(() => {
    const list = journal?.datasources || [];
    return [...list]
      .map((d) => d.id)
      .sort()
      .join("|");
  }, [journal?.datasources]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDatasources((journal?.datasources || []).map((ds) => ds.id));
  }, [isOpen, journal?.id, journalDatasourceIdsKey]);

  const { data, loading, error, refetch } = useQuery(GET_DATASOURCES, {
    variables: {
      where:
        projectId && studyId
          ? {
              OR: [
                { project: { id: { equals: projectId } } },
                { study: { id: { equals: studyId } } },
              ],
            }
          : projectId
          ? { project: { id: { equals: projectId } } }
          : studyId
          ? { study: { id: { equals: studyId } } }
          : null,
    },
  });

  const [updateVizPart, { loading: updateLoading }] = useMutation(
    UPDATE_VIZPART,
    {
      refetchQueries: [
        {
          query: GET_DATA_JOURNALS,
          variables: {
            where:
              projectId && studyId
                ? {
                    OR: [
                      { project: { id: { equals: projectId } } },
                      { study: { id: { equals: studyId } } },
                    ],
                  }
                : projectId
                ? { project: { id: { equals: projectId } } }
                : studyId
                ? { study: { id: { equals: studyId } } }
                : null,
          },
        },
      ],
    }
  );

  const datasources = data?.datasources || [];

  const handleToggleDatasource = (datasourceId, event) => {
    // Prevent double-toggling when clicking the checkbox
    if (event.target.type !== "checkbox") {
      setSelectedDatasources((prev) =>
        prev.includes(datasourceId)
          ? prev.filter((id) => id !== datasourceId)
          : [...prev, datasourceId]
      );
    }
  };

  const handleCheckboxChange = (datasourceId, event) => {
    // Stop propagation to prevent card click handler from firing
    event.stopPropagation();
    setSelectedDatasources((prev) =>
      prev.includes(datasourceId)
        ? prev.filter((id) => id !== datasourceId)
        : [...prev, datasourceId]
    );
  };

  const handleSave = async () => {
    try {
      await updateVizPart({
        variables: {
          id: journal.id,
          input: {
            datasources: {
              set: selectedDatasources.map((id) => ({ id })),
            },
          },
        },
      });
      refetch();
      onClose();
    } catch (err) {
      console.error("Error updating journal:", err);
    }
  };

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const modalTree = (
    <StyledModalOverlay
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <StyledModalContent
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
      >
        <StyledModalHeader>
          <h2>
            {t("dataJournal.sideNav.dataSourceModal.title", {}, {
              default: "Select data sources",
            })}
          </h2>
          <StyledModalClose
            type="button"
            aria-label={t("dataJournal.sideNav.dataSourceModal.closeModal", {}, {
              default: "Close",
            })}
            onClick={onClose}
          >
            &times;
          </StyledModalClose>
        </StyledModalHeader>
        <StyledModalBody>
          {loading && (
            <div>
              {t("dataJournal.sideNav.dataSourceModal.loading", {}, {
                default: "Loading datasets...",
              })}
            </div>
          )}
          {error && (
            <div>
              {t(
                "dataJournal.sideNav.dataSourceModal.error",
                { message: error.message },
                { default: "Error: {{message}}" }
              )}
            </div>
          )}
          {!loading && !error && datasources?.length === 0 && (
            <div>
              {t("dataJournal.sideNav.dataSourceModal.noDatasets", {}, {
                default: "No datasets found",
              })}
            </div>
          )}
          {!loading && !error && (
            <StyledDataSourceList>
              {datasources.map((datasource) => {
                const isSelected = selectedDatasources.includes(datasource.id);
                const authorName =
                  datasource.author?.username ||
                  t("dataJournal.sideNav.dataSourceModal.unknownAuthor", {}, {
                    default: "Unknown",
                  });
                const originKey = datasource.dataOrigin
                  ? `dataJournal.sideNav.dataOrigin.${datasource.dataOrigin}`
                  : null;
                const originLabel = originKey
                  ? t(originKey, {}, { default: datasource.dataOrigin })
                  : datasource.dataOrigin;
                const formattedDate = datasource.updatedAt
                  ? new Date(datasource.updatedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : t("dataJournal.sideNav.dataSourceModal.neverUpdated", {}, {
                      default: "Never",
                    });

                return (
                  <StyledDataSourceOption
                    key={datasource.id}
                    className={isSelected ? "selected" : ""}
                    onClick={(event) =>
                      handleToggleDatasource(datasource.id, event)
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) =>
                        handleCheckboxChange(datasource.id, event)
                      }
                    />
                    <div className="datasource-details">
                      <div className="datasource-title">
                        {datasource.title ||
                          t("dataJournal.sideNav.dataSourceModal.untitledDataset", {}, {
                            default: "Untitled dataset",
                          })}
                      </div>
                      <div className="datasource-meta">
                        <span className="origin-badge">{originLabel}</span>
                        <span className="author">
                          {t(
                            "dataJournal.sideNav.dataSourceModal.byAuthor",
                            { author: authorName },
                            { default: "by {{author}}" }
                          )}
                        </span>
                        <span className="updated">
                          {t(
                            "dataJournal.sideNav.dataSourceModal.lastUpdated",
                            { date: formattedDate },
                            { default: "• Last updated {{date}}" }
                          )}
                        </span>
                      </div>
                    </div>
                  </StyledDataSourceOption>
                );
              })}
            </StyledDataSourceList>
          )}
        </StyledModalBody>
        <StyledModalFooter>
          <StyledModalButton className="cancel" onClick={onClose}>
            {t("dataJournal.sideNav.dataSourceModal.cancel", {}, {
              default: "Cancel",
            })}
          </StyledModalButton>
          <StyledModalButton
            className="save"
            onClick={handleSave}
            disabled={updateLoading}
          >
            {updateLoading
              ? t("dataJournal.sideNav.dataSourceModal.saving", {}, {
                  default: "Saving...",
                })
              : t("dataJournal.sideNav.dataSourceModal.save", {}, {
                  default: "Save",
                })}
          </StyledModalButton>
        </StyledModalFooter>
      </StyledModalContent>
    </StyledModalOverlay>
  );

  return createPortal(modalTree, document.body);
}
