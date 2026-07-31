import { isClassTemplateBoard } from "../../Utils/proposalBoard";
import { getMilestoneByActionCardType } from "../../../lib/milestones";

export const PROPOSAL_CARD_TYPE = "PROPOSAL";
export const CUSTOM_CARD_TYPE = "CUSTOM";
export const CARD_CATEGORY_PROPOSAL = "PROPOSAL";
export const CARD_CATEGORY_ACTION = "ACTION";
export const NEW_CHECKPOINT_VALUE = "NEW";
export const BLANK_TEMPLATE_VALUE = "BLANK";

export const DEFAULT_ACTION_CARD_TYPES = [
  "ACTION_SUBMIT",
  "ACTION_PEER_FEEDBACK",
  "ACTION_COLLECTING_DATA",
  "ACTION_PROJECT_REPORT",
];

export const CARD_TYPE_DEFINITIONS = [
  {
    value: PROPOSAL_CARD_TYPE,
    labelKey: "section.createCardModal.types.proposal",
    defaultLabel: "Proposal card",
    previewKey: "section.createCardModal.proposalPreview",
    previewDefault:
      "Adds a regular proposal card with content fields for students.",
  },
  {
    value: "ACTION_SUBMIT",
    labelKey: "section.createCardModal.types.actionSubmit",
    defaultLabel: "Default action: Submit for Proposal Feedback",
    isDefaultAction: true,
  },
  {
    value: "ACTION_PEER_FEEDBACK",
    labelKey: "section.createCardModal.types.actionPeerFeedback",
    defaultLabel: "Default action: Submit for Peer Feedback",
    isDefaultAction: true,
  },
  {
    value: "ACTION_COLLECTING_DATA",
    labelKey: "section.createCardModal.types.actionCollectingData",
    defaultLabel: "Default action: Start Collecting Data",
    isDefaultAction: true,
  },
  {
    value: "ACTION_PROJECT_REPORT",
    labelKey: "section.createCardModal.types.actionProjectReport",
    defaultLabel: "Default action: Submit Project Report",
    isDefaultAction: true,
  },
  {
    value: CUSTOM_CARD_TYPE,
    labelKey: "section.createCardModal.types.custom",
    defaultLabel: "Create your own review step",
  },
];

export function isDefaultActionCardType(type) {
  return DEFAULT_ACTION_CARD_TYPES.includes(type);
}

export function getExistingDefaultActionTypes(sections = []) {
  const existing = new Set();
  sections.forEach((section) => {
    (section?.cards || []).forEach((card) => {
      if (isDefaultActionCardType(card?.type)) {
        existing.add(card.type);
      }
    });
  });
  return existing;
}

export function getCreateCardTypeOptions({ t, board, sections }) {
  const existingDefaults = getExistingDefaultActionTypes(sections);
  const canCreateCustom = isClassTemplateBoard(board);

  return CARD_TYPE_DEFINITIONS
    .filter((definition) => definition.value !== CUSTOM_CARD_TYPE || canCreateCustom)
    .map((definition) => {
      const disabled =
        isDefaultActionCardType(definition.value) &&
        existingDefaults.has(definition.value);
      const baseLabel = t(
        definition.labelKey,
        {},
        { default: definition.defaultLabel }
      );
      const label = disabled
        ? t(
            "section.createCardModal.alreadyAddedLabel",
            { label: baseLabel },
            { default: "{{label}} (already added)" }
          )
        : baseLabel;
      return {
        ...definition,
        label,
        disabled,
      };
    });
}

export function getMilestoneForCardType(type, milestones = []) {
  if (!isDefaultActionCardType(type)) return null;
  return getMilestoneByActionCardType(type, milestones);
}

export function getDefaultCheckpointOptions({ t, sections }) {
  const existingDefaults = getExistingDefaultActionTypes(sections);

  return CARD_TYPE_DEFINITIONS.filter((definition) => definition.isDefaultAction).map(
    (definition) => ({
      value: definition.value,
      label: t(definition.labelKey, {}, { default: definition.defaultLabel }),
      disabled: existingDefaults.has(definition.value),
    })
  );
}

export function getDefaultFormTemplateOptions({ t }) {
  return CARD_TYPE_DEFINITIONS.filter((definition) => definition.isDefaultAction).map(
    (definition) => ({
      value: definition.value,
      label: t(definition.labelKey, {}, { default: definition.defaultLabel }),
    })
  );
}
