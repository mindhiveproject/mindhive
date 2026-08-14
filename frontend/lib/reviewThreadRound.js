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

/** Default number of latest notes shown when the thread is collapsed. */
export const DEFAULT_VISIBLE_REVIEW_NOTES = 2;

/**
 * Collapse a chronologically ascending notes list to the latest `limit` items
 * unless `expanded` is true.
 *
 * @param {Array} notes
 * @param {{ expanded?: boolean, limit?: number }} [opts]
 * @returns {{ visibleNotes: Array, hiddenCount: number, canLoadPrevious: boolean }}
 */
export function getCollapsedReviewNotes(
  notes = [],
  { expanded = false, limit = DEFAULT_VISIBLE_REVIEW_NOTES } = {}
) {
  const list = Array.isArray(notes) ? notes : [];
  const safeLimit = Math.max(0, Number(limit) || 0);

  if (expanded || list.length <= safeLimit) {
    return {
      visibleNotes: list,
      hiddenCount: 0,
      canLoadPrevious: false,
    };
  }

  const hiddenCount = list.length - safeLimit;
  return {
    visibleNotes: list.slice(-safeLimit),
    hiddenCount,
    canLoadPrevious: hiddenCount > 0,
  };
}

export const REVIEW_NOTE_KIND = {
  REVIEWER_COMMENT: "reviewer_comment",
  SPONSOR_REPLY: "sponsor_reply",
};

/**
 * Sponsor replies in a round that the viewer has not marked as read.
 * @param {{ notes?: Array, roundId?: string|null, viewerId?: string|null }} args
 */
export function getUnreadSponsorReplyNotes({
  notes = [],
  roundId = null,
  viewerId = null,
} = {}) {
  if (!roundId || !viewerId) return [];
  return filterNotesByRound(notes, roundId).filter((note) => {
    if (note?.kind !== REVIEW_NOTE_KIND.SPONSOR_REPLY) return false;
    const readers = note?.readBy || [];
    return !readers.some((reader) => reader?.id === viewerId);
  });
}

export function hasUnreadSponsorReply({
  notes = [],
  roundId = null,
  viewerId = null,
} = {}) {
  return (
    getUnreadSponsorReplyNotes({ notes, roundId, viewerId }).length > 0
  );
}

function isReviewerCommentNote(note, viewerId) {
  if (!note) return false;
  if (note.kind === REVIEW_NOTE_KIND.SPONSOR_REPLY) return false;
  if (note.author?.id && note.author.id === viewerId) return false;
  // reviewer_comment, or legacy notes without kind
  return !note.kind || note.kind === REVIEW_NOTE_KIND.REVIEWER_COMMENT;
}

/**
 * Teacher / reviewer comments the viewer has not marked as read.
 * Omit `roundId` to count across all rounds (opportunity-level list).
 * @param {{ notes?: Array, roundId?: string|null, viewerId?: string|null }} args
 */
export function getUnreadReviewerCommentNotes({
  notes = [],
  roundId = null,
  viewerId = null,
} = {}) {
  if (!viewerId) return [];
  const scoped = roundId
    ? filterNotesByRound(notes, roundId)
    : Array.isArray(notes)
      ? notes
      : [];
  return scoped.filter((note) => {
    if (!isReviewerCommentNote(note, viewerId)) return false;
    const readers = note?.readBy || [];
    return !readers.some((reader) => reader?.id === viewerId);
  });
}

export function hasUnreadReviewerComment({
  notes = [],
  roundId = null,
  viewerId = null,
} = {}) {
  return (
    getUnreadReviewerCommentNotes({ notes, roundId, viewerId }).length > 0
  );
}
