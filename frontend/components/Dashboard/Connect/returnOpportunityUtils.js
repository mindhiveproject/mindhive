export const RETURNABLE_OPPORTUNITY_STATUSES = new Set([
  "pending_review",
  "pre_selected",
  "accepted",
]);

export function isReturnableOpportunityStatus(status) {
  return RETURNABLE_OPPORTUNITY_STATUSES.has(status);
}

/** Set opportunity status to returned. Mentor notification is sent in Opportunity.afterOperation. */
export async function returnOpportunityToSponsor({
  updateOpportunity,
  opportunityId,
}) {
  if (!opportunityId) {
    throw new Error("Missing opportunity id");
  }
  return updateOpportunity({
    variables: {
      id: opportunityId,
      input: { status: "returned" },
    },
  });
}
