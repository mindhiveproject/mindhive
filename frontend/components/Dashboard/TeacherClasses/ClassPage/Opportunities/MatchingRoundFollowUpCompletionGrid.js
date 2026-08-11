import { useCallback, useMemo, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";
import styled from "styled-components";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import Chip from "../../../../DesignSystem/Chip";
import Button from "../../../../DesignSystem/Button";
import {
  getProposalEntrySavedAt,
  isProposalFormAnswerComplete,
} from "../../../../../lib/opportunityProposalData";
import { formTabKey } from "../../../../../lib/opportunityEditorTabs";
import { opportunityToneChipStyle } from "../../../../../lib/opportunityStatusTones";

function displayName(profile) {
  if (!profile) return null;
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username
  );
}

function formatSavedAt(iso) {
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

function truncateLabel(label, max = 28) {
  const text = String(label || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

const StatusButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  white-space: nowrap;
  cursor: pointer;
  font-family: inherit;

  &.complete {
    background: #e3f4ec;
    color: #1d6b3a;
    border: 1px solid #b8dcc8;
  }

  &.incomplete {
    background: #fdf6e8;
    color: #8a6d3b;
    border: 1px solid #e8d4a8;
  }

  &:hover {
    filter: brightness(0.97);
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }
`;

/**
 * Compact opportunity × follow-up form completion matrix for teachers.
 */
export default function MatchingRoundFollowUpCompletionGrid({
  opportunities = [],
  forms = [],
  sponsorFormsVisible = false,
  onPreview,
  onManageForms,
}) {
  const { t } = useTranslation("classes");
  const gridRef = useRef(null);
  const [incompleteOnly, setIncompleteOnly] = useState(false);

  const formList = useMemo(
    () => (Array.isArray(forms) ? forms.filter((f) => f?.id) : []),
    [forms],
  );

  const rowData = useMemo(() => {
    const rows = (opportunities || []).map((opportunity) => {
      const completionByFormId = {};
      let doneCount = 0;
      for (const form of formList) {
        const complete = isProposalFormAnswerComplete(
          opportunity.proposalData,
          form.id,
          opportunity.videoFile,
        );
        const savedAt = getProposalEntrySavedAt(
          opportunity.proposalData,
          form.id,
        );
        completionByFormId[form.id] = { complete, savedAt };
        if (complete) doneCount += 1;
      }
      return {
        ...opportunity,
        sponsorName: displayName(opportunity.mentor) || "—",
        organizationName: opportunity.organization?.name || "—",
        formsDone: doneCount,
        formsTotal: formList.length,
        allComplete: formList.length > 0 && doneCount === formList.length,
        hasIncomplete: formList.length > 0 && doneCount < formList.length,
        completionByFormId,
      };
    });

    if (!incompleteOnly) return rows;
    return rows.filter((row) => row.hasIncomplete);
  }, [opportunities, formList, incompleteOnly]);

  const summary = useMemo(() => {
    const totalOpps = opportunities?.length || 0;
    let completeOpps = 0;
    let doneResponses = 0;
    const totalResponses = totalOpps * formList.length;
    for (const opportunity of opportunities || []) {
      let doneForOpp = 0;
      for (const form of formList) {
        if (
          isProposalFormAnswerComplete(
            opportunity.proposalData,
            form.id,
            opportunity.videoFile,
          )
        ) {
          doneForOpp += 1;
          doneResponses += 1;
        }
      }
      if (formList.length > 0 && doneForOpp === formList.length) {
        completeOpps += 1;
      }
    }
    return { totalOpps, completeOpps, doneResponses, totalResponses };
  }, [opportunities, formList]);

  const handlePreviewForm = useCallback(
    (opportunityId, formId) => {
      if (!opportunityId || !onPreview) return;
      if (formId) {
        onPreview(opportunityId, { initialTab: formTabKey(formId) });
        return;
      }
      onPreview(opportunityId);
    },
    [onPreview],
  );

  const ProgressRenderer = useCallback(
    (params) => {
      const data = params?.data;
      if (!data || !formList.length) return null;
      return (
        <span className="matchingRoundFollowUpProgress">
          {t(
            "opportunities.matchingRound.followUpCompletion.progressCell",
            { done: data.formsDone, total: data.formsTotal },
            { default: "{{done}}/{{total}}" },
          )}
        </span>
      );
    },
    [formList.length, t],
  );

  const FormStatusRenderer = useCallback(
    (params) => {
      const formId = params?.colDef?.formDefinitionId;
      const data = params?.data;
      if (!formId || !data) return null;
      const status = data.completionByFormId?.[formId];
      const complete = Boolean(status?.complete);
      const savedAtLabel = formatSavedAt(status?.savedAt);
      const label = complete
        ? savedAtLabel
          ? t(
              "opportunities.matchingRound.followUpCompletion.completeSaved",
              { date: savedAtLabel },
              { default: "Complete · {{date}}" },
            )
          : t(
              "opportunities.matchingRound.followUpCompletion.complete",
              {},
              { default: "Complete" },
            )
        : t(
            "opportunities.matchingRound.followUpCompletion.incomplete",
            {},
            { default: "Incomplete" },
          );

      return (
        <StatusButton
          type="button"
          data-follow-up-form-status
          className={clsx(complete ? "complete" : "incomplete")}
          title={label}
          aria-label={t(
            "opportunities.matchingRound.followUpCompletion.openFormAria",
            {
              status: complete
                ? t(
                    "opportunities.matchingRound.followUpCompletion.complete",
                    {},
                    { default: "Complete" },
                  )
                : t(
                    "opportunities.matchingRound.followUpCompletion.incomplete",
                    {},
                    { default: "Incomplete" },
                  ),
              form: params?.colDef?.headerTooltip || params?.colDef?.headerName,
              opportunity: data.title,
            },
            {
              default:
                "{{status}} — open {{form}} for {{opportunity}}",
            },
          )}
          onClick={(e) => {
            e.stopPropagation();
            handlePreviewForm(data.id, formId);
          }}
        >
          {complete
            ? t(
                "opportunities.matchingRound.followUpCompletion.complete",
                {},
                { default: "Complete" },
              )
            : t(
                "opportunities.matchingRound.followUpCompletion.incomplete",
                {},
                { default: "Incomplete" },
              )}
        </StatusButton>
      );
    },
    [handlePreviewForm, t],
  );

  const columnDefs = useMemo(() => {
    const cols = [
      {
        field: "title",
        headerName: t(
          "opportunities.matchingRound.followUpCompletion.columns.opportunity",
          {},
          { default: "Opportunity" },
        ),
        filter: "agTextColumnFilter",
        sortable: true,
        pinned: "left",
        flex: 1.6,
        minWidth: 160,
      },
      {
        field: "sponsorName",
        headerName: t(
          "opportunities.matchingRound.followUpCompletion.columns.sponsor",
          {},
          { default: "Sponsor" },
        ),
        filter: "agTextColumnFilter",
        sortable: true,
        flex: 1.1,
        minWidth: 120,
      },
      {
        field: "organizationName",
        headerName: t(
          "opportunities.matchingRound.followUpCompletion.columns.organization",
          {},
          { default: "Organization" },
        ),
        filter: "agTextColumnFilter",
        sortable: true,
        flex: 1.1,
        minWidth: 120,
      },
    ];

    if (formList.length > 0) {
      cols.push({
        field: "formsDone",
        headerName: t(
          "opportunities.matchingRound.followUpCompletion.columns.progress",
          {},
          { default: "Progress" },
        ),
        sortable: true,
        width: 100,
        cellRenderer: ProgressRenderer,
        cellStyle: {
          display: "flex",
          alignItems: "center",
        },
      });
    }

    for (const form of formList) {
      const fullTitle = form.title || form.key || form.id;
      cols.push({
        colId: `form:${form.id}`,
        formDefinitionId: form.id,
        headerName: truncateLabel(fullTitle),
        headerTooltip: fullTitle,
        sortable: true,
        filter: false,
        minWidth: 120,
        flex: 1,
        cellRenderer: FormStatusRenderer,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        valueGetter: (params) =>
          params?.data?.completionByFormId?.[form.id]?.complete ? 1 : 0,
      });
    }

    return cols;
  }, [formList, FormStatusRenderer, ProgressRenderer, t]);

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      suppressMovable: true,
      sortingOrder: ["asc", "desc", null],
    }),
    [],
  );

  if (formList.length === 0) {
    return (
      <div className="matchingRoundFollowUpCompletion">
        <div className="matchingRoundFollowUpCompletionEmpty">
          <p className="matchingRoundFollowUpCompletionEmptyTitle">
            {t(
              "opportunities.matchingRound.followUpCompletion.emptyNoFormsTitle",
              {},
              { default: "No questionnaires attached yet" },
            )}
          </p>
          <p className="matchingRoundFollowUpCompletionEmptyHint">
            {t(
              "opportunities.matchingRound.followUpCompletion.emptyNoFormsHint",
              {},
              {
                default:
                  "Add follow-up questionnaires above, then track who has responded here.",
              },
            )}
          </p>
          {onManageForms ? (
            <Button
              type="button"
              variant="text"
              className="matchingRoundFollowUpCompletionEmptyAction"
              onClick={onManageForms}
              style={{
                padding: 0,
                minWidth: 0,
                width: "fit-content",
                height: "fit-content",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--MH-Theme-Primary-Dark, #336f8a)",
              }}
            >
              {t(
                "opportunities.matchingRound.followUpCompletion.manageForms",
                {},
                { default: "Manage questionnaires" },
              )}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!opportunities?.length) {
    return (
      <div className="matchingRoundFollowUpCompletion">
        <div className="matchingRoundFollowUpCompletionHeader">
          <div className="matchingRoundFollowUpCompletionCopy">
            <h4 className="matchingRoundFollowUpCompletionTitle">
              {t(
                "opportunities.matchingRound.followUpCompletion.title",
                {},
                { default: "Response status" },
              )}
            </h4>
          </div>
        </div>
        <div className="matchingRoundFollowUpCompletionEmpty">
          <p className="matchingRoundFollowUpCompletionEmptyTitle">
            {t(
              "opportunities.matchingRound.followUpCompletion.emptyNoOppsTitle",
              {},
              { default: "No pre-selected opportunities yet" },
            )}
          </p>
          <p className="matchingRoundFollowUpCompletionEmptyHint">
            {t(
              "opportunities.matchingRound.followUpCompletion.emptyNoOppsHint",
              {},
              {
                default:
                  "Pre-select opportunities in this round first. Sponsors for those opportunities can then complete the questionnaires.",
              },
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="matchingRoundFollowUpCompletion">
      <div className="matchingRoundFollowUpCompletionHeader">
        <div className="matchingRoundFollowUpCompletionCopy">
          <h4 className="matchingRoundFollowUpCompletionTitle">
            {t(
              "opportunities.matchingRound.followUpCompletion.title",
              {},
              { default: "Response status" },
            )}
          </h4>
          <p className="matchingRoundFollowUpCompletionSummary">
            {t(
              "opportunities.matchingRound.followUpCompletion.summary",
              {
                completeOpps: summary.completeOpps,
                totalOpps: summary.totalOpps,
                doneResponses: summary.doneResponses,
                totalResponses: summary.totalResponses,
              },
              {
                default:
                  "{{completeOpps}}/{{totalOpps}} opportunities complete · {{doneResponses}}/{{totalResponses}} form responses",
              },
            )}
          </p>
        </div>
        <div className="matchingRoundFollowUpCompletionFilters">
          <Chip
            shape="square"
            label={t(
              "opportunities.matchingRound.followUpCompletion.filterAll",
              {},
              { default: "All" },
            )}
            selected={!incompleteOnly}
            onClick={() => setIncompleteOnly(false)}
            style={{ height: "28px", fontSize: "13px"}}
          />
          <Chip
            shape="square"
            label={t(
              "opportunities.matchingRound.followUpCompletion.filterIncomplete",
              {},
              { default: "Incomplete only" },
            )}
            selected={incompleteOnly}
            onClick={() => setIncompleteOnly(true)}
            style={{
              height: "28px",
              fontSize: "13px"}}
          />
        </div>
      </div>

      {!sponsorFormsVisible ? (
        <p
          className="matchingRoundFollowUpCompletionHiddenBanner"
          role="status"
        >
          {t(
            "opportunities.matchingRound.followUpCompletion.hiddenBanner",
            {},
            {
              default:
                "Questionnaires are currently hidden from sponsors. They cannot respond until you show forms to sponsors.",
            },
          )}
        </p>
      ) : null}

      {rowData.length === 0 ? (
        <div className="matchingRoundFollowUpCompletionEmpty">
          <p className="matchingRoundFollowUpCompletionEmptyTitle">
            {t(
              "opportunities.matchingRound.followUpCompletion.emptyFilterTitle",
              {},
              { default: "Everyone is complete" },
            )}
          </p>
          <p className="matchingRoundFollowUpCompletionEmptyHint">
            {t(
              "opportunities.matchingRound.followUpCompletion.emptyFilterHint",
              {},
              {
                default:
                  "No incomplete responses match this filter. Switch to All to see every opportunity.",
              },
            )}
          </p>
        </div>
      ) : (
        <div
          className="ag-theme-quartz matchingRoundFollowUpCompletionGrid"
          style={{ width: "100%", height: "420px" }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            getRowId={(params) => params.data?.id}
            animateRows={false}
            suppressCellFocus
            tooltipShowDelay={400}
            onRowClicked={(event) => {
              if (
                event?.event?.target?.closest?.('[data-follow-up-form-status]')
              ) {
                return;
              }
              if (event?.data?.id) {
                handlePreviewForm(event.data.id);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
