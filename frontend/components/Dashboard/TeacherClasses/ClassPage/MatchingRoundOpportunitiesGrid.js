import { useCallback, useEffect, useMemo, useRef } from "react";
import useTranslation from "next-translate/useTranslation";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import Button from "../../../DesignSystem/Button";
import InfoTooltip from "../../../DesignSystem/InfoTooltip";
import {
  formatDateShort,
  isExpired,
} from "../../Connect/Rounds/roundFormConfig";

const OPPORTUNITY_STATUS_KEYS = {
  draft: "draft",
  pending_review: "pendingReview",
  pre_selected: "preSelected",
  accepted: "accepted",
  published: "published",
  closed: "closed",
  archived: "archived",
};

function displayName(profile) {
  if (!profile) return null;
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username
  );
}

function formatDateTime(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function OpportunityInfoContent({ opportunity, t }) {
  const mentorName = displayName(opportunity.mentor);
  const from = formatDateShort(opportunity.availableFrom);
  const to = formatDateShort(opportunity.availableTo);
  const expired = isExpired(opportunity.availableTo);
  const statusKey = OPPORTUNITY_STATUS_KEYS[opportunity.status];
  const lastUpdated = formatDateTime(
    opportunity.updatedAt || opportunity.createdAt,
  );
  const statusLabel = statusKey
    ? t(`opportunities.status.${statusKey}`, {}, { default: opportunity.status })
    : opportunity.status;

  return (
    <div className="matchingRoundOppInfoTooltip">
      {opportunity.shortDescription ? (
        <p>{opportunity.shortDescription}</p>
      ) : null}
      {mentorName ? (
        <p>
          {t("opportunities.rowMeta.byMentor", { name: mentorName }, {
            default: "By {{name}}",
          })}
        </p>
      ) : null}
      <p>
        {t(
          "opportunities.rowMeta.capacity",
          { count: opportunity.studentCapacity ?? 1 },
          { default: "Capacity {{count}}" },
        )}
        {opportunity.teamSize > 1
          ? ` · ${t(
              "opportunities.rowMeta.teamOf",
              { size: opportunity.teamSize },
              { default: "Team of {{size}}" },
            )}`
          : ""}
      </p>
      {(from || to) && (
        <p className={expired ? "expired" : undefined}>
          {from || "—"} → {to || "—"}
          {opportunity.timeCommitment ? ` · ${opportunity.timeCommitment}` : ""}
        </p>
      )}
      {opportunity.status ? (
        <p>
          {statusLabel}
          {expired
            ? ` · ${t("opportunities.matchingRound.expired", {}, {
                default: "Expired",
              })}`
            : ""}
        </p>
      ) : null}
      {lastUpdated ? (
        <p>
          {t(
            "opportunities.rowMeta.lastUpdated",
            { date: lastUpdated },
            { default: "Last updated {{date}}" },
          )}
        </p>
      ) : null}
    </div>
  );
}

export default function MatchingRoundOpportunitiesGrid({
  opportunities,
  selectedIds,
  onSelectionChange,
  onPreview,
  onRemove,
  selectionMode = "multi",
  selectionDisabled = false,
  togglingOpportunityId = null,
  emptyMessage,
}) {
  const { t } = useTranslation("classes");
  const gridRef = useRef(null);

  const rowData = useMemo(
    () =>
      opportunities.map((opportunity) => ({
        ...opportunity,
        sponsorName: displayName(opportunity.mentor) || "—",
        organizationName: opportunity.organization?.name || "—",
      })),
    [opportunities],
  );

  const InfoButtonRenderer = useCallback(
    (params) => {
      const opportunity = params?.data;
      if (!opportunity) return null;

      return (
        <InfoTooltip
          portal
          position="left"
          trigger="click"
          content={<OpportunityInfoContent opportunity={opportunity} t={t} />}
          tooltipStyle={{ width: "320px", maxWidth: "min(320px, calc(100vw - 24px))" }}
          wrapperStyle={{
            display: "flex",
            alignItems: "stretch",
            justifyContent: "stretch",
            width: "100%",
            height: "100%",
            alignSelf: "stretch",
          }}
        >
          <button
            type="button"
            className="matchingRoundOppInfoCell"
            aria-label={t("opportunities.matchingRound.grid.columns.info", {}, {
              default: "More information",
            })}
            aria-haspopup="dialog"
          >
            !
          </button>
        </InfoTooltip>
      );
    },
    [t],
  );

  const ReviewButtonRenderer = useCallback(
    (params) => {
      const opportunity = params?.data;
      if (!opportunity?.id) return null;

      return (
        <Button
          variant="text"
          style={{
            padding: 0,
            minWidth: 0,
            width: "fit-content",
            height: "fit-content",
            fontSize: "14px",
            fontWeight: 500,
            color: "#171717",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onPreview?.(opportunity.id);
          }}
        >
          {t("opportunities.matchingRound.grid.review", {}, {
            default: "Review",
          })}
        </Button>
      );
    },
    [onPreview, t],
  );

  const RemoveButtonRenderer = useCallback(
    (params) => {
      const opportunity = params?.data;
      if (!opportunity?.id || !onRemove) return null;

      const isSaving = togglingOpportunityId === opportunity.id;

      return (
        <Button
          variant="text"
          disabled={Boolean(togglingOpportunityId)}
          style={{
            padding: 0,
            minWidth: 0,
            width: "fit-content",
            height: "fit-content",
            fontSize: "14px",
            fontWeight: 500,
            color: togglingOpportunityId ? "#a1a1a1" : "#171717",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(opportunity.id);
          }}
        >
          {isSaving
            ? t("opportunities.matchingRound.saving", {}, { default: "Saving…" })
            : t("opportunities.matchingRound.grid.remove", {}, {
                default: "Remove",
              })}
        </Button>
      );
    },
    [onRemove, togglingOpportunityId, t],
  );

  const columnDefs = useMemo(() => {
    const cols = [
      {
        field: "title",
        headerName: t("opportunities.matchingRound.grid.columns.name", {}, {
          default: "Opportunity name",
        }),
        filter: "agTextColumnFilter",
        sortable: true,
        flex: 2,
        minWidth: 180,
      },
      {
        field: "sponsorName",
        headerName: t("opportunities.matchingRound.grid.columns.sponsor", {}, {
          default: "Sponsor",
        }),
        filter: "agTextColumnFilter",
        sortable: true,
        flex: 1.2,
        minWidth: 140,
      },
      {
        field: "organizationName",
        headerName: t(
          "opportunities.matchingRound.grid.columns.organization",
          {},
          { default: "Organization" },
        ),
        filter: "agTextColumnFilter",
        sortable: true,
        flex: 1.2,
        minWidth: 140,
      },
    ];

    if (onRemove) {
      cols.push({
        field: "remove",
        headerName: "",
        cellRenderer: RemoveButtonRenderer,
        sortable: false,
        filter: false,
        width: 120,
        pinned: "right",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      });
    }

    if (onPreview) {
      cols.push({
        field: "review",
        headerName: "",
        cellRenderer: ReviewButtonRenderer,
        sortable: false,
        filter: false,
        width: 120,
        pinned: "right",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      });
    }

    cols.push({
      field: "info",
      headerName: "",
      cellRenderer: InfoButtonRenderer,
      sortable: false,
      filter: false,
      width: 52,
      maxWidth: 52,
      pinned: "right",
      cellClass: "matchingRoundOppInfoGridCell",
      cellStyle: {
        padding: 0,
      },
    });

    return cols;
  }, [
    InfoButtonRenderer,
    RemoveButtonRenderer,
    ReviewButtonRenderer,
    onPreview,
    onRemove,
    t,
  ]);

  const handleSelectionChanged = useCallback(
    (event) => {
      if (selectionDisabled) return;

      const ids = event.api
        .getSelectedRows()
        .map((row) => row.id)
        .filter(Boolean);
      onSelectionChange?.(ids);
    },
    [onSelectionChange, selectionDisabled],
  );

  const isRowSelectable = useCallback(
    () => !selectionDisabled,
    [selectionDisabled],
  );

  useEffect(() => {
    if (selectionMode === "readOnly") return;
    const api = gridRef.current?.api;
    if (!api) return;

    api.forEachNode((node) => {
      if (!node.data?.id) return;
      const shouldSelect = selectedIds.includes(node.data.id);
      if (node.isSelected() !== shouldSelect) {
        node.setSelected(shouldSelect);
      }
    });
  }, [selectedIds, rowData, selectionMode]);

  if (rowData.length === 0 && emptyMessage) {
    return <p className="classTabEmptyInline">{emptyMessage}</p>;
  }

  return (
    <div className="classTabTable ag-theme-quartz matchingRoundOpportunitiesGrid">
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        getRowId={(params) => params.data?.id}
        {...(selectionMode === "multi"
          ? {
              rowSelection: {
                mode: "multiRow",
                checkboxes: true,
                headerCheckbox: true,
                isRowSelectable,
              },
              onSelectionChanged: handleSelectionChanged,
            }
          : {})}
        pagination
        paginationPageSize={10}
        paginationPageSizeSelector={[10, 20, 50]}
        autoSizeStrategy={{ type: "fitGridWidth", defaultMinWidth: 100 }}
        defaultColDef={{ resizable: true }}
        initialState={{
          sort: {
            sortModel: [{ colId: "title", sort: "asc" }],
          },
        }}
      />
    </div>
  );
}
