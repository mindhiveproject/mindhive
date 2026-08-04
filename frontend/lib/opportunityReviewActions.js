/**
 * Shared helpers for teacher/admin opportunity review status transitions.
 * Used by Connect network review (replacing legacy Editor ?review=1).
 */

export function buildReviewStatusInput({
  nextStatus,
  opportunity,
  reviewerId,
}) {
  return {
    status: nextStatus,
    preSelectedAt:
      nextStatus === "pre_selected" && !opportunity?.preSelectedAt
        ? new Date().toISOString()
        : opportunity?.preSelectedAt || null,
    acceptedAt:
      nextStatus === "accepted" && !opportunity?.acceptedAt
        ? new Date().toISOString()
        : opportunity?.acceptedAt || null,
    reviewedBy: reviewerId ? { connect: { id: reviewerId } } : undefined,
  };
}

export function getReviewPrimaryAction(status, t) {
  if (status === "pending_review") {
    return {
      nextStatus: "pre_selected",
      label: t("opportunityEditor.review.preSelect", {}, {
        default: "Pre-select sponsor",
      }),
    };
  }
  if (status === "pre_selected") {
    return {
      nextStatus: "accepted",
      label: t("opportunityEditor.review.accept", {}, {
        default: "Accept proposal",
      }),
    };
  }
  if (status === "accepted") {
    return {
      nextStatus: "published",
      label: t("opportunityEditor.review.publish", {}, {
        default: "Publish opportunity",
      }),
    };
  }
  return null;
}

/**
 * Confirm + validate a review status transition. Returns false if aborted.
 */
export function confirmReviewStatusTransition({
  nextStatus,
  scopeDescription,
  t,
}) {
  if (nextStatus === "pre_selected") {
    return window.confirm(
      t("opportunityEditor.review.preSelectConfirm", {}, {
        default:
          "Pre-select this sponsor? They will be notified of your decision.",
      }),
    );
  }
  if (nextStatus === "accepted") {
    return window.confirm(
      t("opportunityEditor.review.acceptConfirm", {}, {
        default:
          "Accept this proposal? The sponsor will be notified to complete the final scope.",
      }),
    );
  }
  if (nextStatus === "published") {
    if (!String(scopeDescription || "").trim()) {
      window.alert(
        t("opportunityEditor.review.scopeIncomplete", {}, {
          default:
            "The sponsor must complete the project scope before you can publish.",
        }),
      );
      return false;
    }
    return window.confirm(
      t("opportunityEditor.review.publishConfirm", {}, {
        default: "Publish this opportunity so students can see it?",
      }),
    );
  }
  return true;
}

export function reviewSuccessMessage(nextStatus, t) {
  if (nextStatus === "pre_selected") {
    return t("opportunityEditor.review.preSelectSuccess", {}, {
      default: "Sponsor pre-selected and notified.",
    });
  }
  if (nextStatus === "accepted") {
    return t("opportunityEditor.review.acceptSuccess", {}, {
      default: "Proposal accepted and sponsor notified.",
    });
  }
  if (nextStatus === "published") {
    return t("opportunityEditor.review.publishSuccess", {}, {
      default: "Opportunity published.",
    });
  }
  return null;
}

export function reviewEmailCopy(nextStatus, t) {
  if (nextStatus === "pre_selected") {
    return {
      title: t("opportunityEditor.review.emailPreSelectTitle", {}, {
        default: "Your Capstone proposal was pre-selected",
      }),
      message: t("opportunityEditor.review.emailPreSelectMessage", {}, {
        default:
          "A teacher has pre-selected your Capstone proposal. They will review it for acceptance next.",
      }),
      link: null,
    };
  }
  if (nextStatus === "accepted") {
    return {
      title: t("opportunityEditor.review.emailAcceptTitle", {}, {
        default: "Your Capstone proposal was accepted",
      }),
      message: t("opportunityEditor.review.emailAcceptMessage", {}, {
        default:
          "Your Capstone proposal has been accepted. Please log in to complete the final project scope.",
      }),
      link: null,
    };
  }
  return null;
}
