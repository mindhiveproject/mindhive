/** Opportunity statuses at/after matching-round selection (mirrors frontend). */
const POST_PRESELECT_STATUSES = new Set([
  "pre_selected",
  "accepted",
  "published",
  "closed",
  "archived",
]);

export const SPONSOR_LOCK_ROUND_STATUSES = new Set([
  "preferences_open",
  "preferences_closed",
  "matching",
  "published",
]);

type RoundLike = { status?: string | null } | null | undefined;
type OpportunityLike = {
  status?: string | null;
  rounds?: RoundLike[] | null;
} | null | undefined;

export function isSponsorOpportunityLockedByRound(
  opportunity: OpportunityLike,
  { isAdmin = false } = {},
): boolean {
  if (isAdmin || !opportunity) return false;
  if (!POST_PRESELECT_STATUSES.has(String(opportunity.status || ""))) {
    return false;
  }
  return (opportunity.rounds || []).some((round) =>
    SPONSOR_LOCK_ROUND_STATUSES.has(String(round?.status || "")),
  );
}

/** Keys allowed on update while sponsor-locked (status-only flows). */
export const SPONSOR_LOCK_ALLOWED_UPDATE_KEYS = new Set(["status"]);
