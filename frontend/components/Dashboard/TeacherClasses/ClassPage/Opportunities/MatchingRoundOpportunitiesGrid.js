import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";
import styled from "styled-components";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import Button from "../../../../DesignSystem/Button";
import InfoTooltip from "../../../../DesignSystem/InfoTooltip";
import { useUser } from "../../../../Utils/Access/User";
import { hasUnreadSponsorReply } from "../../../../../lib/reviewThreadRound";
import {
  formatDateShort,
  isExpired,
} from "../../../Connect/Rounds/roundFormConfig";

const INFO_HIGHLIGHT_DISMISSED_KEY =
  "mh.classMatchingRound.infoHighlightDismissed";

function readDismissedHighlights() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(INFO_HIGHLIGHT_DISMISSED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDismissedHighlights(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      INFO_HIGHLIGHT_DISMISSED_KEY,
      JSON.stringify(next),
    );
  } catch {
    // Ignore quota / private-mode failures; in-memory state still updates.
  }
}

function opportunityHighlightStamp(opportunity) {
  return opportunity?.updatedAt || opportunity?.createdAt || "";
}

function isHighlightDismissed(map, opportunityId, kind, stamp) {
  if (!opportunityId || !stamp) return false;
  return map?.[opportunityId]?.[kind] === stamp;
}

function dismissHighlightInMap(map, opportunityId, kind, stamp) {
  if (!opportunityId || !stamp) return map;
  return {
    ...map,
    [opportunityId]: {
      ...(map?.[opportunityId] || {}),
      [kind]: stamp,
    },
  };
}

