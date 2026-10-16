import { isActionCard } from "./milestones";

/**
 * A proposal card is locked once its section's first milestone, or any
 * milestone the card is included in, was submitted. A locked card keeps
 * `content` frozen (the original entry) and is edited in `revisedContent`.
 */
export function isCardLocked(card, sectionCards = [], submitStatuses = {}) {
  const firstAction = sectionCards.find((c) => isActionCard(c));
  const submissionStage = firstAction?.milestone?.key || firstAction?.type;
  const submissionStatus =
    submitStatuses[submissionStage] ||
    (firstAction?.type && submitStatuses[firstAction.type]);
  const isCardSubmitted = card?.settings?.includeInReviewSteps?.some(
    (step) => submitStatuses[step] === "SUBMITTED"
  );
  return submissionStatus === "SUBMITTED" || !!isCardSubmitted;
}

// The field the student currently edits on the card.
export function editableCardContent(card, locked) {
  return locked ? card?.revisedContent || card?.content || "" : card?.content || "";
}

// previousEntries with this milestone's snapshot set (a resubmission
// overwrites the milestone's earlier snapshot).
export function withPreviousEntry(card, milestone, content) {
  const key = milestone?.key || milestone?.id;
  if (!key) return card?.previousEntries || {};
  return {
    ...(card?.previousEntries || {}),
    [key]: {
      milestoneId: milestone?.id ?? null,
      title: milestone?.title || key,
      content: content || "",
      submittedAt: new Date().toISOString(),
    },
  };
}

/**
 * Entries shown under "Your previous entries", oldest first. The legacy
 * original entry (`content`, frozen when the card locked) comes first,
 * unless a milestone snapshot already holds that same text.
 */
export function listPreviousEntries(card, locked) {
  const snapshots = Object.entries(card?.previousEntries || {})
    .map(([key, entry]) => ({ key, ...entry }))
    .sort((a, b) =>
      String(a.submittedAt || "").localeCompare(String(b.submittedAt || ""))
    );
  const original = card?.content || "";
  const showOriginal =
    locked &&
    !!original &&
    !snapshots.some((entry) => (entry.content || "") === original);
  return showOriginal
    ? [{ key: "__original__", isOriginal: true, content: original }, ...snapshots]
    : snapshots;
}
