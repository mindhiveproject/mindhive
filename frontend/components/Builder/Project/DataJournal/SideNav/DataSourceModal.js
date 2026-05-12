import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import {
  buildDatasourcesWhere,
  canAttachDatasourceToJournal,
} from "../../../../../lib/dataJournalDatasources";
import { GET_DATASOURCES } from "../../../../Queries/Datasource";
import { UPDATE_VIZPART } from "../../../../Mutations/VizPart";
import { GET_DATA_JOURNALS } from "../../../../Queries/DataArea";
import { GET_DATA_JOURNAL } from "../../../../Queries/DataJournal";

import { useDataJournal } from "../Context/DataJournalContext"; // Adjust path

import InfoTooltip from "../../../../DesignSystem/InfoTooltip";
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
  const { projectId, studyId, user } = useDataJournal();
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

  const datasourcesWhere = useMemo(
    () => buildDatasourcesWhere({ projectId, studyId, userId: user?.id }),
    [projectId, studyId, user?.id],
  );

  const refetchQueriesWhere = useMemo(
    () =>
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
    [projectId, studyId],
  );

  const { data, loading, error, refetch } = useQuery(GET_DATASOURCES, {
    variables: { where: datasourcesWhere },
  });

  const [updateVizPart, { loading: updateLoading }] = useMutation(UPDATE_VIZPART);

  const datasources = data?.datasources || [];

  const attachDisabledHint = t(
    "dataJournal.sideNav.dataSourceModal.attachDisabledNotOwner",
    {},
    {
      default:
        "You can only attach datasets you own or may edit as a collaborator.",
    },
  );

  const canAttach = (datasource) =>
    canAttachDatasourceToJournal(datasource, user?.id);

  const handleToggleDatasource = (datasourceId, datasource, event) => {
    const already = selectedDatasources.includes(datasourceId);
    if (!canAttach(datasource) && !already) return;
    if (event.target.type !== "checkbox") {
      setSelectedDatasources((prev) =>
        prev.includes(datasourceId)
          ? prev.filter((id) => id !== datasourceId)
          : [...prev, datasourceId]
      );
    }
  };

  const handleCheckboxChange = (datasourceId, datasource, event) => {
    event.stopPropagation();
    const already = selectedDatasources.includes(datasourceId);
    if (!canAttach(datasource) && !already) return;
    setSelectedDatasources((prev) =>
      prev.includes(datasourceId)
        ? prev.filter((id) => id !== datasourceId)
        : [...prev, datasourceId]
    );
  };

  const handleSave = async () => {
    try {
      const refetchQueries = [
        {
          query: GET_DATA_JOURNALS,
          variables: { where: refetchQueriesWhere },
        },
      ];
      if (journal?.id) {
        refetchQueries.push({
          query: GET_DATA_JOURNAL,
          variables: { id: journal.id },
        });
      }
      await updateVizPart({
        variables: {
          id: journal.id,
          input: {
            datasources: {
              set: selectedDatasources.map((id) => ({ id })),
            },
          },
        },
        refetchQueries,
        awaitRefetchQueries: true,
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

                const attachOk = canAttach(datasource);
                const row = (
                  <StyledDataSourceOption
                    key={datasource.id}
                    className={isSelected ? "selected" : ""}
                    style={
                      !attachOk
                        ? { opacity: 0.55, cursor: "not-allowed" }
                        : undefined
                    }
                    onClick={(event) =>
                      handleToggleDatasource(datasource.id, datasource, event)
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!attachOk && !isSelected}
                      onChange={(event) =>
                        handleCheckboxChange(
                          datasource.id,
                          datasource,
                          event,
                        )
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
                if (!attachOk && !isSelected) {
                  return (
                    <InfoTooltip
                      key={datasource.id}
                      content={attachDisabledHint}
                      position="topLeft"
                      portal
                    >
                      <span style={{ display: "block" }}>{row}</span>
                    </InfoTooltip>
                  );
                }
                return row;
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