/** Self-contained so portaled InfoTooltip content keeps styles outside .classTabPage. */
const OpportunityInfoTooltip = styled.div`
  display: grid;
  gap: 10px;
  max-width: 320px;
  text-align: left;

  .matchingRoundOppInfoTooltipTitle {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    line-height: 20px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .matchingRoundOppInfoTooltipDescription {
    margin: 0;
    font-size: 13px;
    font-weight: 400;
    line-height: 18px;
    color: var(--MH-Theme-Neutrals-Grey-2, #5f6871);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .matchingRoundOppInfoTooltipDivider {
    height: 1px;
    width: 100%;
    background: var(--MH-Theme-Neutrals-Light-Grey, #e6e6e6);
  }

  .matchingRoundOppInfoTooltipRows {
    display: grid;
    gap: 6px;
  }

  .matchingRoundOppInfoTooltipRow {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 12px;
    align-items: start;
  }

  .matchingRoundOppInfoTooltipLabel {
    font-size: 11px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--MH-Theme-Neutrals-Grey-3, #888);
    white-space: nowrap;
  }

  .matchingRoundOppInfoTooltipValue {
    display: inline-flex;
    align-items: flex-start;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 13px;
    font-weight: 600;
    line-height: 16px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    text-align: right;
    overflow-wrap: anywhere;
  }

  .matchingRoundOppInfoTooltipValueText {
    min-width: 0;
  }

  .matchingRoundOppInfoTooltipValue.expired {
    color: var(--MH-Theme-Error, #b3261e);
  }

  .matchingRoundOppInfoTooltipValue.appointmentRequested {
    color: var(--MH-Theme-Error-Dark, #b9261a);
  }

  .matchingRoundOppInfoTooltipValue.returned {
    color: var(--MH-Theme-Secondary-Dark, #3f288f);
  }

  .matchingRoundOppInfoTooltipDismiss {
    flex: 0 0 auto;
    padding: 0;
    min-width: 0;
    width: fit-content;
    height: fit-content;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

const OPPORTUNITY_STATUS_KEYS = {
  draft: "draft",
  pending_review: "pendingReview",
  returned: "returned",
  pre_selected: "preSelected",
  accepted: "accepted",
  published: "published",
  closed: "closed",
  archived: "archived",
};

function isReturnedOpportunity(opportunity) {
  return opportunity?.status === "returned";
}

function isAppointmentRequested(opportunity) {
  return Boolean(opportunity?.requestsAppointment);
}

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

function TooltipMetaRow({ label, value, valueClassName, dismissLabel, onDismiss }) {
  if (value == null || value === "") return null;
  return (
    <div className="matchingRoundOppInfoTooltipRow">
      <span className="matchingRoundOppInfoTooltipLabel">{label}</span>
      <span className={clsx("matchingRoundOppInfoTooltipValue", valueClassName)}>
        <span className="matchingRoundOppInfoTooltipValueText">{value}</span>
        {onDismiss ? (
          <Button
            variant="text"
            className="matchingRoundOppInfoTooltipDismiss"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            style={{
              padding: 0,
              minWidth: 0,
              width: "fit-content",
              height: "fit-content",
              fontSize: "12px",
              fontWeight: 600,
              lineHeight: "16px",
              color: "var(--MH-Theme-Primary-Dark, #336f8a)",
            }}
          >
            {dismissLabel}
          </Button>
        ) : null}
      </span>
    </div>
  );
}

function OpportunityInfoContent({
  opportunity,
  t,
  showAppointmentHighlight = false,
  showReturnedHighlight = false,
  onDismissAppointment,
  onDismissReturned,
}) {
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
  const returned = isReturnedOpportunity(opportunity);
  const hasAvailability = Boolean(from || to);
  const availabilityValue = hasAvailability
    ? `${from || "—"} → ${to || "—"}${
        expired
          ? ` · ${t("opportunities.matchingRound.expired", {}, {
              default: "Expired",
            })}`
          : ""
      }`
    : null;
  const teamSizeValue =
    opportunity.teamSize > 1
      ? t(
          "opportunities.preview.teamSizeTeam",
          { size: opportunity.teamSize },
          { default: "Team of {{size}}" },
        )
      : t("opportunities.preview.teamSizeSolo", {}, { default: "Solo" });

  const dismissLabel = t("opportunities.matchingRound.grid.dismissHighlight", {}, {
    default: "Dismiss",
  });
  const hasHeaderMeta = Boolean(opportunity.status || showAppointmentHighlight);

  return (
    <OpportunityInfoTooltip>
      {opportunity.title ? (
        <p className="matchingRoundOppInfoTooltipTitle">{opportunity.title}</p>
      ) : null}

      {hasHeaderMeta ? (
        <div className="matchingRoundOppInfoTooltipRows">
          {opportunity.status ? (
            <TooltipMetaRow
              label={t("opportunities.rowMeta.statusLabel", {}, {
                default: "Status",
              })}
              value={statusLabel}
              valueClassName={returned ? "returned" : undefined}
              dismissLabel={dismissLabel}
              onDismiss={
                showReturnedHighlight && onDismissReturned
                  ? onDismissReturned
                  : undefined
              }
            />
          ) : null}
          {showAppointmentHighlight ? (
            <TooltipMetaRow
              label={t("opportunities.rowMeta.flagLabel", {}, {
                default: "Flag",
              })}
              value={t("opportunities.preview.requestsAppointment", {}, {
                default: "Appointment requested",
              })}
              valueClassName="appointmentRequested"
              dismissLabel={dismissLabel}
              onDismiss={onDismissAppointment}
            />
          ) : null}
        </div>
      ) : null}

      {opportunity.shortDescription ? (
        <>
          <div className="matchingRoundOppInfoTooltipDivider" aria-hidden />
          <p className="matchingRoundOppInfoTooltipDescription">
            {opportunity.shortDescription}
          </p>
        </>
      ) : null}

      <div className="matchingRoundOppInfoTooltipDivider" aria-hidden />

      <div className="matchingRoundOppInfoTooltipRows">
        <TooltipMetaRow
          label={t("opportunities.rowMeta.availabilityLabel", {}, {
            default: "Available",
          })}
          value={availabilityValue}
          valueClassName={expired ? "expired" : undefined}
        />
        <TooltipMetaRow
          label={t("opportunities.preview.timeCommitment", {}, {
            default: "Time commitment",
          })}
          value={opportunity.timeCommitment}
        />
        <TooltipMetaRow
          label={t("opportunities.rowMeta.capacityLabel", {}, {
            default: "Capacity",
          })}
          value={opportunity.studentCapacity ?? 1}
        />
        <TooltipMetaRow
          label={t("opportunities.preview.teamSize", {}, {
            default: "Team size",
          })}
          value={teamSizeValue}
        />
        <TooltipMetaRow
          label={t("opportunities.rowMeta.lastUpdatedLabel", {}, {
            default: "Last updated",
          })}
          value={lastUpdated}
        />
      </div>
    </OpportunityInfoTooltip>
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
  roundId = null,
}) {
  const { t } = useTranslation("classes");
  const { user } = useUser();
  const viewerId = user?.id || null;
  const gridRef = useRef(null);
  const [dismissedHighlights, setDismissedHighlights] = useState(() =>
    readDismissedHighlights(),
  );

  const handleDismissHighlight = useCallback((opportunityId, kind, stamp) => {
    setDismissedHighlights((prev) => {
      const next = dismissHighlightInMap(prev, opportunityId, kind, stamp);
      writeDismissedHighlights(next);
      return next;
    });
  }, []);

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

      const returned = isReturnedOpportunity(opportunity);
      const appointmentRequested = isAppointmentRequested(opportunity);
      const stamp = opportunityHighlightStamp(opportunity);
      const showAppointmentHighlight =
        appointmentRequested &&
        !isHighlightDismissed(
          dismissedHighlights,
          opportunity.id,
          "appointment",
          stamp,
        );
      const showReturnedHighlight =
        returned &&
        !isHighlightDismissed(
          dismissedHighlights,
          opportunity.id,
          "returned",
          stamp,
        );

      const infoLabelKey = showReturnedHighlight
        ? "infoReturned"
        : showAppointmentHighlight
          ? "infoAppointment"
          : "info";
      const infoLabelDefaults = {
        info: "More information",
        infoReturned: "More information — returned",
        infoAppointment: "More information — appointment requested",
      };

      const cellClass = clsx("matchingRoundOppInfoCell", {
        matchingRoundOppInfoCellAppointment: showAppointmentHighlight,
        matchingRoundOppInfoCellReturned: showReturnedHighlight,
        matchingRoundOppInfoCellReturnedQuiet:
          returned && !showReturnedHighlight,
      });

      return (
        <InfoTooltip
          portal
          position="left"
          trigger="click"
          content={
            <OpportunityInfoContent
              opportunity={opportunity}
              t={t}
              showAppointmentHighlight={showAppointmentHighlight}
              showReturnedHighlight={showReturnedHighlight}
              onDismissAppointment={() =>
                handleDismissHighlight(opportunity.id, "appointment", stamp)
              }
              onDismissReturned={() =>
                handleDismissHighlight(opportunity.id, "returned", stamp)
              }
            />
          }
          tooltipStyle={{ width: "320px", maxWidth: "min(320px, calc(100vw - 24px))" }}
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
            className={cellClass}
            aria-label={t(
              `opportunities.matchingRound.grid.columns.${infoLabelKey}`,
              {},
              { default: infoLabelDefaults[infoLabelKey] },
            )}
            aria-haspopup="dialog"
          >
            !
          </button>
        </InfoTooltip>
      );
    },
    [dismissedHighlights, handleDismissHighlight, t],
  );

  const getRowClass = useCallback((params) => {
    if (isReturnedOpportunity(params?.data)) {
      return "matchingRoundOppRowReturned";
    }
    return undefined;
  }, []);

  const postSortRows = useCallback(
    ({ nodes }) => {
      if (!nodes?.length) return;
      const appointment = [];
      const unread = [];
      const active = [];
      const returned = [];
      for (const node of nodes) {
        const data = node?.data;
        // Returned always stays at the bottom (greyed), even with appointment /
        // unread signals — those still show on the row via info/review chrome.
        if (isReturnedOpportunity(data)) {
          returned.push(node);
          continue;
        }
        const stamp = opportunityHighlightStamp(data);
        const appointmentHighlightActive =
          isAppointmentRequested(data) &&
          !isHighlightDismissed(
            dismissedHighlights,
            data?.id,
            "appointment",
            stamp,
          );
        if (appointmentHighlightActive) {
          appointment.push(node);
        } else if (
          hasUnreadSponsorReply({
            notes: data?.reviewNotes,
            roundId,
            viewerId,
          })
        ) {
          unread.push(node);
        } else {
          active.push(node);
        }
      }
      nodes.length = 0;
      nodes.push(...appointment, ...unread, ...active, ...returned);
    },
    [dismissedHighlights, roundId, viewerId],
  );

  const ReviewButtonRenderer = useCallback(
    (params) => {
      const opportunity = params?.data;
      if (!opportunity?.id) return null;

      const unread = hasUnreadSponsorReply({
        notes: opportunity.reviewNotes,
        roundId,
        viewerId,
      });

      return (
        <Button
          variant="text"
          className={clsx("matchingRoundOppReviewButton", {
            matchingRoundOppReviewButtonUnread: unread,
          })}
          style={{
            padding: unread ? "4px 12px" : 0,
            minWidth: 0,
            width: "fit-content",
            height: "fit-content",
            fontSize: "14px",
            fontWeight: 500,
            color: unread
              ? "var(--MH-Theme-Additional-Accent-Dark, #3f288f)"
              : "#171717",
          }}
          leadingIcon={
            unread ? (
              <span className="matchingRoundOppReviewUnreadIcon" />
            ) : null
          }
          aria-label={
            unread
              ? t(
                  "opportunities.matchingRound.grid.reviewUnreadAria",
                  {},
                  { default: "Review — unread sponsor message" },
                )
              : undefined
          }
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
    [onPreview, roundId, t, viewerId],
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

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.refreshCells({ columns: ["info", "review"], force: true });
    api.refreshClientSideRowModel("sort");
  }, [dismissedHighlights, opportunities, roundId, viewerId]);

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
        getRowClass={getRowClass}
        postSortRows={postSortRows}
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
        paginationPageSize={50}
        paginationPageSizeSelector={[50, 100, 200]}
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
