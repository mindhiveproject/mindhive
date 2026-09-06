import { POST_PRESELECT_STATUSES } from "./opportunityEditorTabs";

/** Round statuses that freeze sponsor edits on linked pre-selected opportunities. */
export const SPONSOR_LOCK_ROUND_STATUSES = new Set([
  "preferences_open",
  "preferences_closed",
  "matching",
  "published",
]);

/**
 * True when a sponsor-facing opportunity should be read-only because it is on
 * an active matching round (preferences open through published).
 */
export function isSponsorOpportunityLockedByRound(
  opportunity,
  { isAdmin = false } = {},
) {
  if (isAdmin || !opportunity) return false;
  if (!POST_PRESELECT_STATUSES.has(opportunity.status)) return false;
  return (opportunity.rounds || []).some((round) =>
    SPONSOR_LOCK_ROUND_STATUSES.has(round?.status),
  );
}

/** First linked round that triggers the sponsor lock (for banner copy). */
export function getSponsorLockRound(opportunity) {
  if (!opportunity) return null;
  return (
    (opportunity.rounds || []).find((round) =>
      SPONSOR_LOCK_ROUND_STATUSES.has(round?.status),
    ) || null
  );
}
