/**
 * Resolve which ConnectRound is active for a review conversation.
 *
 * Rules (v1):
 * 1. If `explicitRoundId` is provided and matches an eligible round, use it.
 * 2. If exactly one eligible round exists, auto-select it.
 * 3. Otherwise leave unresolved — caller must require an explicit choice.
 *
 * Eligible rounds default to `opportunity.rounds`. Callers may pass a
 * narrower list (e.g. rounds that already have notes).
 */

export function resolveActiveReviewRound({
  rounds = [],
  explicitRoundId = null,
} = {}) {
  const eligible = (Array.isArray(rounds) ? rounds : []).filter(
    (round) => round?.id
  );

  if (explicitRoundId) {
    const matched = eligible.find((round) => round.id === explicitRoundId);
    if (matched) {
      return {
        round: matched,
        roundId: matched.id,
        status: "resolved",
        reason: "explicit",
        needsSelection: false,
        eligibleRounds: eligible,
      };
    }
  }

  if (eligible.length === 1) {
    return {
      round: eligible[0],
      roundId: eligible[0].id,
      status: "resolved",
      reason: "sole",
      needsSelection: false,
      eligibleRounds: eligible,
    };
  }

  if (eligible.length === 0) {
    return {
      round: null,
      roundId: null,
      status: "none",
      reason: "none",
      needsSelection: false,
      eligibleRounds: eligible,
    };
  }

  return {
    round: null,
    roundId: null,
    status: "unresolved",
    reason: "multiple",
    needsSelection: true,
    eligibleRounds: eligible,
  };
}

/** Ascending chronological order for thread display. */
export function sortReviewNotesAscending(notes = []) {
  return [...(notes || [])].sort((a, b) => {
    const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });
}

export function filterNotesByRound(notes = [], roundId) {
  if (!roundId) return [];
  return (notes || []).filter((note) => note?.round?.id === roundId);
}

export const REVIEW_NOTE_KIND = {
  REVIEWER_COMMENT: "reviewer_comment",
  SPONSOR_REPLY: "sponsor_reply",
};
