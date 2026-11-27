import { getTabBySelector } from "./feedbackCenterTabs";
import { getMilestoneByKey } from "./milestones";

export const LEGACY_STATUS_FIELDS = {
  SUBMITTED_AS_PROPOSAL: {
    statusField: "submitProposalStatus",
    openField: "submitProposalOpenForComments",
    statusTarget: "board",
  },
  PEER_REVIEW: {
    statusField: "peerFeedbackStatus",
    openField: "peerFeedbackOpenForComments",
    statusTarget: "board",
  },
  PROJECT_REPORT: {
    statusField: "projectReportStatus",
    openField: "projectReportOpenForComments",
    statusTarget: "board",
  },
  DATA_COLLECTION: {
    statusField: "dataCollectionStatus",
    openField: "dataCollectionOpenForParticipation",
    statusTarget: "study",
  },
};

const DEFAULT_STATUS = "NOT_STARTED";

// Submitted and finished both keep a milestone's cards locked (a finished
// study stays locked until a teacher reopens it).
const LOCKED_STATUSES = ["SUBMITTED", "FINISHED"];

export function isLockedMilestoneStatus(status) {
  return LOCKED_STATUSES.includes(status);
}

function isStudyTargetMilestone(milestoneKey, milestone) {
  return (
    String(milestoneKey || "").toUpperCase() === "DATA_COLLECTION" ||
    milestone?.statusTarget === "study" ||
    milestone?.actionCardType === "ACTION_COLLECTING_DATA"
  );
}

// A study milestone's status lives on the study (the class Dashboard reads it
// the same way): the board's own copy goes stale when the board is linked to
// another study, or unlinked, after a submission. Null when the board was
// loaded without its study's status, so the board's copy is used instead.
function statusFromLinkedStudy(board) {
  if (!board || !("study" in board)) return null;
  const study = board.study;
  if (!study) return { status: DEFAULT_STATUS, openForParticipation: false };
  if (!("dataCollectionStatus" in study)) return null;
  return {
    status: study.dataCollectionStatus || DEFAULT_STATUS,
    openForParticipation: !!study.dataCollectionOpenForParticipation,
  };
}

/**
 * Read board status for a milestone key.
 * Study milestones: the linked study's status when the board was loaded with
 * it. Otherwise: (1) board.milestoneStatus JSON, (2) legacy board/study
 * columns.
 */
export function readMilestoneStatus(board, milestoneKey, milestones = []) {
  const fromJson = board?.milestoneStatus?.[milestoneKey];
  const milestone = getMilestoneByKey(milestoneKey, milestones);

  if (isStudyTargetMilestone(milestoneKey, milestone)) {
    const fromStudy = statusFromLinkedStudy(board);
    if (fromStudy) {
      // Keep who submitted or finished only while the board's copy agrees
      // with the study (it came from this study's decision).
      return fromJson?.status === fromStudy.status
        ? { ...fromJson, ...fromStudy }
        : fromStudy;
    }
  }

  if (fromJson && typeof fromJson.status === "string") {
    return fromJson;
  }

  const legacy =
    LEGACY_STATUS_FIELDS[milestoneKey] ||
    (milestone
      ? {
          statusField: milestone.legacyBoardStatusField,
          openField: milestone.legacyOpenForCommentsField,
          statusTarget: milestone.statusTarget,
        }
      : null);

  if (!legacy?.statusField) {
    return { status: DEFAULT_STATUS };
  }

  if (legacy.statusTarget === "study") {
    const study = board?.study;
    return {
      status: study?.[legacy.statusField] || DEFAULT_STATUS,
      openForParticipation: !!study?.[legacy.openField],
    };
  }

  return {
    status: board?.[legacy.statusField] || DEFAULT_STATUS,
    openForComments: !!board?.[legacy.openField],
  };
}

export function isMilestoneSubmitted(board, milestone, milestones = []) {
  const key = typeof milestone === "string" ? milestone : milestone?.key;
  const entry = readMilestoneStatus(board, key, milestones);
  return isLockedMilestoneStatus(entry?.status);
}

