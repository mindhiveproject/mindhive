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
