import { isDefaultActionCardType } from "../components/Proposal/Builder/cardTypeOptions";
import {
  getMilestoneFromCard,
  getMilestoneByActionCardType,
  isActionCard,
} from "./milestones";

const DEFAULT_ACTION_LABEL_KEYS = {
  ACTION_SUBMIT: "actionCard.proposalFeedback",
  ACTION_PEER_FEEDBACK: "actionCard.peerFeedback",
  ACTION_COLLECTING_DATA: "actionCard.dataCollection",
  ACTION_PROJECT_REPORT: "actionCard.projectReport",
};

const DEFAULT_ACTION_LABEL_DEFAULTS = {
  ACTION_SUBMIT: "Proposal Feedback",
  ACTION_PEER_FEEDBACK: "Peer Feedback",
  ACTION_COLLECTING_DATA: "Data Collection",
  ACTION_PROJECT_REPORT: "Project Report",
};

export function getActionCardsFromBoard(board) {
  const sections = [...(board?.sections || [])].sort(
    (a, b) => (a?.position ?? 0) - (b?.position ?? 0)
  );

  return sections.flatMap((section) =>
    [...(section?.cards || [])]
      .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0))
      .filter(isActionCard)
      .map((card) => ({ card, section }))
  );
}

export function resolveActionCardMilestone(card, milestones = []) {
  const fromCard = getMilestoneFromCard(card, milestones);
  if (fromCard) return fromCard;
  if (card?.type) {
    return getMilestoneByActionCardType(card.type, milestones);
  }
  return null;
}

function milestoneDedupeKey(milestone) {
  if (milestone?.id) return `id:${milestone.id}`;
  if (milestone?.key) return `key:${String(milestone.key).toLowerCase()}`;
  return null;
}

/**
 * Teacher-facing steps defined for a class template board: action cards on
 * that board, resolved to Milestone (global FK or template-owned row).
 * `scope` is ownership, not visibility — inherited platform defaults and
 * teacher-authored customs both appear, in section/card position order.
 */
export function getMilestonesForTemplateBoard(board, resolvedMilestones = []) {
  const seen = new Set();
  const result = [];

  for (const { card } of getActionCardsFromBoard(board)) {
    const resolved = resolveActionCardMilestone(card, resolvedMilestones);
    if (!resolved) continue;

    const merged = {
      ...(card?.milestone && typeof card.milestone === "object"
        ? card.milestone
        : {}),
      ...resolved,
    };

    if (merged.isActive === false) continue;

    const dedupeKey = milestoneDedupeKey(merged);
    if (dedupeKey && seen.has(dedupeKey)) continue;
    if (merged.id && merged.key) {
      const keyAlias = `key:${String(merged.key).toLowerCase()}`;
      if (seen.has(keyAlias)) continue;
      seen.add(`id:${merged.id}`);
      seen.add(keyAlias);
    } else if (dedupeKey) {
      seen.add(dedupeKey);
    }

    result.push(merged);
  }

  return result;
}

export function unionMilestonesFromTemplateBoards(
  boards = [],
  resolvedMilestones = []
) {
  const seen = new Set();
  const result = [];

  for (const board of boards) {
    for (const milestone of getMilestonesForTemplateBoard(
      board,
      resolvedMilestones
    )) {
      const dedupeKey = milestoneDedupeKey(milestone);
      if (!dedupeKey || seen.has(dedupeKey)) continue;
      if (milestone.id && milestone.key) {
        const keyAlias = `key:${String(milestone.key).toLowerCase()}`;
        if (seen.has(keyAlias)) continue;
        seen.add(`id:${milestone.id}`);
        seen.add(keyAlias);
      } else {
        seen.add(dedupeKey);
      }
      result.push(milestone);
    }
  }

  return result;
}

export function isDefaultActionCard(card) {
  return isDefaultActionCardType(card?.type);
}

export function getActionCardLabel(card, tBuilder) {
  if (isDefaultActionCard(card)) {
    const key = DEFAULT_ACTION_LABEL_KEYS[card.type];
    const fallback = DEFAULT_ACTION_LABEL_DEFAULTS[card.type];
    return tBuilder(key, {}, { default: fallback });
  }

  return (
    card?.milestone?.title ||
    card?.title ||
    tBuilder("actionCard.customStep", {}, { default: "Review step" })
  );
}

export function getActionCardTypeLabel(card, tClasses) {
  return isDefaultActionCard(card)
    ? tClasses("projects.milestonesMenu.defaultAction", {}, {
        default: "MindHive default",
      })
    : tClasses("projects.milestonesMenu.customAction", {}, {
        default: "Custom review step",
      });
}

export function getActionCardTypeBadgeStyle(card) {
  return isDefaultActionCard(card)
    ? { background: "#DEF8FB", color: "#336F8A" }
    : { background: "#E4DFF6", color: "#625B71" };
}

export function getActionCardStatusLine(card, tBuilder, tClasses) {
  const actionLabel = getActionCardLabel(card, tBuilder);
  const typeLabel = getActionCardTypeLabel(card, tClasses);
  return `${actionLabel} · ${typeLabel}`;
}