export function isOpenForComments(board, milestone, milestones = []) {
  const key = typeof milestone === "string" ? milestone : milestone?.key;
  const entry = readMilestoneStatus(board, key, milestones);

  if (entry?.openForComments != null) {
    return !!entry.openForComments;
  }
  if (entry?.openForParticipation != null) {
    return !!entry.openForParticipation;
  }

  return false;
}

export function buildMilestoneStatusFromLegacyBoard(board, milestones = []) {
  const result = {};
  const keys = milestones.length
    ? milestones.map((m) => m.key)
    : Object.keys(LEGACY_STATUS_FIELDS);

  for (const milestoneKey of keys) {
    result[milestoneKey] = readMilestoneStatus(board, milestoneKey, milestones);
  }

  return result;
}

export function buildDualWriteUpdate(
  milestone,
  { status, openForComments, openForParticipation },
  existingMilestoneStatus = {}
) {
  if (!milestone?.key) {
    return {};
  }

  const entry = { status: status || DEFAULT_STATUS };

  if (milestone.statusTarget === "study") {
    entry.openForParticipation = !!openForParticipation;
  } else {
    entry.openForComments = !!openForComments;
  }

  const milestoneStatus = {
    ...(existingMilestoneStatus || {}),
    [milestone.key]: entry,
  };

  const patch = { milestoneStatus };

  if (milestone.legacyBoardStatusField) {
    patch[milestone.legacyBoardStatusField] = entry.status;
  }
  if (milestone.legacyOpenForCommentsField) {
    patch[milestone.legacyOpenForCommentsField] = !!openForComments;
  }

  if (milestone.statusTarget === "study") {
    // `study` is a relationship on ProposalBoard, so Keystone types the input
    // as StudyRelateToOneForUpdateInput — raw scalar fields are rejected. Wrap
    // the write in `{ update: {...} }` so Keystone runs a nested update on the
    // linked Study row.
    const studyUpdate = {
      dataCollectionStatus: entry.status,
      dataCollectionOpenForParticipation: !!openForParticipation,
    };
    // Restore the pre-milestone-refactor behavior: when a student submits the
    // data-collection action for the first time, stamp Study.dataCollectionData
    // to REAL_DATA. Research exports key on this field; leaving it at the
    // default NOT_DEFINED silently undercounts real-data submissions.
    if (entry.status === "SUBMITTED") {
      studyUpdate.dataCollectionData = "REAL_DATA";
    }
    patch.study = { update: studyUpdate };
  }

  return patch;
}

export function buildSubmitStatuses(board, milestones = []) {
  const result = {};

  if (milestones.length) {
    for (const milestone of milestones) {
      const status = readMilestoneStatus(board, milestone.key, milestones).status;
      result[milestone.key] = status;
      if (milestone.actionCardType) {
        result[milestone.actionCardType] = status;
      }
    }
    return result;
  }

  const legacyActionMap = {
    SUBMITTED_AS_PROPOSAL: "ACTION_SUBMIT",
    PEER_REVIEW: "ACTION_PEER_FEEDBACK",
    DATA_COLLECTION: "ACTION_COLLECTING_DATA",
    PROJECT_REPORT: "ACTION_PROJECT_REPORT",
  };

  for (const [milestoneKey, legacy] of Object.entries(LEGACY_STATUS_FIELDS)) {
    const entry = readMilestoneStatus(board, milestoneKey, milestones);
    result[milestoneKey] = entry.status;
    const actionType = legacyActionMap[milestoneKey];
    if (actionType) {
      result[actionType] = entry.status;
    }
  }

  return result;
}

/**
 * Feedback Center tab filter config. Status matching uses readMilestoneStatus
 * client-side (milestoneStatus JSON first, legacy columns as fallback).
 */
export function getProjectsQueryFilterForTab(selector) {
  const tab = getTabBySelector(selector);
  const milestoneKey = tab?.milestoneKey || selector || "SUBMITTED_AS_PROPOSAL";
  const legacy = LEGACY_STATUS_FIELDS[milestoneKey];

  return {
    whereStatus: {},
    status: milestoneKey,
    milestoneKey,
    isOpenForCommentsQuery: legacy?.openField || null,
  };
}

/** @see readMilestoneStatus */
export function resolveBoardStatusForMilestone(board, milestoneKey, milestones = []) {
  return readMilestoneStatus(board, milestoneKey, milestones);
}
