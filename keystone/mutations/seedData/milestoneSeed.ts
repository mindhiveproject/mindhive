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
    key: "submitted_as_proposal",
    title: "Proposal Feedback",
    description: "Submit the project proposal for expert mentor review.",
    actionCardType: "ACTION_SUBMIT",
    reviewStage: "submitted_as_proposal",
    statusTarget: "board",
    legacyBoardStatusField: "submitProposalStatus",
    legacyOpenForCommentsField: "submitProposalOpenForComments",
    logEventName: "PROPOSAL_SUBMITTED_FOR_REVIEW",
    canReviewPermissionNames: ["MENTOR", "TEACHER", "SCIENTIST"],
  },
  {
    key: "peer_review",
    title: "Peer Feedback",
    description: "Submit for peer review from classmates.",
    actionCardType: "ACTION_PEER_FEEDBACK",
    reviewStage: "peer_review",
    statusTarget: "board",
    legacyBoardStatusField: "peerFeedbackStatus",
    legacyOpenForCommentsField: "peerFeedbackOpenForComments",
    logEventName: "PROPOSAL_SUBMITTED_FOR_PEER_REVIEW",
    canReviewPermissionNames: ["MENTOR", "TEACHER", "SCIENTIST", "STUDENT"],
  },
  {
    key: "data_collection",
    title: "Data Collection",
    description: "Launch data collection on the linked study.",
    actionCardType: "ACTION_COLLECTING_DATA",
    reviewStage: "data_collection",
    statusTarget: "study",
    logEventName: "STUDY_SUBMITTED_FOR_DATA_COLLECTION",
    canReviewPermissionNames: [],
  },
  {
    key: "project_report",
    title: "Project Report",
    description: "Submit the final project report for review.",
    actionCardType: "ACTION_PROJECT_REPORT",
    reviewStage: "project_report",
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
