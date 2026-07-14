import {
  GET_MILESTONES,
  RESOLVE_MILESTONES_FOR_BOARD,
} from "../components/Queries/Milestone";
import { normalizeCurriculumType } from "./curriculumTypes";
import { FEEDBACK_CENTER_TABS } from "./feedbackCenterTabs";

export { GET_MILESTONES, RESOLVE_MILESTONES_FOR_BOARD };

export function getTemplateBoardId(board) {
  if (!board) return null;
  if (board.templateForClasses?.length || board.templatesForClass?.length) {
    return board.id;
  }
  return board.clonedFrom?.id || null;
}

export function mergeMilestones(globalMs = [], templateMs = []) {
  const byKey = new Map();
  for (const m of globalMs) {
    if (m?.key) byKey.set(m.key, m);
  }
  for (const m of templateMs) {
    if (m?.key) byKey.set(m.key, m);
  }
  const merged = Array.from(byKey.values());
  const hasTemplate = templateMs.length > 0;
  if (hasTemplate) {
    merged.sort((a, b) => {
      const aTemplate = a.scope === "template";
      const bTemplate = b.scope === "template";
      if (aTemplate && bTemplate) {
        return (a.position ?? 0) - (b.position ?? 0);
      }
      if (aTemplate && !bTemplate) return -1;
      if (!aTemplate && bTemplate) return 1;
      return (a.key || "").localeCompare(b.key || "");
    });
  }
  return merged.filter((m) => m.isActive !== false);
}

export function resolveMilestonesFromQuery(data) {
  if (data?.resolveMilestonesForBoard) {
    return data.resolveMilestonesForBoard;
  }
  const all = data?.milestones || [];
  const globalMs = all.filter((m) => m.scope === "global" || !m.scope);
  return mergeMilestones(globalMs, []);
}

/**
 * Resolve the milestone for an action card.
 * Stack: (1) card.milestone FK, (2) match card.type to milestone.actionCardType.
 */
export function getMilestoneFromCard(card, milestones = []) {
  if (card?.milestone?.id) {
    return (
      milestones.find((m) => m.id === card.milestone.id) || card.milestone
    );
  }
  if (card?.type) {
    return getMilestoneByActionCardType(card.type, milestones);
  }
  return null;
}

/** @see getMilestoneFromCard */
export const resolveMilestoneFromCard = getMilestoneFromCard;

/**
 * Resolve the review form definition key for a milestone.
 * Stack: (1) milestone.formDefinition.key, (2) formDefinitionKeyPattern + curriculum.
 */
export function resolveFormKeyForMilestone(milestone, curriculumType) {
  return resolveReviewFormKey(milestone, curriculumType);
}

export function getMilestoneByActionCardType(actionCardType, milestones = []) {
  if (!actionCardType) return null;
  return (
    milestones.find((m) => m?.actionCardType === actionCardType) || null
  );
}

export function getMilestoneByKey(key, milestones = []) {
  if (!key) return null;
  // Case-insensitive on the `key` field: legacy call sites (feedbackCenterTabs
  // constants, Study.status literals, URL selectors) still use UPPERCASE
  // (SUBMITTED_AS_PROPOSAL, PEER_REVIEW, PROJECT_REPORT), but seeded and
  // template-created milestones store lowercase (`submitted_as_proposal`, etc.).
  // Normalize on both sides so lookups match either flavour without forcing a
  // migration of every Study.status / Review.stage caller. `id` stays strict.
  const needle = typeof key === "string" ? key.toLowerCase() : key;
  return (
    milestones.find(
      (m) =>
        (typeof m?.key === "string" && m.key.toLowerCase() === needle) ||
        m?.id === key
    ) || null
  );
}

