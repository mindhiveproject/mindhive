export const DASHBOARD_PROJECTS_CARD_KEY = "projects";

export const MILESTONE_ACTION_ICONS = {
  ACTION_SUBMIT: "/assets/icons/user.svg",
  ACTION_PEER_FEEDBACK: "/assets/connect/group.svg",
  ACTION_COLLECTING_DATA: "/assets/icons/builder/collect.svg",
  ACTION_PROJECT_REPORT: "/assets/icons/document.svg",
};

export const STATUS_ICON_SRC = {
  NOT_STARTED: "/assets/icons/status/notStarted.svg",
  IN_PROGRESS: "/assets/icons/status/inProgress.svg",
  SUBMITTED: "/assets/icons/status/completed.svg",
  FINISHED: "/assets/icons/status/completed.svg",
};

export function getMilestoneActionIcon(actionCardType) {
  return MILESTONE_ACTION_ICONS[actionCardType] || null;
}

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

const countAndFormat = (arr) => {
  const counts = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([value, count]) => `${value}:${count}`)
    .join(", ");
};

export function aggregateReviewsForMilestone(project, milestone) {
  const aliases = reviewAliasesForMilestone(milestone);
  if (!aliases.size || !project?.reviews?.length) return null;

  const statuses = project.reviews
    .filter((review) => {
      const stage =
        review?.stage != null ? String(review.stage).toLowerCase() : "";
      const key =
        review?.milestone?.key != null
          ? String(review.milestone.key).toLowerCase()
          : "";
      return (stage && aliases.has(stage)) || (key && aliases.has(key));
    })
    .flatMap((review) =>
      (review?.content || [])
        .filter((question) => question?.responseType === "selectOne")
        .map((question) => question?.answer)
        .filter(Boolean)
    );

  return statuses.length ? countAndFormat(statuses) : null;
}

export function milestoneShowsReviews(milestone) {
  if (!milestone) return false;
  if (milestone.statusTarget === "study") return false;
  if (milestone.actionCardType === "ACTION_COLLECTING_DATA") return false;
  return true;
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
