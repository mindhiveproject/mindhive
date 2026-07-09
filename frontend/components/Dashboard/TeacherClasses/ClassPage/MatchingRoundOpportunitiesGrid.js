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

function OpportunityInfoContent({ opportunity, t }) {
  const mentorName = displayName(opportunity.mentor);
  const from = formatDateShort(opportunity.availableFrom);
  const to = formatDateShort(opportunity.availableTo);
  const expired = isExpired(opportunity.availableTo);
  const statusKey = OPPORTUNITY_STATUS_KEYS[opportunity.status];

  return (
    <div className="matchingRoundOppInfoTooltip">
      {opportunity.shortDescription ? (
        <p>{opportunity.shortDescription}</p>
      ) : null}
      <p>
        {mentorName
          ? t("opportunities.rowMeta.byMentor", { name: mentorName }, {
              default: "By {{name}}",
            })
          : null}
        {mentorName ? " · " : ""}
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
          {t(
            `opportunities.status.${statusKey}`,
            {},
            { default: opportunity.status },
          )}
          {expired
            ? ` · ${t("opportunities.matchingRound.expired", {}, {
                default: "Expired",
              })}`
            : ""}
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
          delayMs={1000}
          content={<OpportunityInfoContent opportunity={opportunity} t={t} />}
          wrapperStyle={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <button
            type="button"
            className="matchingRoundOppInfoBtn"
            aria-label={t("opportunities.matchingRound.grid.columns.info", {}, {
              default: "More information",
            })}
            onClick={(e) => e.stopPropagation()}
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
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
