// Builder-namespace labels for a study's data-collection stage
// (lib/studyLifecycle.js).

export function stageLabel(t, stage) {
  if (stage === "COLLECTING") {
    return t("dataCollection.stage.collecting", {}, {
      default: "Collecting data",
    });
  }
  if (stage === "FINISHED") {
    return t("dataCollection.stage.finished", {}, {
      default: "Data collection finished",
    });
  }
  return t("dataCollection.stage.designing", {}, { default: "Designing" });
}

// Old review labels some studies still hold (read as Designing).
export function legacyStatusLabel(t, status) {
  const labels = {
    SUBMITTED_AS_PROPOSAL: t("status.submittedAsProposal", {}, {
      default: "Submitted as proposal",
    }),
    READY_FOR_REVIEW: t("status.readyForReview", {}, {
      default: "Ready for review",
    }),
    IN_REVIEW: t("status.inReview", {}, { default: "In review" }),
    REVIEWED: t("status.reviewed", {}, { default: "Reviewed" }),
  };
  return labels[status] || null;
}

export function formatDateTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
