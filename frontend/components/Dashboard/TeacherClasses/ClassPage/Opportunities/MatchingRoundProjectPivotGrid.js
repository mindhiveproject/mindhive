import { useMemo, useRef } from "react";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import Tooltip from "../../../../DesignSystem/Tooltip";
import { buildOpportunityPreferenceStats } from "../../../../../lib/connectBallotUtils";
import StudentNameDisplay from "./StudentNameDisplay";

const EmptyNote = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const GridShell = styled.div`
  width: 100%;
  min-width: 0;
  height: 520px;

  &.ag-theme-quartz .ag-root-wrapper {
    border-radius: 8px;
    border-color: var(--MH-Theme-Neutrals-Light, #e6e6e6);
  }

  &.ag-theme-quartz .ag-cell-wrap-text {
    line-height: 1.35;
    word-break: break-word;
  }

  &.ag-theme-quartz .ag-header-cell-comp-wrapper {
    width: 100%;
    min-width: 0;
  }

  &.ag-theme-quartz .ag-header-cell-comp-wrapper .DesignSystem-Tooltip-trigger {
    display: block;
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
`;

const HeaderLabel = styled.span`
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RankedStudentsCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  padding: 4px 0;
`;

const RankedStudentEntry = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
`;

const RankSuffix = styled.span`
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  white-space: nowrap;
`;

function formatOrdinalRank(rank, t) {
  if (rank === 1) {
    return t(
      "opportunities.matchingRound.matching.preferenceRankFirst",
      {},
      { default: "1st choice" },
    );
  }
  if (rank === 2) {
    return t(
      "opportunities.matchingRound.matching.preferenceRankSecond",
      {},
      { default: "2nd choice" },
    );
  }
  if (rank === 3) {
    return t(
      "opportunities.matchingRound.matching.preferenceRankThird",
      {},
      { default: "3rd choice" },
    );
  }
  return t(
    "opportunities.matchingRound.matching.preferenceRankNth",
    { rank },
    { default: "{{rank}}th choice" },
  );
}

function formatStudentRankEntry(entry, t) {
  return `${entry.name} (${formatOrdinalRank(entry.rank, t)})`;
}

function RankedStudentsCellRenderer(props) {
  const { t } = useTranslation("classes");
  const entries = props.data?.rankedStudents || [];
  const preferenceBySubmitterId = props.preferenceBySubmitterId;

  if (!entries.length) {
    return t(
      "opportunities.matchingRound.matching.pivotNoRankings",
      {},
      { default: "—" },
    );
  }

  return (
    <RankedStudentsCell>
      {entries.map((entry, index) => (
        <RankedStudentEntry
          key={`${entry.student?.id || entry.name}-${entry.rank}`}
        >
          {index > 0 ? <span aria-hidden="true">;</span> : null}
          <StudentNameDisplay
            student={entry.student}
            preference={
              preferenceBySubmitterId?.get?.(entry.student?.id) || null
            }
          />
          <RankSuffix>({formatOrdinalRank(entry.rank, t)})</RankSuffix>
        </RankedStudentEntry>
      ))}
    </RankedStudentsCell>
  );
}

/** Column header with Design System Tooltip for the column description. */
function PivotColumnHeader(props) {
  const label = props.displayName || "";
  const tooltip = props.tooltipContent || label;

  return (
    <Tooltip
      content={tooltip}
      side="top"
      maxWidth={320}
      className="DesignSystem-Tooltip-trigger--fill"
    >
      <HeaderLabel className="matchingRoundProjectPivotColumnHeader">
        {label}
      </HeaderLabel>
    </Tooltip>
  );
}

/**
 * Project-grouped roster: one AG Grid row per opportunity with ranked students.
 */
export default function MatchingRoundProjectPivotGrid({
  opportunities = [],
  preferences = [],
  matchesByOpportunity = new Map(),
}) {
  const { t } = useTranslation("classes");
  const gridRef = useRef(null);

  const preferenceBySubmitterId = useMemo(() => {
    const map = new Map();
    (preferences || []).forEach((preference) => {
      const id = preference.submitter?.id;
      if (id) map.set(id, preference);
    });
    return map;
  }, [preferences]);

  const rowData = useMemo(() => {
    return (opportunities || []).map((opportunity) => {
      const stats = buildOpportunityPreferenceStats(
        opportunity.id,
        preferences,
        { submittedOnly: true },
      );
      const matches = matchesByOpportunity.get(opportunity.id) || [];
      const capacity = opportunity.studentCapacity || 1;
      const rankedStudents = stats.students || [];
      const rankedStudentsLabel = rankedStudents
        .map((entry) => formatStudentRankEntry(entry, t))
        .join("; ");

      return {
        id: opportunity.id,
        title: opportunity.title || "—",
        rankedCount: stats.total,
        rankedStudents,
        rankedStudentsLabel,
        placedLabel: t(
          "opportunities.matchingRound.matching.capacity",
          { used: matches.length, capacity },
          { default: "{{used}} / {{capacity}} placed" },
        ),
        placedUsed: matches.length,
        placedCapacity: capacity,
      };
    });
  }, [opportunities, preferences, matchesByOpportunity, t]);

  const columnDefs = useMemo(
    () => [
      {
        field: "title",
        headerName: t(
          "opportunities.matchingRound.matching.pivotColumns.opportunity",
          {},
          { default: "Opportunity" },
        ),
        headerComponent: PivotColumnHeader,
        headerComponentParams: {
          tooltipContent: t(
            "opportunities.matchingRound.matching.pivotColumnHints.opportunity",
            {},
            {
              default:
                "Opportunity title. Rows are sorted A–Z by default.",
            },
          ),
        },
        filter: "agTextColumnFilter",
        sortable: true,
        pinned: "left",
        flex: 1.4,
        minWidth: 180,
        sort: "asc",
      },
      {
        field: "rankedStudentsLabel",
        headerName: t(
          "opportunities.matchingRound.matching.pivotColumns.rankedStudents",
          {},
          { default: "Ranked students" },
        ),
        headerComponent: PivotColumnHeader,
        headerComponentParams: {
          tooltipContent: t(
            "opportunities.matchingRound.matching.pivotColumnHints.rankedStudents",
            {},
            {
              default:
                "Students who included this opportunity on a submitted ballot, with their rank. Use this list to compare names to an external record.",
            },
          ),
        },
        filter: "agTextColumnFilter",
        sortable: false,
        flex: 2.2,
        minWidth: 240,
        wrapText: true,
        autoHeight: true,
        cellClass: "ag-cell-wrap-text",
        cellRenderer: RankedStudentsCellRenderer,
        cellRendererParams: { preferenceBySubmitterId },
        valueGetter: (params) => params.data?.rankedStudentsLabel || "",
        valueFormatter: (params) =>
          params.value ||
          t(
            "opportunities.matchingRound.matching.pivotNoRankings",
            {},
            { default: "—" },
          ),
      },
      {
        field: "rankedCount",
        headerName: t(
          "opportunities.matchingRound.matching.pivotColumns.rankedCount",
          {},
          { default: "Ranked count" },
        ),
        headerComponent: PivotColumnHeader,
        headerComponentParams: {
          tooltipContent: t(
            "opportunities.matchingRound.matching.pivotColumnHints.rankedCount",
            {},
            {
              default:
                "How many submitted ballots include this opportunity.",
            },
          ),
        },
        filter: "agNumberColumnFilter",
        sortable: true,
        width: 130,
        minWidth: 110,
      },
      {
        field: "placedLabel",
        headerName: t(
          "opportunities.matchingRound.matching.pivotColumns.placed",
          {},
          { default: "Placed" },
        ),
        headerComponent: PivotColumnHeader,
        headerComponentParams: {
          tooltipContent: t(
            "opportunities.matchingRound.matching.pivotColumnHints.placed",
            {},
            {
              default:
                "Students already matched to this opportunity versus capacity.",
            },
          ),
        },
        filter: "agTextColumnFilter",
        sortable: true,
        width: 130,
        minWidth: 110,
        comparator: (a, b, nodeA, nodeB) => {
          const usedA = nodeA?.data?.placedUsed ?? 0;
          const usedB = nodeB?.data?.placedUsed ?? 0;
          if (usedA !== usedB) return usedA - usedB;
          const capA = nodeA?.data?.placedCapacity ?? 0;
          const capB = nodeB?.data?.placedCapacity ?? 0;
          return capA - capB;
        },
      },
    ],
    [preferenceBySubmitterId, t],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      suppressMovable: true,
    }),
    [],
  );

  if (!rowData.length) {
    return (
      <EmptyNote>
        {t(
          "opportunities.matchingRound.matching.pivotEmpty",
          {},
          { default: "No opportunities match these filters." },
        )}
      </EmptyNote>
    );
  }

  return (
    <GridShell className="ag-theme-quartz matchingRoundProjectPivotGrid">
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={(params) => params.data?.id}
        animateRows={false}
        suppressCellFocus
      />
    </GridShell>
  );
}
