export const RETURNABLE_OPPORTUNITY_STATUSES = new Set([
  "pending_review",
  "pre_selected",
  "accepted",
]);

export function isReturnableOpportunityStatus(status) {
  return RETURNABLE_OPPORTUNITY_STATUSES.has(status);
}
