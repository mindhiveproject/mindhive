import { normalizeReviewStepKey } from "../../lib/milestones";

/**
 * Utility functions to determine card variants based on card settings and proposal status
 */

/**
 * Get variant for regular (non-action) cards
 * @param {Object} card - The card object
 * @param {Object} submitStatuses - Object mapping action card types to their statuses
 * @returns {Object} - { variant: string, reviewSteps: Array, tooltipText: string }
 */
export function getRegularCardVariant(card, submitStatuses = {}) {
  const includeInReport = card?.settings?.includeInReport;
  const includeInReviewSteps = card?.settings?.includeInReviewSteps || [];

  // If includeInReport is false, show "No Feedback" variant (no right tag)
  if (!includeInReport) {
    return {
      variant: "NO_FEEDBACK",
      reviewSteps: [],
      tooltipText: null,
    };
  }

  // If includeInReport is true, check review step statuses
  if (includeInReviewSteps.length === 0) {
    // No review steps assigned, default to non-submitted
    return {
      variant: "FEEDBACK_NON_SUBMITTED",
      reviewSteps: [],
      tooltipText: null,
    };
  }

  // Check status of each review step (supports milestone keys and legacy ACTION_* values)
  const reviewStepStatuses = includeInReviewSteps.map((step) => {
    const normalizedKey = normalizeReviewStepKey(step);
    const status =
      submitStatuses[step] || submitStatuses[normalizedKey] || "NOT_STARTED";
    return { step, status };
  });

  // Check if any step is submitted
  const hasSubmittedStep = reviewStepStatuses.some(
    (rs) => rs.status === "SUBMITTED"
  );

  // If multiple review steps, create tooltip text
  let tooltipText = null;
  if (reviewStepStatuses.length > 1) {
    const stepNames = {
      ACTION_SUBMIT: "Proposal Feedback",
      ACTION_PEER_FEEDBACK: "Peer Feedback",
      ACTION_PROJECT_REPORT: "Project Report",
    };
    tooltipText = reviewStepStatuses
      .map((rs) => {
        const stepName = stepNames[rs.step] || rs.step;
        const statusText =
          rs.status === "SUBMITTED"
            ? "Submitted"
            : rs.status === "IN_PROGRESS"
            ? "In Progress"
            : "Not Submitted";
        return `${stepName}: ${statusText}`;
      })
      .join(", ");
  }

  return {
    variant: hasSubmittedStep
      ? "FEEDBACK_SUBMITTED"
      : "FEEDBACK_NON_SUBMITTED",
    reviewSteps: reviewStepStatuses,
    tooltipText,
  };
}

/**
 * Get variant for action cards
 * @param {string} cardType - The action card type (ACTION_SUBMIT, ACTION_PEER_FEEDBACK, etc.)
 * @param {Object} submitStatuses - Object mapping action card types to their statuses
 * @returns {string} - "ACTION_NOT_SUBMITTED" or "ACTION_SUBMITTED"
 */
export function getActionCardVariant(
  cardType,
  submitStatuses = {},
  milestoneKey = null
) {
  const statusKey = milestoneKey || cardType;
  const status =
    submitStatuses[statusKey] || submitStatuses[cardType] || "NOT_STARTED";
  return status === "SUBMITTED"
    ? "ACTION_SUBMITTED"
    : "ACTION_NOT_SUBMITTED";
}
