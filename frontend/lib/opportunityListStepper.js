import { isProposalFormAnswerComplete } from "./opportunityProposalData";
import { isRoundSponsorFormsVisible } from "./opportunityEditorTabs";
import { REVIEW_NOTE_KIND } from "./reviewThreadRound";

export const OPPORTUNITY_LIST_STEP_KEYS = [
  "draft",
  "inRevision",
  "returnedWithComments",
  "submitted",
  "preSelected",
  "accepted",
  "formsProgress",
  "matching",
  "matched",
];

/**
 * Teacher return notes (not sponsor replies). Used to choose the returned chip label.
 */
export function hasReviewerReturnComments(reviewNotes) {
  return (reviewNotes || []).some((note) => {
    if (!note) return false;
    if (note.kind === REVIEW_NOTE_KIND.SPONSOR_REPLY) return false;
    // reviewer_comment, or legacy notes without kind
    return true;
  });
}

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

function formCompletionCounts(proposalData, forms, videoFile) {
  let done = 0;
  for (const form of forms) {
    if (isProposalFormAnswerComplete(proposalData, form.id, videoFile)) {
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

/**
 * Resolve the minimal list stepper for a sponsor opportunity.
 *
 * Composite chips: [status]-[exception?]-[matching?]
 * Visual tones: action | waiting | done | pending
 *
 * @param {{
 *   status?: string,
 *   proposalData?: unknown,
 *   rounds?: Array,
 *   reviewNotes?: Array,
 * }} input
 * @returns {{
 *   steps: Array<{
 *     key: string,
 *     visual: 'action' | 'waiting' | 'done' | 'pending',
 *     labelKey: string,
 *     labelQuery?: { done?: number, total?: number, count?: number },
 *     isVisibility?: boolean,
 *   }>,
 *   phase: 'draft' | 'returned' | 'submitted' | 'held' | 'matched',
 * }}
 */
export function resolveOpportunityListStepper({
  status: rawStatus,
  proposalData,
  rounds,
  videoFile,
  reviewNotes,
} = {}) {
  const status = rawStatus || "draft";
  const heldRounds = POST_PRESELECT_STATUSES.has(status) ? rounds || [] : [];
  const forms = getVisibleFollowUpForms(heldRounds);
  const { done, total } = formCompletionCounts(proposalData, forms, videoFile);
  const formsIncomplete = total > 0 && done < total;
  const matched = isRoundMatched(heldRounds);

  if (status === "draft") {
    return {
      phase: "draft",
      steps: [
        {
          key: "draft",
          visual: "action",
          labelKey: "draft",
        },
      ],
    };
  }

  if (status === "returned") {
    const withComments = hasReviewerReturnComments(reviewNotes);
    const returnedKey = withComments
      ? "returnedWithComments"
      : "inRevision";
    return {
      phase: "returned",
      steps: [
        {
          key: returnedKey,
          visual: "action",
          labelKey: returnedKey,
        },
      ],
    };
  }

  if (!POST_PRESELECT_STATUSES.has(status)) {
    // pending_review and any other pre-hold status
    return {
      phase: "submitted",
      steps: [
        {
          key: "submitted",
          visual: "waiting",
          labelKey: "submitted",
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
          key: "matched",
          visual: "done",
          labelKey: "matched",
        },
      ],
    };
  }

  const holdKey = status === "accepted" ? "accepted" : "preSelected";
  const steps = [
    {
      key: holdKey,
      visual: "done",
      labelKey: holdKey,
    },
  ];

  if (formsIncomplete) {
    steps.push({
      key: "formsProgress",
      visual: "action",
      labelKey: "formsProgress",
      labelQuery: { done, total },
    });
    steps.push({
      key: "matching",
      visual: "pending",
      labelKey: "matching",
    });
  } else {
    steps.push({
      key: "matching",
      visual: "waiting",
      labelKey: "matching",
    });
  }

  return {
    phase: "held",
    steps,
  };
}
