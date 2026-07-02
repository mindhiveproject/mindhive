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
  const legacy = FEEDBACK_CENTER_TABS.find(
    (tab) => tab.milestoneKey === milestoneKey
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

export function buildFeedbackCenterTabs(milestones = [], t) {
  const templateTabs = milestones
    .filter(
      (m) =>
        m.scope === "template" &&
        m.statusTarget === "board" &&
        m.showInFeedbackCenter !== false
    )
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((m) => ({
      selector: m.key,
      milestoneKey: m.key,
      labelKey: null,
      label: m.title || m.key,
      isCustom: true,
    }));

  if (templateTabs.length > 0) {
    return templateTabs;
  }

  return FEEDBACK_CENTER_TABS.map((tab) => ({
    ...tab,
    label: t(tab.labelKey, {}, { default: tab.milestoneKey }),
    isCustom: false,
  }));
}

export function resolveStageFromQuery(stage, milestones = []) {
  if (!stage) return getMilestoneKeyFromStage("proposals");

  const legacy = getTabBySelector(stage);
  if (legacy) return legacy.milestoneKey;

  const byKey = milestones.find((m) => m.key === stage);
  if (byKey) return byKey.key;

  return stage;
}