export function resolveReviewFormKey(milestone, curriculumType) {
  if (milestone?.formDefinition?.key) {
    return milestone.formDefinition.key;
  }
  const normalizedType = normalizeCurriculumType(curriculumType);
  const pattern =
    milestone?.formDefinitionKeyPattern || "review_{{key}}_{{curriculumType}}";
  return pattern
    .replace(/\{\{key\}\}/g, milestone?.key || "")
    .replace(/\{\{curriculumType\}\}/g, normalizedType);
}

export function canUserReviewMilestone(
  userPermissions = [],
  milestone,
  isOpenForComments
) {
  if (!milestone || !isOpenForComments) return false;

  const allowedNames = (milestone.canReview || [])
    .map((p) => p?.name)
    .filter(Boolean);

  if (allowedNames.length === 0) return false;

  return userPermissions.some((permission) =>
    allowedNames.includes(permission)
  );
}

export function isActionCard(card) {
  if (!card) return false;
  if (card.milestone?.id) return true;
  return (
    card.type === "ACTION" ||
    (card.type && card.type.startsWith("ACTION_"))
  );
}

export function cardTypeMatchesMilestone(
  cardType,
  milestoneKey,
  milestones = []
) {
  if (!cardType || !milestoneKey) return false;

  const milestone = getMilestoneByKey(milestoneKey, milestones);
  if (milestone) {
    return (
      milestone.actionCardType === cardType ||
      milestone.key === cardType ||
      milestone.id === cardType
    );
  }

  return cardType === milestoneKey;
}

export function normalizeReviewStepKey(stepKey, milestones = []) {
  if (!stepKey) return stepKey;

  if (milestones.some((m) => m.id === stepKey)) {
    const byId = getMilestoneByKey(stepKey, milestones);
    return byId?.key ?? stepKey;
  }

  if (stepKey.startsWith("ACTION_")) {
    const milestone = getMilestoneByActionCardType(stepKey, milestones);
    return milestone?.key ?? stepKey;
  }

  return stepKey;
}

export const MILESTONE_CARD_BUILDER_META = {
  ACTION_SUBMIT: {
    key: "actionSubmit",
    icon: "/assets/icons/user.svg",
    titleKey: "board.expendedCard.proposalFeedback",
    descriptionKey: "board.expendedCard.proposalFeedbackDescription",
    descriptionFallback:
      "Card content is shown anonymously to mentors associated with class networks.",
  },
  ACTION_PEER_FEEDBACK: {
    key: "actionPeerFeedback",
    icon: "/assets/connect/group.svg",
    titleKey: "board.expendedCard.peerFeedback",
    descriptionKey: "board.expendedCard.peerFeedbackDescription",
    descriptionFallback:
      "Content and participation links shown to both mentors and students in the networks.",
  },
  ACTION_PROJECT_REPORT: {
    key: "actionProjectReport",
    icon: "/assets/icons/document.svg",
    titleKey: "board.expendedCard.projectReport",
    descriptionKey: "board.expendedCard.projectReportDescription",
    descriptionFallback:
      "A simple label to select cards that will be included in the exported PDF report.",
  },
};

export function parseCardSettings(card) {
  const settings = card?.settings;
  if (!settings) return {};
  if (typeof settings === "string") {
    try {
      return JSON.parse(settings);
    } catch {
      return {};
    }
  }
  return settings;
}

export function expandReviewStepAliases(stepKey, milestones = []) {
  const aliases = new Set();
  if (!stepKey) return aliases;

  aliases.add(stepKey);

  const normalizedKey = normalizeReviewStepKey(stepKey, milestones);
  if (normalizedKey) aliases.add(normalizedKey);

  const milestone =
    getMilestoneByKey(stepKey, milestones) ||
    getMilestoneByActionCardType(stepKey, milestones);

  if (milestone) {
    if (milestone.key) aliases.add(milestone.key);
    if (milestone.id) aliases.add(milestone.id);
    if (milestone.actionCardType) aliases.add(milestone.actionCardType);
    if (milestone.reviewStage) aliases.add(milestone.reviewStage);
  }

  const meta = MILESTONE_CARD_BUILDER_META[stepKey];
  if (meta?.key) aliases.add(meta.key);

  return aliases;
}

