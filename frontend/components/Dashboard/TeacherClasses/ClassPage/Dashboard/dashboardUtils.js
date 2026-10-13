export const STATUS_ICON_SRC = {
  NOT_STARTED: "/assets/icons/status/notStarted.svg",
  IN_PROGRESS: "/assets/icons/status/inProgress.svg",
  SUBMITTED: "/assets/icons/status/completed.svg",
  FINISHED: "/assets/icons/status/completed.svg",
};

export function isCompleteStatus(status) {
  return status === "SUBMITTED" || status === "FINISHED";
}

export function reviewAliasesForMilestone(milestone) {
  if (!milestone) return new Set();
  return new Set(
    [milestone.reviewStage, milestone.key, milestone.actionCardType]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
  );
}

export function countReviewsForMilestone(project, milestone) {
  const aliases = reviewAliasesForMilestone(milestone);
  if (!aliases.size || !project?.reviews?.length) return 0;

  return project.reviews.filter((review) => {
    const stage =
      review?.stage != null ? String(review.stage).toLowerCase() : "";
    const key =
      review?.milestone?.key != null
        ? String(review.milestone.key).toLowerCase()
        : "";
    return (stage && aliases.has(stage)) || (key && aliases.has(key));
  }).length;
}

export function milestoneShowsReviews(milestone) {
  if (!milestone) return false;
  if (milestone.statusTarget === "study") return false;
  if (milestone.actionCardType === "ACTION_COLLECTING_DATA") return false;
  return true;
}

// `?steps=a,b` (or the legacy single `?step=a`) → ["a", "b"].
export function parseStepKeys(value) {
  const raw = Array.isArray(value) ? value.join(",") : value || "";
  return [...new Set(raw.split(",").map((key) => key.trim()).filter(Boolean))];
}

export function firstQueryValue(value) {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

const MILESTONE_TIME_FIELDS = [
  "dueDate",
  "dueAt",
  "scheduledAt",
  "startAt",
  "endAt",
  "timeSeries",
  "chartData",
];

export function milestoneHasTimeData(milestone) {
  if (!milestone) return false;
  return MILESTONE_TIME_FIELDS.some((field) => {
    const value = milestone[field];
    if (value == null || value === false) return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
}
