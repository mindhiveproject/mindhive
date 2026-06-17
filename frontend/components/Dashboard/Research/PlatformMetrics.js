import { useEffect, useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../DesignSystem/DropdownSelect";
import {
  METRICS_COLUMN_KEYS,
  buildMetricsRows,
  exportMetricsCSV,
  fetchClassOptions,
  fetchClassMetrics,
  fetchClassNetworks,
  filterRowsBySearch,
  summarizeMetricsRows,
} from "./metricsUtils";

const METRICS_DROPDOWN_TRIGGER_STYLE = {
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "15px",
};

const formatColumnLabel = (key, t) => {
  const translationKey = `metrics.columns.${key}`;
  const defaultLabels = {
    classCode: "Class code",
    classTitle: "Class title",
    networks: "Networks",
    createdAt: "Created",
    students: "Students",
    mentors: "Mentors",
    assignments: "Assignments",
    resources: "Resources",
    hasTemplateBoard: "Template board",
    dataJournals: "Data journals",
    studies_total: "Studies (total)",
    studies_participants_total: "Study participants",
    boards_total: "Boards (total)",
    boards_isMain: "Main boards",
  };

  if (defaultLabels[key]) {
    return t(translationKey, {}, { default: defaultLabels[key] });
  }

  if (key.startsWith("studies_status_")) {
    const status = key.replace("studies_status_", "");
    return t(`metrics.columns.studiesStatus.${status}`, {}, { default: status });
  }

  if (key.startsWith("studies_dataCollection_")) {
    const status = key.replace("studies_dataCollection_", "");
    return t(`metrics.columns.studiesDataCollection.${status}`, {}, {
      default: `Studies DC: ${status}`,
    });
  }

  if (key.startsWith("boards_proposal_")) {
    const status = key.replace("boards_proposal_", "");
    return t(`metrics.columns.boardsProposal.${status}`, {}, {
      default: `Proposal: ${status}`,
    });
  }

  if (key.startsWith("boards_peerFeedback_")) {
    const status = key.replace("boards_peerFeedback_", "");
    return t(`metrics.columns.boardsPeerFeedback.${status}`, {}, {
      default: `Peer feedback: ${status}`,
    });
  }

  if (key.startsWith("boards_projectReport_")) {
    const status = key.replace("boards_projectReport_", "");
    return t(`metrics.columns.boardsProjectReport.${status}`, {}, {
      default: `Report: ${status}`,
    });
  }

  return key;
};

const toISODateStart = (dateValue) => {
  if (!dateValue) return null;
  return new Date(`${dateValue}T00:00:00.000Z`).toISOString();
};

const toISODateEnd = (dateValue) => {
  if (!dateValue) return null;
  return new Date(`${dateValue}T23:59:59.999Z`).toISOString();
};

export default function PlatformMetrics() {
  const { t } = useTranslation("research");
  const [networks, setNetworks] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [networkId, setNetworkId] = useState("");
  const [classId, setClassId] = useState("");
  const [allClasses, setAllClasses] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rows, setRows] = useState([]);
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(true);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [lastLoadedCount, setLastLoadedCount] = useState(0);
  const [lastExportMessage, setLastExportMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadFilterOptions = async () => {
      setIsLoadingNetworks(true);
      setIsLoadingClasses(true);
      try {
        const [networkList, classList] = await Promise.all([
          fetchClassNetworks(),
          fetchClassOptions(),
        ]);
        if (!cancelled) {
          setNetworks(networkList);
          setClassOptions(classList);
        }
      } catch (error) {
        if (!cancelled) {
          setFeedback({
            type: "error",
            message:
              error.message ||
              t("metrics.errors.loadNetworks", {}, {
                default: "Could not load class networks.",
              }),
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingNetworks(false);
          setIsLoadingClasses(false);
        }
      }
    };

    loadFilterOptions();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const visibleRows = useMemo(
    () => filterRowsBySearch(rows, searchQuery),
    [rows, searchQuery]
  );

  const totalsRow = useMemo(
    () => summarizeMetricsRows(visibleRows),
    [visibleRows]
  );
  const networkSelectOptions = useMemo(
    () =>
      (networks || []).map((network) => ({
        value: network.id,
        label: network.title,
      })),
    [networks]
  );
  const classSelectOptions = useMemo(
    () =>
      (classOptions || []).map((classOption) => ({
        value: classOption.id,
        label: classOption.code
          ? `${classOption.title} (${classOption.code})`
          : classOption.title,
      })),
    [classOptions]
  );

  const resetFilters = () => {
    setNetworkId("");
    setClassId("");
    setAllClasses(false);
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setRows([]);
    setLastLoadedCount(0);
    setLastExportMessage("");
    setFeedback({ type: null, message: "" });
  };

  const handleLoadMetrics = async () => {
    if (!allClasses && !networkId && !classId) {
      setFeedback({
        type: "error",
        message: t("metrics.errors.noNetwork", {}, {
          default:
            "Select a class network, choose a class, or choose 'All classes' before loading metrics.",
        }),
      });
      return;
    }

    setLastExportMessage("");
    setIsLoading(true);
    setFeedback({ type: null, message: "" });

    try {
      const classes = await fetchClassMetrics({
        networkId: allClasses || classId ? null : networkId,
        classId: allClasses ? null : classId,
        dateFrom: toISODateStart(dateFrom),
        dateTo: toISODateEnd(dateTo),
        allClasses,
      });

      const nextRows = buildMetricsRows(classes);
      setRows(nextRows);
      setLastLoadedCount(nextRows.length);

      if (nextRows.length === 0) {
        setFeedback({
          type: "error",
          message: t("metrics.errors.noResults", {}, {
            default: "No classes matched the current filters.",
          }),
        });
        return;
      }

      setFeedback({
        type: "success",
        message: "",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.message ||
          t("metrics.errors.loadFailed", {}, {
            default: "Unexpected error while loading metrics.",
          }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!visibleRows.length) {
      setFeedback({
        type: "error",
        message: t("metrics.errors.noResults", {}, {
          default: "No classes matched the current filters.",
        }),
      });
      return;
    }

    const exportRows = [...visibleRows, totalsRow];
    const timestamp = new Date().toISOString().slice(0, 10);
    const scope = allClasses ? "all-classes" : networkId || "network";
    const exported = exportMetricsCSV(
      exportRows,
      `platform_metrics_${scope}_${timestamp}.csv`
    );

    if (exported) {
      setLastExportMessage(
        t("metrics.success.exported", { count: visibleRows.length }, {
          default: "Exported {{count}} class rows to CSV.",
        })
      );
      setFeedback({ type: "success", message: "" });
    }
  };

  const handleAllClassesToggle = () => {
    setAllClasses((current) => {
      const next = !current;
      if (next) {
        setNetworkId("");
        setClassId("");
      }
      return next;
    });
  };

  const showResultsSummary = feedback.type === "success" && rows.length > 0;

  return (
    <>
      <div className="filtersCard">
        <div className="cardHeader">
          <h2>
            {t("metrics.title", {}, { default: "Platform metrics" })}
          </h2>
          <span>
            {t("metrics.intro", {}, {
              default:
                "Filter classes by network and review platform counts per class.",
            })}
          </span>
        </div>

        {allClasses && (
          <div className="toast error metricsWarning">
            {t("metrics.allClassesWarning", {}, {
              default:
                "Loading all classes may take longer on large platforms. Prefer a class network when possible.",
            })}
          </div>
        )}

        <div className="fieldGroup">
          <label>
            {t("metrics.networkFilter", {}, { default: "Class network" })}
          </label>
          <DropdownSelect
            ariaLabel={t("metrics.networkFilter", {}, { default: "Class network" })}
            placeholder={
              isLoadingNetworks
                ? t("metrics.loadingNetworks", {}, { default: "Loading networks…" })
                : t("metrics.selectNetwork", {}, { default: "Select a network" })
            }
            value={networkId}
            options={networkSelectOptions}
            searchableSingle
            triggerStyle={METRICS_DROPDOWN_TRIGGER_STYLE}
            disabled={allClasses || !!classId || isLoadingNetworks}
            onChange={(next) => {
              setNetworkId(next);
              setClassId("");
              setAllClasses(false);
            }}
          />
          {classId && (
            <span>
              {t("metrics.networkDisabledHint", {}, {
                default: "Network filter is disabled while a single class is selected.",
              })}
            </span>
          )}
        </div>

        <div className="fieldGroup">
          <label>
            {t("metrics.classFilter", {}, { default: "Single class" })}
          </label>
          <DropdownSelect
            ariaLabel={t("metrics.classFilter", {}, { default: "Single class" })}
            placeholder={
              isLoadingClasses
                ? t("metrics.loadingClasses", {}, { default: "Loading classes…" })
                : t("metrics.selectClass", {}, { default: "Select a class" })
            }
            value={classId}
            options={classSelectOptions}
            searchableSingle
            triggerStyle={METRICS_DROPDOWN_TRIGGER_STYLE}
            disabled={allClasses || !!networkId || isLoadingClasses}
            onChange={(next) => {
              setClassId(next);
              setNetworkId("");
              setAllClasses(false);
            }}
          />
          {networkId && (
            <span>
              {t("metrics.classDisabledHint", {}, {
                default: "Class filter is disabled while a class network is selected.",
              })}
            </span>
          )}
        </div>

        <div className="checkboxGroup">
          <label className={allClasses ? "active" : ""}>
            <input
              type="checkbox"
              checked={allClasses}
              onChange={handleAllClassesToggle}
            />
            {t("metrics.allClasses", {}, { default: "All classes" })}
          </label>
        </div>

        <div className="fieldGroup metricsDateRow">
          <div>
            <label htmlFor="research-metrics-search">
              {t("metrics.searchClass", {}, { default: "Search class" })}
            </label>
            <input
              id="research-metrics-search"
              type="text"
              placeholder={t("metrics.searchClassPlaceholder", {}, {
                default: "Filter by class code or title",
              })}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="research-metrics-date-from">
              {t("metrics.createdFrom", {}, { default: "Created from" })}
            </label>
            <input
              id="research-metrics-date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="research-metrics-date-to">
              {t("metrics.createdTo", {}, { default: "Created to" })}
            </label>
            <input
              id="research-metrics-date-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>

        <div className="actions">
          <button
            type="button"
            className="secondary"
            onClick={resetFilters}
            disabled={isLoading}
          >
            {t("resetFilters", {}, { default: "Reset Filters" })}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={handleLoadMetrics}
            disabled={isLoading}
          >
            {isLoading
              ? t("metrics.loading", {}, { default: "Loading metrics…" })
              : t("metrics.loadMetrics", {}, { default: "Load metrics" })}
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleExportCsv}
            disabled={isLoading || visibleRows.length === 0}
          >
            {t("metrics.exportCsv", {}, { default: "Export CSV" })}
          </button>
        </div>
      </div>

      {feedback.type && (
        <div className={`toast ${feedback.type}`}>
          {showResultsSummary ? (
            <ul className="metricsSummaryList">
              <li>
                {t("metrics.success.loaded", { count: lastLoadedCount }, {
                  default: "{{count}} class rows loaded.",
                })}
              </li>
              <li>
                {t("metrics.summary.displayedRows", { count: visibleRows.length }, {
                  default: "{{count}} class displayed.",
                })}
              </li>
              {!!lastExportMessage && <li>{lastExportMessage}</li>}
            </ul>
          ) : (
            feedback.message
          )}
        </div>
      )}

      {visibleRows.length > 0 && (
        <div className="metricsResultsCard">
          <div className="metricsTableWrap">
            <table className="metricsTable">
              <thead>
                <tr>
                  {METRICS_COLUMN_KEYS.map((key) => (
                    <th key={key}>{formatColumnLabel(key, t)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={`${row.classCode}-${row.classTitle}`}>
                    {METRICS_COLUMN_KEYS.map((key) => (
                      <td key={key}>{row[key] ?? ""}</td>
                    ))}
                  </tr>
                ))}
                <tr className="metricsTotalsRow">
                  {METRICS_COLUMN_KEYS.map((key) => (
                    <td key={key}>{totalsRow[key] ?? ""}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
