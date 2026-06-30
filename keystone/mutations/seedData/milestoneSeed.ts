// Canonical milestone inventory for Phase 1. Consumed by seedMilestones.ts
// and backfillMilestoneStatus.ts.

export type MilestoneSeed = {
  key: string;
  title: string;
  description?: string;
  actionCardType: string;
  reviewStage: string;
  statusTarget: "board" | "study";
  legacyBoardStatusField?: string;
  legacyOpenForCommentsField?: string;
  logEventName: string;
  canReviewPermissionNames: string[];
  formDefinitionKeyPattern?: string;
  isActive?: boolean;
};

export const MILESTONE_SEEDS: MilestoneSeed[] = [
  {
    key: "SUBMITTED_AS_PROPOSAL",
    title: "Proposal Feedback",
    description: "Submit the project proposal for expert mentor review.",
    actionCardType: "ACTION_SUBMIT",
    reviewStage: "SUBMITTED_AS_PROPOSAL",
    statusTarget: "board",
    legacyBoardStatusField: "submitProposalStatus",
    legacyOpenForCommentsField: "submitProposalOpenForComments",
    logEventName: "PROPOSAL_SUBMITTED_FOR_REVIEW",
    canReviewPermissionNames: ["MENTOR", "TEACHER", "SCIENTIST"],
  },
  {
    key: "PEER_REVIEW",
    title: "Peer Feedback",
    description: "Submit for peer review from classmates.",
    actionCardType: "ACTION_PEER_FEEDBACK",
    reviewStage: "PEER_REVIEW",
    statusTarget: "board",
    legacyBoardStatusField: "peerFeedbackStatus",
    legacyOpenForCommentsField: "peerFeedbackOpenForComments",
    logEventName: "PROPOSAL_SUBMITTED_FOR_PEER_REVIEW",
    canReviewPermissionNames: ["MENTOR", "TEACHER", "SCIENTIST", "STUDENT"],
  },
  {
    key: "DATA_COLLECTION",
    title: "Data Collection",
    description: "Launch data collection on the linked study.",
    actionCardType: "ACTION_COLLECTING_DATA",
    reviewStage: "DATA_COLLECTION",
    statusTarget: "study",
    logEventName: "STUDY_SUBMITTED_FOR_DATA_COLLECTION",
    canReviewPermissionNames: [],
  },
  {
    key: "PROJECT_REPORT",
    title: "Project Report",
    description: "Submit the final project report for review.",
    actionCardType: "ACTION_PROJECT_REPORT",
    reviewStage: "PROJECT_REPORT",
    statusTarget: "board",
    legacyBoardStatusField: "projectReportStatus",
    legacyOpenForCommentsField: "projectReportOpenForComments",
    logEventName: "PROJECT_SUBMITTED_FOR_REPORT",
    canReviewPermissionNames: ["MENTOR", "TEACHER", "SCIENTIST"],
  },
];

// Study-scoped legacy columns used when statusTarget is "study".
export const STUDY_LEGACY_STATUS_FIELD = "dataCollectionStatus";
export const STUDY_LEGACY_OPEN_FIELD = "dataCollectionOpenForParticipation";
