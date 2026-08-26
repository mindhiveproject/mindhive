import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";
import { jsonToCSV } from "react-papaparse";
import styled from "styled-components";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import Chip from "../../../../DesignSystem/Chip";
import { StarFilledIcon } from "../../../../DesignSystem/Icons";
import Tooltip from "../../../../DesignSystem/Tooltip";
import { slugifyForFilename } from "../../../../../lib/opportunityExportMedia";
import { CLASS_OPPORTUNITY_PREVIEW_LOGS } from "../../../../Queries/Log";
import { CLASS_STUDENT_OPPORTUNITY_FAVORITES } from "../../../../Queries/Opportunity";

const VIEW_MODES = {
  table: "table",
  grid: "grid",
};

function displayName(profile) {
  if (!profile) return null;
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username ||
    "—"
  );
}

function truncateLabel(label, max = 28) {
  const text = String(label || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

/** Formats a summed dwell duration, omitting zero remainders and using hours when needed. */
function formatDwellMs(dwellMs, t) {
  const totalSeconds = Math.max(0, Math.round((Number(dwellMs) || 0) / 1000));
  if (totalSeconds < 60) {
    return t(
      "opportunities.matchingRound.studentInterest.dwellSeconds",
      { count: totalSeconds },
      { default: "{{count}}s" },
    );
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    if (minutes === 0) {
      return t(
        "opportunities.matchingRound.studentInterest.dwellHours",
        { hours },
        { default: "{{hours}}h" },
      );
    }
    return t(
      "opportunities.matchingRound.studentInterest.dwellHoursMinutes",
      { hours, minutes },
      { default: "{{hours}}h {{minutes}}m" },
    );
  }

  if (seconds === 0) {
    return t(
      "opportunities.matchingRound.studentInterest.dwellMinutesOnly",
      { minutes },
      { default: "{{minutes}}m" },
    );
  }
  return t(
    "opportunities.matchingRound.studentInterest.dwellMinutes",
    { minutes, seconds },
    { default: "{{minutes}}m {{seconds}}s" },
  );
}

function formatInterestTooltip({ dwellMs, favorited, favoritedLabel, t }) {
  const parts = [];
  if (Number(dwellMs) > 0) {
    parts.push(
      t(
        "opportunities.matchingRound.studentInterest.totalPreviewTime",
        { time: formatDwellMs(dwellMs, t) },
        { default: "Total preview time: {{time}}" },
      ),
    );
  }
  if (favorited) {
    parts.push(favoritedLabel);
  }
  return parts.join("\n");
}

function includesQuery(value, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return String(value || "")
    .toLowerCase()
    .includes(q);
}

/**
 * CSV cell: visit count and dwell seconds, optionally "favorited".
 * Examples: "3;54", "3;54;favorited", "favorited", or empty.
 */
function formatInterestCsvCell(cell, favoritedLabel) {
  const hasVisit = cell?.visitCount > 0;
  const favorited = !!cell?.favorited;
  const visits = hasVisit ? Number(cell.visitCount) || 0 : null;
  const seconds = hasVisit
    ? Math.max(0, Math.round((Number(cell.dwellMs) || 0) / 1000))
    : null;

  const parts = [];
  if (hasVisit) {
    parts.push(String(visits), String(seconds));
  }
  if (favorited) {
    parts.push(favoritedLabel);
  }
  return parts.join(";");
}

function formatVisitCountLabel(count, t) {
  const n = Number(count) || 0;
  if (n === 1) {
    return t(
      "opportunities.matchingRound.studentInterest.visitCountOne",
      { count: n },
      { default: "{{count}} visit" },
    );
  }
  return t(
    "opportunities.matchingRound.studentInterest.visitCount",
    { count: n },
    { default: "{{count}} visits" },
  );
}

function buildInterestCsvFilename(roundTitle, date = new Date()) {
  const round = slugifyForFilename(roundTitle) || "round";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `interest-${round}-${yyyy}-${mm}-${dd}.csv`;
}

function downloadInterestCsv({
  studentColumnHeader,
  rows,
  opportunities,
  roundTitle,
  favoritedLabel,
}) {
  const fields = [
    studentColumnHeader,
    ...opportunities.map((opportunity) => opportunity.title || opportunity.id),
  ];
  const data = rows.map((row) => {
    const out = { [studentColumnHeader]: row.studentName };
    for (const opportunity of opportunities) {
      const title = opportunity.title || opportunity.id;
      const cell = row.interestByOpportunityId?.[opportunity.id] || null;
      out[title] = formatInterestCsvCell(cell, favoritedLabel);
    }
    return out;
  });
  const csv = jsonToCSV({ fields, data });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildInterestCsvFilename(roundTitle);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const InterestCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;

  .matchingRoundStudentInterestStar {
    flex-shrink: 0;
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

const GridShell = styled.div`
  display: grid;
  gap: 12px;

  .matchingRoundStudentInterestEmpty {
    display: grid;
    gap: 6px;
    padding: 20px 16px;
    border-radius: 12px;
    background: var(--MH-Theme-Neutrals-Extra-Light, #f8fafb);
    border: 1px solid #ece9e6;
  }

  .matchingRoundStudentInterestEmptyTitle {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .matchingRoundStudentInterestEmptyHint {
    margin: 0;
    font-size: 13px;
    color: #5c6570;
  }

  .matchingRoundStudentInterestHeader {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .matchingRoundStudentInterestHeaderText {
    display: grid;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }

  .matchingRoundStudentInterestTitle {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }

  .matchingRoundStudentInterestHint {
    margin: 0;
    font-size: 13px;
    color: #5c6570;
  }

  .matchingRoundStudentInterestHeaderActions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .matchingRoundStudentInterestModeFilters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    flex-shrink: 0;
  }

  .matchingRoundStudentInterestSearchRow {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
  }

  .matchingRoundStudentInterestSearchField {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .matchingRoundStudentInterestSearchInput {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 12px;
    border: 1px solid #ece9e6;
    border-radius: 10px;
    background: #ffffff;
    font-family: inherit;
    font-size: 13px;
    color: var(--MH-Theme-Neutrals-Black, #171717);

    &:focus {
      outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
      outline-offset: 1px;
    }
  }

  .matchingRoundStudentInterestColumnHeader {
    display: block;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ag-theme-quartz.matchingRoundStudentInterestGrid {
    width: 100%;
    height: min(480px, max(240px, calc(var(--student-interest-rows, 4) * 42px + 48px)));
    --ag-font-family: Inter, system-ui, sans-serif;
    --ag-font-size: 13px;

    .ag-header-cell-comp-wrapper {
      width: 100%;
      min-width: 0;
    }

    .ag-header-cell-comp-wrapper .DesignSystem-Tooltip-trigger {
      display: block;
      width: 100%;
      min-width: 0;
      max-width: 100%;
    }
  }

  .matchingRoundStudentInterestCards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }

  .matchingRoundStudentInterestCard {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid #ece9e6;
    min-width: 0;
  }

  .matchingRoundStudentInterestCardName {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .matchingRoundStudentInterestCardList {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .matchingRoundStudentInterestCardItem {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
  }

  .matchingRoundStudentInterestCardOpp {
    margin: 0;
    font-size: 13px;
    color: #5c6570;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .matchingRoundStudentInterestCardDwell {
    margin: 0;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--MH-Theme-Primary-Dark, #336f8a);

    .matchingRoundStudentInterestStar {
      flex-shrink: 0;
      color: var(--MH-Theme-Primary-Dark, #336f8a);
    }
  }

  .matchingRoundStudentInterestCardEmpty {
    margin: 0;
    font-size: 13px;
    color: #5c6570;
  }
`;

function InterestCellContent({ cell, t }) {
  const hasVisit = cell?.visitCount > 0;
  const favorited = !!cell?.favorited;

  if (!hasVisit && !favorited) {
    return "—";
  }

  const favoritedLabel = t(
    "opportunities.matchingRound.studentInterest.favoritedAria",
    {},
    { default: "Favorited" },
  );
  const tooltipContent = formatInterestTooltip({
    dwellMs: hasVisit ? cell.dwellMs : 0,
    favorited,
    favoritedLabel,
    t,
  });

  const cellBody = (
    <InterestCell>
      {hasVisit ? (
        <span>{formatVisitCountLabel(cell.visitCount, t)}</span>
      ) : null}
      {favorited ? (
        <StarFilledIcon
          className="matchingRoundStudentInterestStar"
          width={16}
          height={16}
          aria-label={favoritedLabel}
        />
      ) : null}
    </InterestCell>
  );

  if (!tooltipContent) {
    return cellBody;
  }

  return (
    <Tooltip content={tooltipContent} side="top" maxWidth={280}>
      {cellBody}
    </Tooltip>
  );
}

/** Truncated opportunity column header with Design System Tooltip for the full title. */
function OpportunityColumnHeader(props) {
  const fullTitle = props.fullTitle || props.displayName || "";
  const label = props.displayName || fullTitle;

  return (
    <Tooltip
      content={fullTitle}
      side="bottom"
      maxWidth={320}
      className="DesignSystem-Tooltip-trigger--fill"
    >
      <span className="matchingRoundStudentInterestColumnHeader">{label}</span>
    </Tooltip>
  );
}

/**
 * Class students × pre-selected opportunities preview interest matrix.
 * Table mode: AG Grid matrix. Grid mode: student cards with top 3 by visit count.
 * Parent can call `ref.current.downloadCsv()` for the matching-round export button.
 */
const MatchingRoundStudentInterestGrid = forwardRef(function MatchingRoundStudentInterestGrid(
  {
    classId,
    roundId,
    roundTitle = "",
    students = [],
    opportunities = [],
    enabled = false,
  },
  ref,
) {
  const { t } = useTranslation("classes");
  const gridRef = useRef(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.table);
  const [studentQuery, setStudentQuery] = useState("");
  const [opportunityQuery, setOpportunityQuery] = useState("");

  const opportunityIds = useMemo(
    () =>
      (opportunities || [])
        .map((opportunity) => opportunity?.id)
        .filter(Boolean),
    [opportunities],
  );

  const studentIds = useMemo(
    () => (students || []).map((student) => student?.id).filter(Boolean),
    [students],
  );

  const skipQueries =
    !enabled ||
    !classId ||
    !roundId ||
    opportunityIds.length === 0 ||
    studentIds.length === 0;

  const { data, loading: logsLoading } = useQuery(
    CLASS_OPPORTUNITY_PREVIEW_LOGS,
    {
      variables: { classId, opportunityIds },
      skip: skipQueries,
      fetchPolicy: "cache-and-network",
    },
  );

  const { data: favoritesData, loading: favoritesLoading } = useQuery(
    CLASS_STUDENT_OPPORTUNITY_FAVORITES,
    {
      variables: { studentIds, opportunityIds },
      skip: skipQueries,
      fetchPolicy: "cache-and-network",
    },
  );

  const loading = logsLoading || favoritesLoading;

  const interestByKey = useMemo(() => {
    const map = new Map();
    for (const log of data?.logs || []) {
      const content = log?.content || {};
      if (String(content.roundId || "") !== String(roundId || "")) continue;
      const userId = log?.user?.id;
      const opportunityId = log?.opportunity?.id;
      if (!userId || !opportunityId) continue;
      const key = `${userId}::${opportunityId}`;
      const existing = map.get(key) || {
        dwellMs: 0,
        visitCount: 0,
        favorited: false,
      };
      existing.dwellMs += Number(content.dwellMs) || 0;
      existing.visitCount += 1;
      map.set(key, existing);
    }
    return map;
  }, [data?.logs, roundId]);

  const favoriteByKey = useMemo(() => {
    const set = new Set();
    for (const profile of favoritesData?.profiles || []) {
      const studentId = profile?.id;
      if (!studentId) continue;
      for (const opportunity of profile.favoriteOpportunities || []) {
        if (!opportunity?.id) continue;
        set.add(`${studentId}::${opportunity.id}`);
      }
    }
    return set;
  }, [favoritesData?.profiles]);

  const filteredStudents = useMemo(() => {
    return (students || []).filter((student) => {
      if (!student?.id) return false;
      return includesQuery(displayName(student), studentQuery);
    });
  }, [students, studentQuery]);

  const filteredOpportunities = useMemo(() => {
    return (opportunities || []).filter((opportunity) => {
      if (!opportunity?.id) return false;
      return includesQuery(opportunity.title || opportunity.id, opportunityQuery);
    });
  }, [opportunities, opportunityQuery]);

  const buildRowsFor = useCallback(
    (studentList, opportunityList) => {
      return (studentList || [])
        .filter((student) => student?.id)
        .map((student) => {
          const interestByOpportunityId = {};
          let totalDwellMs = 0;
          let totalVisits = 0;
          let totalFavorites = 0;
          for (const opportunity of opportunityList || []) {
            if (!opportunity?.id) continue;
            const key = `${student.id}::${opportunity.id}`;
            const visitCell = interestByKey.get(key) || null;
            const favorited = favoriteByKey.has(key);
            const cell =
              visitCell || favorited
                ? {
                    dwellMs: visitCell?.dwellMs || 0,
                    visitCount: visitCell?.visitCount || 0,
                    favorited,
                  }
                : null;
            interestByOpportunityId[opportunity.id] = cell;
            if (cell) {
              totalDwellMs += cell.dwellMs;
              totalVisits += cell.visitCount;
              if (cell.favorited) totalFavorites += 1;
            }
          }
          return {
            id: student.id,
            studentName: displayName(student),
            interestByOpportunityId,
            totalDwellMs,
            totalVisits,
            totalFavorites,
          };
        })
        .sort((a, b) =>
          String(a.studentName).localeCompare(String(b.studentName), undefined, {
            sensitivity: "base",
          }),
        );
    },
    [interestByKey, favoriteByKey],
  );

  // Full matrix (unfiltered) for grid cards and visit empty-state.
  const allRowData = useMemo(
    () => buildRowsFor(students, opportunities),
    [buildRowsFor, students, opportunities],
  );

  // Filtered matrix for table view + CSV export.
  const tableRowData = useMemo(
    () => buildRowsFor(filteredStudents, filteredOpportunities),
    [buildRowsFor, filteredStudents, filteredOpportunities],
  );

  const favoritedAria = t(
    "opportunities.matchingRound.studentInterest.favoritedAria",
    {},
    { default: "Favorited" },
  );

  const studentCards = useMemo(() => {
    return tableRowData.map((row) => {
      const topOpportunities = (filteredOpportunities || [])
        .filter((opportunity) => opportunity?.id)
        .map((opportunity) => {
          const cell = row.interestByOpportunityId[opportunity.id] || null;
          return {
            id: opportunity.id,
            title: opportunity.title || opportunity.id,
            dwellMs: cell?.dwellMs || 0,
            visitCount: cell?.visitCount || 0,
            favorited: !!cell?.favorited,
          };
        })
        .filter((item) => item.visitCount > 0 || item.favorited)
        .sort((a, b) => {
          if (a.favorited !== b.favorited) return a.favorited ? -1 : 1;
          return b.visitCount - a.visitCount;
        })
        .slice(0, 3);

      return {
        id: row.id,
        studentName: row.studentName,
        topOpportunities,
      };
    });
  }, [tableRowData, filteredOpportunities, t]);

  const studentColumnHeader = t(
    "opportunities.matchingRound.studentInterest.columns.student",
    {},
    { default: "Student" },
  );

  const columnDefs = useMemo(() => {
    const cols = [
      {
        field: "studentName",
        headerName: studentColumnHeader,
        filter: "agTextColumnFilter",
        sortable: true,
        pinned: "left",
        flex: 1.4,
        minWidth: 160,
      },
    ];

    for (const opportunity of filteredOpportunities) {
      if (!opportunity?.id) continue;
      const title = opportunity.title || opportunity.id;
      cols.push({
        colId: `opp-${opportunity.id}`,
        headerName: truncateLabel(title),
        headerComponent: OpportunityColumnHeader,
        headerComponentParams: { fullTitle: title },
        opportunityId: opportunity.id,
        sortable: true,
        flex: 1,
        minWidth: 110,
        valueGetter: (params) => {
          const cell =
            params?.data?.interestByOpportunityId?.[opportunity.id] || null;
          return cell?.visitCount || 0;
        },
        cellRenderer: (params) => {
          const cell =
            params?.data?.interestByOpportunityId?.[opportunity.id] || null;
          return <InterestCellContent cell={cell} t={t} />;
        },
      });
    }

    return cols;
  }, [filteredOpportunities, studentColumnHeader, t]);

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      suppressMovable: true,
    }),
    [],
  );

  const canDownloadCsv =
    (students?.length || 0) > 0 && (opportunities?.length || 0) > 0;

  const handleDownloadCsv = useCallback(() => {
    if (!canDownloadCsv) return;
    downloadInterestCsv({
      studentColumnHeader,
      rows: tableRowData,
      opportunities: filteredOpportunities,
      roundTitle,
      favoritedLabel: "favorited",
    });
  }, [
    canDownloadCsv,
    filteredOpportunities,
    roundTitle,
    studentColumnHeader,
    tableRowData,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      downloadCsv: handleDownloadCsv,
    }),
    [handleDownloadCsv],
  );

  // Favorites often arrive after preview logs; force AG Grid to redraw cells
  // so stars appear without requiring a filter/mode change.
  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api || viewMode !== VIEW_MODES.table) return;
    api.refreshCells({ force: true });
  }, [tableRowData, favoriteByKey, viewMode]);

  const headerActions = (
    <div className="matchingRoundStudentInterestHeaderActions">
      <div
        className="matchingRoundStudentInterestModeFilters"
        role="group"
        aria-label={t(
          "opportunities.matchingRound.studentInterest.title",
          {},
          { default: "Interest" },
        )}
      >
        <Chip
          shape="square"
          label={t(
            "opportunities.matchingRound.studentInterest.modeTable",
            {},
            { default: "Table" },
          )}
          selected={viewMode === VIEW_MODES.table}
          onClick={() => setViewMode(VIEW_MODES.table)}
          style={{ height: "28px", fontSize: "13px" }}
        />
        <Chip
          shape="square"
          label={t(
            "opportunities.matchingRound.studentInterest.modeGrid",
            {},
            { default: "Grid" },
          )}
          selected={viewMode === VIEW_MODES.grid}
          onClick={() => setViewMode(VIEW_MODES.grid)}
          style={{ height: "28px", fontSize: "13px" }}
        />
      </div>
    </div>
  );

  const searchToolbar = (
    <div className="matchingRoundStudentInterestSearchRow">
      <div className="matchingRoundStudentInterestSearchField">
        <input
          type="search"
          className="matchingRoundStudentInterestSearchInput"
          value={studentQuery}
          onChange={(e) => setStudentQuery(e.target.value)}
          placeholder={t(
            "opportunities.matchingRound.studentInterest.searchStudentsPlaceholder",
            {},
            { default: "Filter students…" },
          )}
          aria-label={t(
            "opportunities.matchingRound.studentInterest.searchStudentsPlaceholder",
            {},
            { default: "Filter students…" },
          )}
        />
      </div>
      <div className="matchingRoundStudentInterestSearchField">
        <input
          type="search"
          className="matchingRoundStudentInterestSearchInput"
          value={opportunityQuery}
          onChange={(e) => setOpportunityQuery(e.target.value)}
          placeholder={t(
            "opportunities.matchingRound.studentInterest.searchOpportunitiesPlaceholder",
            {},
            { default: "Filter opportunities…" },
          )}
          aria-label={t(
            "opportunities.matchingRound.studentInterest.searchOpportunitiesPlaceholder",
            {},
            { default: "Filter opportunities…" },
          )}
        />
      </div>
    </div>
  );

  if (!students?.length) {
    return (
      <GridShell>
        <div className="matchingRoundStudentInterestHeader">
          <div className="matchingRoundStudentInterestHeaderText">
            <h4 className="matchingRoundStudentInterestTitle">
              {t(
                "opportunities.matchingRound.studentInterest.title",
                {},
                { default: "Interest" },
              )}
            </h4>
          </div>
          {headerActions}
        </div>
        <div className="matchingRoundStudentInterestEmpty">
          <p className="matchingRoundStudentInterestEmptyTitle">
            {t(
              "opportunities.matchingRound.studentInterest.emptyNoStudents",
              {},
              { default: "No students in this class yet." },
            )}
          </p>
        </div>
      </GridShell>
    );
  }

  if (!opportunities?.length) {
    return (
      <GridShell>
        <div className="matchingRoundStudentInterestHeader">
          <div className="matchingRoundStudentInterestHeaderText">
            <h4 className="matchingRoundStudentInterestTitle">
              {t(
                "opportunities.matchingRound.studentInterest.title",
                {},
                { default: "Interest" },
              )}
            </h4>
          </div>
          {headerActions}
        </div>
        <div className="matchingRoundStudentInterestEmpty">
          <p className="matchingRoundStudentInterestEmptyTitle">
            {t(
              "opportunities.matchingRound.studentInterest.emptyNoOpportunities",
              {},
              { default: "No pre-selected opportunities in this round yet." },
            )}
          </p>
        </div>
      </GridShell>
    );
  }

  const hasAnyInterest = allRowData.some(
    (row) => row.totalVisits > 0 || row.totalFavorites > 0,
  );

  return (
    <GridShell
      style={{
        "--student-interest-rows": Math.min(tableRowData.length || 4, 12),
      }}
    >
      <div className="matchingRoundStudentInterestHeader">
        <div className="matchingRoundStudentInterestHeaderText">
          <p className="matchingRoundStudentInterestHint">
            {t(
              "opportunities.matchingRound.studentInterest.hint",
              {},
              {
                default:
                  "Time students spent previewing each opportunity (sessions of 1 second or more), and which opportunities they favorited.",
              },
            )}
          </p>
        </div>
        {headerActions}
      </div>

      {searchToolbar}

      {loading && !data?.logs && !favoritesData?.profiles ? (
        <p className="matchingRoundStudentInterestHint">
          {t(
            "opportunities.matchingRound.studentInterest.loading",
            {},
            { default: "Loading student interest…" },
          )}
        </p>
      ) : null}

      {!loading && !hasAnyInterest ? (
        <div className="matchingRoundStudentInterestEmpty">
          <p className="matchingRoundStudentInterestEmptyTitle">
            {t(
              "opportunities.matchingRound.studentInterest.emptyNoVisits",
              {},
              {
                default:
                  "No student previews or favorites recorded yet.",
              },
            )}
          </p>
        </div>
      ) : null}

      {viewMode === VIEW_MODES.table ? (
        <div
          className={clsx(
            "ag-theme-quartz",
            "matchingRoundStudentInterestGrid",
          )}
        >
          <AgGridReact
            ref={gridRef}
            rowData={tableRowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            getRowId={(params) => params.data.id}
            animateRows={false}
            suppressCellFocus
          />
        </div>
      ) : (
        <div className="matchingRoundStudentInterestCards">
          {studentCards.map((card) => (
            <article
              key={card.id}
              className="matchingRoundStudentInterestCard"
            >
              <h5 className="matchingRoundStudentInterestCardName">
                {card.studentName}
              </h5>
              {card.topOpportunities.length > 0 ? (
                <ul className="matchingRoundStudentInterestCardList">
                  {card.topOpportunities.map((opp) => {
                    const dwellTooltip = formatInterestTooltip({
                      dwellMs: opp.visitCount > 0 ? opp.dwellMs : 0,
                      favorited: opp.favorited,
                      favoritedLabel: favoritedAria,
                      t,
                    });

                    const dwellBody = (
                      <p className="matchingRoundStudentInterestCardDwell">
                        {opp.visitCount > 0
                          ? formatVisitCountLabel(opp.visitCount, t)
                          : null}
                        {opp.favorited ? (
                          <StarFilledIcon
                            className="matchingRoundStudentInterestStar"
                            width={16}
                            height={16}
                            aria-label={favoritedAria}
                          />
                        ) : null}
                      </p>
                    );

                    return (
                      <li
                        key={opp.id}
                        className="matchingRoundStudentInterestCardItem"
                      >
                        <p
                          className="matchingRoundStudentInterestCardOpp"
                          title={opp.title}
                        >
                          {opp.title}
                        </p>
                        {dwellTooltip ? (
                          <Tooltip
                            content={dwellTooltip}
                            side="top"
                            maxWidth={280}
                          >
                            {dwellBody}
                          </Tooltip>
                        ) : (
                          dwellBody
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="matchingRoundStudentInterestCardEmpty">
                  {t(
                    "opportunities.matchingRound.studentInterest.emptyNoInterest",
                    {},
                    { default: "No previews or favorites yet" },
                  )}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </GridShell>
  );
});

export default MatchingRoundStudentInterestGrid;
