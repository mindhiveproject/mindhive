import { isProposalFormAnswerComplete } from "./opportunityProposalData";
import { isRoundSponsorFormsVisible } from "./opportunityEditorTabs";

export const OPPORTUNITY_LIST_STEP_KEYS = [
  "draft",
  "visible",
  "preSelected",
  "formsMatching",
  "matched",
];

const MATCHED_ROUND_STATUSES = new Set(["published", "archived"]);

const POST_PRESELECT_STATUSES = new Set([
  "pre_selected",
  "accepted",
  "published",
  "closed",
  "archived",
]);

/**
 * Visible follow-up forms across held rounds (sponsor-visible only).
 * Dedupes by form id when the same definition appears on multiple rounds.
 */
export function getVisibleFollowUpForms(rounds) {
  const byId = new Map();
  for (const round of rounds || []) {
    if (!isRoundSponsorFormsVisible(round)) continue;
    for (const form of round.formDefinitions || []) {
      if (form?.id && !byId.has(form.id)) {
        byId.set(form.id, form);
      }
    }
  }
  return [...byId.values()];
}

function formCompletionCounts(proposalData, forms) {
  let done = 0;
  for (const form of forms) {
    if (isProposalFormAnswerComplete(proposalData, form.id)) {
      done += 1;
    }
  }
  return { done, total: forms.length };
}

function isRoundMatched(rounds) {
  return (rounds || []).some((round) =>
    MATCHED_ROUND_STATUSES.has(round?.status),
  );
}

function visibleLabelForCount(networkCount) {
  if (!networkCount) {
    return { labelKey: "visibleNone", labelQuery: undefined };
  }
  if (networkCount === 1) {
    return { labelKey: "visibleOne", labelQuery: undefined };
  }
  return {
    labelKey: "visibleMany",
    labelQuery: { count: networkCount },
  };
}

/**
 * Resolve the minimal list stepper for a sponsor opportunity.
 *
 * Progressive disclosure:
 * - Draft: only Draft
 * - Pending review: only Visible-in-networks (same copy as former visibility line)
 * - Pre-selected+: Pre-selected + forms/matching (or Matched)
 *
 * @param {{
 *   status?: string,
 *   proposalData?: unknown,
 *   rounds?: Array,
 *   networkCount?: number,
 * }} input
 * @returns {{
 *   steps: Array<{
 *     key: string,
 *     visual: 'done' | 'active' | 'pending',
 *     labelKey: string,
 *     labelQuery?: { done?: number, total?: number, count?: number },
 *     isVisibility?: boolean,
 *   }>,
 *   phase: 'draft' | 'visible' | 'held' | 'matched',
 * }}
 */
export function resolveOpportunityListStepper({
  status: rawStatus,
  proposalData,
  rounds,
  networkCount = 0,
} = {}) {
  const status = rawStatus || "draft";
  const heldRounds = POST_PRESELECT_STATUSES.has(status) ? rounds || [] : [];
  const forms = getVisibleFollowUpForms(heldRounds);
  const { done, total } = formCompletionCounts(proposalData, forms);
  const formsIncomplete = total > 0 && done < total;
  const matched = isRoundMatched(heldRounds);
  const visibleLabel = visibleLabelForCount(networkCount);

  if (status === "draft" || status === "returned") {
    return {
      phase: "draft",
      steps: [
        {
          key: "draft",
          visual: "active",
          labelKey: "draft",
        },
      ],
    };
  }

  if (!POST_PRESELECT_STATUSES.has(status)) {
    // pending_review and any other pre-hold status: single visibility step
    return {
      phase: "visible",
      steps: [
        {
          key: "visible",
          visual: "active",
          labelKey: visibleLabel.labelKey,
          labelQuery: visibleLabel.labelQuery,
          isVisibility: true,
        },
      ],
    };
  }

  if (matched) {
    return {
      phase: "matched",
      steps: [
        {
          key: "preSelected",
          visual: "done",
          labelKey: "preSelected",
        },
        {
          key: "matched",
          visual: "active",
          labelKey: "matched",
        },
      ],
    };
  }

  let formsMatchingLabelKey = "awaitingMatching";
  let formsMatchingQuery;
  if (formsIncomplete) {
    formsMatchingLabelKey = "formsProgress";
    formsMatchingQuery = { done, total };
  }

  const steps = [
    {
      key: "preSelected",
      visual: "done",
      labelKey: "preSelected",
    },
    {
      key: "formsMatching",
      visual: "active",
      labelKey: formsMatchingLabelKey,
      labelQuery: formsMatchingQuery,
    },
  ];

  // Ahead-of-current steps after the matching/forms stage — disabled chips.
  if (formsIncomplete) {
    steps.push({
      key: "matching",
      visual: "pending",
      labelKey: "matching",
    });
  }

  steps.push({
    key: "matched",
    visual: "pending",
    labelKey: "matched",
  });

  return {
    phase: "held",
    steps,
  };
}
