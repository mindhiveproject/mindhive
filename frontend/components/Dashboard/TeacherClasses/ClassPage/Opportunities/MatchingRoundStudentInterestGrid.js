import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";
import { jsonToCSV } from "react-papaparse";
import styled from "styled-components";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import Chip from "../../../../DesignSystem/Chip";
import { slugifyForFilename } from "../../../../../lib/opportunityExportMedia";
import { CLASS_OPPORTUNITY_PREVIEW_LOGS } from "../../../../Queries/Log";

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

function formatDwellMs(dwellMs, t) {
  const seconds = Math.max(0, Math.round((Number(dwellMs) || 0) / 1000));
  if (seconds < 60) {
    return t(
      "opportunities.matchingRound.studentInterest.dwellSeconds",
      { count: seconds },
      { default: "{{count}}s" },
    );
  }
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return t(
    "opportunities.matchingRound.studentInterest.dwellMinutes",
    { minutes, seconds: rem },
    { default: "{{minutes}}m {{seconds}}s" },
  );
}

function includesQuery(value, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return String(value || "")
    .toLowerCase()
    .includes(q);
}

function dwellSeconds(cell) {
  if (!cell || !cell.visitCount) return "";
  return Math.max(0, Math.round((Number(cell.dwellMs) || 0) / 1000));
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
      out[title] = dwellSeconds(cell);
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

  .matchingRoundStudentInterestSearchLabel {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: #5c6570;
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

  .ag-theme-quartz.matchingRoundStudentInterestGrid {
    width: 100%;
    height: min(480px, max(240px, calc(var(--student-interest-rows, 4) * 42px + 48px)));
    --ag-font-family: Inter, system-ui, sans-serif;
    --ag-font-size: 13px;
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
    font-size: 13px;
    font-weight: 600;
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }

  .matchingRoundStudentInterestCardEmpty {
    margin: 0;
    font-size: 13px;
    color: #5c6570;
  }
`;

/**
 * Class students × pre-selected opportunities preview interest matrix.
 * Table mode: AG Grid matrix. Grid mode: student cards with top 3 by dwell.
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

  const { data, loading } = useQuery(CLASS_OPPORTUNITY_PREVIEW_LOGS, {
    variables: { classId, opportunityIds },
    skip: !enabled || !classId || !roundId || opportunityIds.length === 0,
    fetchPolicy: "cache-and-network",
  });

  const interestByKey = useMemo(() => {
    const map = new Map();
    for (const log of data?.logs || []) {
      const content = log?.content || {};
      if (String(content.roundId || "") !== String(roundId || "")) continue;
      const userId = log?.user?.id;
      const opportunityId = log?.opportunity?.id;
      if (!userId || !opportunityId) continue;
      const key = `${userId}::${opportunityId}`;
      const existing = map.get(key) || { dwellMs: 0, visitCount: 0 };
      existing.dwellMs += Number(content.dwellMs) || 0;
      existing.visitCount += 1;
      map.set(key, existing);
    }
    return map;
  }, [data?.logs, roundId]);

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
          for (const opportunity of opportunityList || []) {
            if (!opportunity?.id) continue;
            const cell =
              interestByKey.get(`${student.id}::${opportunity.id}`) || null;
            interestByOpportunityId[opportunity.id] = cell;
            if (cell) {
              totalDwellMs += cell.dwellMs;
              totalVisits += cell.visitCount;
            }
          }
          return {
            id: student.id,
            studentName: displayName(student),
            interestByOpportunityId,
            totalDwellMs,
            totalVisits,
          };
        })
        .sort((a, b) =>
          String(a.studentName).localeCompare(String(b.studentName), undefined, {
            sensitivity: "base",
          }),
        );
    },
    [interestByKey],
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
          };
        })
        .filter((item) => item.visitCount > 0)
        .sort((a, b) => b.dwellMs - a.dwellMs)
        .slice(0, 3);

      return {
        id: row.id,
        studentName: row.studentName,
        topOpportunities,
      };
    });
  }, [tableRowData, filteredOpportunities]);

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
        headerTooltip: title,
        opportunityId: opportunity.id,
        sortable: true,
        flex: 1,
        minWidth: 110,
        valueGetter: (params) => {
          const cell =
            params?.data?.interestByOpportunityId?.[opportunity.id] || null;
          return cell?.dwellMs || 0;
        },
        cellRenderer: (params) => {
          const cell =
            params?.data?.interestByOpportunityId?.[opportunity.id] || null;
          if (!cell || !cell.visitCount) return "—";
          const label = formatDwellMs(cell.dwellMs, t);
          const titleText = t(
            "opportunities.matchingRound.studentInterest.visitCount",
            { count: cell.visitCount },
            { default: "{{count}} visits" },
          );
          return <span title={titleText}>{label}</span>;
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
      <label className="matchingRoundStudentInterestSearchField">
        <span className="matchingRoundStudentInterestSearchLabel">
          {t(
            "opportunities.matchingRound.studentInterest.searchStudentsLabel",
            {},
            { default: "Students" },
          )}
        </span>
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
        />
      </label>
      <label className="matchingRoundStudentInterestSearchField">
        <span className="matchingRoundStudentInterestSearchLabel">
          {t(
            "opportunities.matchingRound.studentInterest.searchOpportunitiesLabel",
            {},
            { default: "Opportunities" },
          )}
        </span>
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
        />
      </label>
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

  const hasAnyVisits = allRowData.some((row) => row.totalVisits > 0);

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
                  "Time students spent previewing each opportunity (sessions of 1 second or more).",
              },
            )}
          </p>
        </div>
        {headerActions}
      </div>

      {searchToolbar}

      {loading && !data?.logs ? (
        <p className="matchingRoundStudentInterestHint">
          {t(
            "opportunities.matchingRound.studentInterest.loading",
            {},
            { default: "Loading student previews…" },
          )}
        </p>
      ) : null}

      {!loading && !hasAnyVisits ? (
        <div className="matchingRoundStudentInterestEmpty">
          <p className="matchingRoundStudentInterestEmptyTitle">
            {t(
              "opportunities.matchingRound.studentInterest.emptyNoVisits",
              {},
              { default: "No student previews recorded yet." },
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
                  {card.topOpportunities.map((opp) => (
                    <li
                      key={opp.id}
                      className="matchingRoundStudentInterestCardItem"
                      title={opp.title}
                    >
                      <p className="matchingRoundStudentInterestCardOpp">
                        {opp.title}
                      </p>
                      <p className="matchingRoundStudentInterestCardDwell">
                        {formatDwellMs(opp.dwellMs, t)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="matchingRoundStudentInterestCardEmpty">
                  {t(
                    "opportunities.matchingRound.studentInterest.emptyNoInterest",
                    {},
                    { default: "No previews yet" },
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