export function cardIncludedInReviewStep(card, actionCardOrMilestone, milestones = []) {
  const settings = parseCardSettings(card);
  const steps = settings?.includeInReviewSteps || [];
  if (!steps.length || !actionCardOrMilestone) return false;

  const targetAliases = new Set();

  const addTargetAliases = (key) => {
    expandReviewStepAliases(key, milestones).forEach((alias) =>
      targetAliases.add(alias)
    );
  };

  if (
    typeof actionCardOrMilestone === "object" &&
    actionCardOrMilestone !== null
  ) {
    const actionCard = actionCardOrMilestone;
    if (actionCard.type) addTargetAliases(actionCard.type);
    const resolvedMilestone = getMilestoneFromCard(actionCard, milestones);
    if (resolvedMilestone?.key) addTargetAliases(resolvedMilestone.key);
    if (resolvedMilestone?.id) addTargetAliases(resolvedMilestone.id);
    if (resolvedMilestone?.actionCardType) {
      addTargetAliases(resolvedMilestone.actionCardType);
    }
    if (resolvedMilestone?.reviewStage) {
      addTargetAliases(resolvedMilestone.reviewStage);
    }
  } else {
    addTargetAliases(actionCardOrMilestone);
  }

  return steps.some((step) => {
    const stepAliases = expandReviewStepAliases(step, milestones);
    return [...stepAliases].some((alias) => targetAliases.has(alias));
  });
}

export function getReviewStepOptions(milestones = [], t) {
  const boardMilestones = milestones.filter(
    (m) =>
      m?.statusTarget === "board" &&
      m?.actionCardType !== "ACTION_COLLECTING_DATA" &&
      (MILESTONE_CARD_BUILDER_META[m.actionCardType] || m.scope === "template")
  );

  if (!boardMilestones.length) {
    return Object.entries(MILESTONE_CARD_BUILDER_META)
      .filter(([type]) => type !== "ACTION")
      .map(([actionCardType, meta]) => ({
        key: meta.key,
        text: t(meta.titleKey, {}, { default: actionCardType }),
        value: actionCardType,
        icon: meta.icon,
        titleKey: meta.titleKey,
        descriptionKey: meta.descriptionKey,
        descriptionFallback: meta.descriptionFallback,
        actionCardType,
      }));
  }

  return boardMilestones.map((milestone) => {
    const meta = MILESTONE_CARD_BUILDER_META[milestone.actionCardType];
    if (!meta && milestone.scope === "template") {
      return {
        key: milestone.key,
        text: milestone.title || milestone.key,
        value: milestone.key,
        icon: "/assets/icons/document.svg",
        descriptionFallback: milestone.description || "",
        actionCardType: milestone.actionCardType || "ACTION",
        milestoneId: milestone.id,
      };
    }

    return {
      key: meta.key || milestone.key,
      text: t(
        meta.titleKey,
        {},
        { default: milestone.title || milestone.key }
      ),
      value: milestone.key,
      icon: meta.icon,
      titleKey: meta.titleKey,
      descriptionKey: meta.descriptionKey,
      descriptionFallback: meta.descriptionFallback,
      actionCardType: milestone.actionCardType || "ACTION",
      milestoneId: milestone.id,
    };
  });
}

export function getFeedbackCenterMilestones(milestones = []) {
  const templateBoardMs = milestones.filter(
    (m) =>
      m.scope === "template" &&
      m.statusTarget === "board" &&
      m.showInFeedbackCenter !== false
  );
  if (templateBoardMs.length > 0) {
    return [...templateBoardMs].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
  }

  return FEEDBACK_CENTER_TABS.map((tab) =>
    getMilestoneByKey(tab.milestoneKey, milestones)
  ).filter(
    (m) => m && m.statusTarget === "board" && m.showInFeedbackCenter !== false
  );
}
