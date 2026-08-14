// Feedback Center tab order and URL routing. Legacy selectors map to global
// milestone keys; custom template milestones use milestoneKey in URLs.

export const FEEDBACK_CENTER_TABS = [
  {
    selector: "proposals",
    milestoneKey: "SUBMITTED_AS_PROPOSAL",
    labelKey: "review.proposals",
  },
  {
    selector: "inreview",
    milestoneKey: "PEER_REVIEW",
    labelKey: "review.inReview",
  },
  {
    selector: "report",
    milestoneKey: "PROJECT_REPORT",
    labelKey: "review.projectReport",
  },
];

export function getTabBySelector(selector) {
  return FEEDBACK_CENTER_TABS.find((tab) => tab.selector === selector) || null;
}

export function getTabByMilestoneKey(milestoneKey) {
  const needle =
    milestoneKey != null ? String(milestoneKey).toLowerCase() : "";
  const legacy = FEEDBACK_CENTER_TABS.find(
    (tab) =>
      tab.milestoneKey === milestoneKey ||
      String(tab.milestoneKey).toLowerCase() === needle
  );
  if (legacy) return legacy;
  return {
    selector: milestoneKey,
    milestoneKey,
    labelKey: null,
    isCustom: true,
  };
}

export function getMilestoneKeyFromStage(stage) {
  const tab = FEEDBACK_CENTER_TABS.find(
    (t) => t.selector === stage || t.milestoneKey === stage
  );
  return tab?.milestoneKey ?? stage ?? "SUBMITTED_AS_PROPOSAL";
}

export function isFeedbackCenterMilestone(milestone) {
  return (
    !!milestone &&
    milestone.isActive !== false &&
    milestone.statusTarget === "board" &&
    milestone.showInFeedbackCenter !== false
  );
}

function legacyTabForMilestone(milestone) {
  if (!milestone?.key) return null;
  const needle = String(milestone.key).toLowerCase();
  return (
    FEEDBACK_CENTER_TABS.find(
      (tab) =>
        tab.milestoneKey === milestone.key ||
        String(tab.milestoneKey).toLowerCase() === needle
    ) || null
  );
}

export function buildFeedbackCenterTabs(milestones = [], t) {
  return (milestones || [])
    .filter(isFeedbackCenterMilestone)
    .map((milestone) => {
      const legacy = legacyTabForMilestone(milestone);
      if (legacy) {
        return {
          ...legacy,
          label: t(legacy.labelKey, {}, {
            default: milestone.title || milestone.key,
          }),
          isCustom: false,
        };
      }
      return {
        selector: milestone.key,
        milestoneKey: milestone.key,
        labelKey: null,
        label: milestone.title || milestone.key,
        isCustom: true,
      };
    });
}

export function resolveStageFromQuery(stage, milestones = []) {
  if (!stage) return getMilestoneKeyFromStage("proposals");

  const legacy = getTabBySelector(stage);
  if (legacy) return legacy.milestoneKey;

  const needle = String(stage).toLowerCase();
  const byKey = milestones.find(
    (m) =>
      m?.key === stage ||
      (typeof m?.key === "string" && m.key.toLowerCase() === needle)
  );
  if (byKey) return byKey.key;

  return stage;
}
