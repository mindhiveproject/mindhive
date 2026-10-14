import {
  cardIncludedInReviewStep,
  parseCardSettings,
} from "../../../../../lib/milestones";
import { readMilestoneStatus } from "../../../../../lib/milestoneStatus";

export const STATUS_ICON_SRC = {
  NOT_STARTED: "/assets/icons/status/notStarted.svg",
  IN_PROGRESS: "/assets/icons/status/inProgress.svg",
  SUBMITTED: "/assets/icons/status/completed.svg",
  FINISHED: "/assets/icons/status/completed.svg",
};

export function isCompleteStatus(status) {
  return status === "SUBMITTED" || status === "FINISHED";
}

// Submitted work can be reopened; a study only while it's submitted (locked).
export function canReopenMilestone(status, isStudy) {
  return isStudy ? status === "SUBMITTED" : isCompleteStatus(status);
}

export function milestoneStatusLabel(status, t, isStudy) {
  // A study is either submitted for data collection (locked) or not.
  if (isStudy) {
    return status === "SUBMITTED"
      ? t("dashboard.submittedForDataCollection", {}, {
          default: "Submitted for data collection",
        })
      : t("dashboard.notSubmitted", {}, { default: "Not submitted" });
  }
  switch (status) {
    case "IN_PROGRESS":
      return t("dashboard.inProgress", {}, { default: "In progress" });
    case "SUBMITTED":
      return t("dashboard.submitted", {}, { default: "Submitted" });
    case "FINISHED":
      return t("dashboard.reviewFinished", {}, { default: "Review is finished" });
    case "NOT_STARTED":
    default:
      return t("dashboard.notStarted", {}, { default: "Not started" });
  }
}

// Study milestones are two-state: SUBMITTED (study locked) or NOT_STARTED.
// Otherwise a stored status wins; a board still at NOT_STARTED reads as
// IN_PROGRESS once any card included in the milestone has moved off
// "Not started".
export function deriveMilestoneStatus(project, milestone, milestones = []) {
  const stored =
    readMilestoneStatus(project, milestone?.key, milestones)?.status ||
    "NOT_STARTED";
  if (milestone?.statusTarget === "study") {
    return stored === "SUBMITTED" ? "SUBMITTED" : "NOT_STARTED";
  }
  if (stored !== "NOT_STARTED") return stored;

  const started = (project?.sections || []).some((section) =>
    (section?.cards || []).some((card) => {
      if (!cardIncludedInReviewStep(card, milestone?.key, milestones)) {
        return false;
      }
      const cardStatus = parseCardSettings(card)?.status;
      return Boolean(cardStatus) && cardStatus !== "Not started";
    })
  );
  return started ? "IN_PROGRESS" : "NOT_STARTED";
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
