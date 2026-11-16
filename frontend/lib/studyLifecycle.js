// Where a study is in its life, as students and teachers see it: designing,
// collecting data, or finished, plus whether participation is open.
//
// Two stored fields feed it, each with one job:
// - Supervised studies (a class milestone supervises them through a linked
//   board) read `dataCollectionStatus`, which only the setStudyDataCollection
//   mutation writes and which locks the study once submitted.
// - Self-managed studies read `status`, a label the student sets freely; it
//   never locks the study.
// `status` is also stamped on every dataset (real vs test participants), so
// the mutation keeps it in step for supervised studies too.
//
// Older studies may hold review labels in `status` ("In review", ...): they are
// read as Designing and nothing is rewritten. `legacyStatus` keeps the stored
// value so the UI can mention it.

const STAGES = {
  DESIGNING: "DESIGNING",
  COLLECTING: "COLLECTING",
  FINISHED: "FINISHED",
};

// The `status` value written for each stage (self-managed label, and the
// dataset stamp of supervised studies).
const STATUS_FOR_STAGE = {
  DESIGNING: "WORKING",
  COLLECTING: "COLLECTING_DATA",
  FINISHED: "DATA_COLLECTION_IS_COMPLETED",
};

const LEGACY_REVIEW_STATUSES = [
  "SUBMITTED_AS_PROPOSAL",
  "READY_FOR_REVIEW",
  "IN_REVIEW",
  "REVIEWED",
];

function stageFromDataCollectionStatus(value) {
  if (value === "SUBMITTED") return STAGES.COLLECTING;
  if (value === "FINISHED") return STAGES.FINISHED;
  return STAGES.DESIGNING;
}

function stageFromStatus(value) {
  if (value === "COLLECTING_DATA") return STAGES.COLLECTING;
  if (value === "DATA_COLLECTION_IS_COMPLETED") return STAGES.FINISHED;
  return STAGES.DESIGNING;
}

/**
 * @param study `{ status, dataCollectionStatus, dataCollectionOpenForParticipation }`
 * @param supervised whether a class milestone supervises the study
 * @returns `{ stage, open, supervised, locked, legacyStatus }`
 */
function studyLifecycle(study, { supervised = false } = {}) {
  const dataCollectionStatus = study?.dataCollectionStatus;
  // A study submitted before its board was unlinked stays locked: read it
  // from the milestone fields so a teacher can still see and reopen it.
  const locked =
    dataCollectionStatus === "SUBMITTED" || dataCollectionStatus === "FINISHED";
  const readsMilestone = supervised || locked;
  const stage = readsMilestone
    ? stageFromDataCollectionStatus(dataCollectionStatus)
    : stageFromStatus(study?.status);
  const legacyStatus =
    stage === STAGES.DESIGNING && LEGACY_REVIEW_STATUSES.includes(study?.status)
      ? study.status
      : null;
  return {
    stage,
    open: !!study?.dataCollectionOpenForParticipation,
    supervised: !!supervised,
    locked,
    legacyStatus,
  };
}

module.exports = {
  STAGES,
  STATUS_FOR_STAGE,
  LEGACY_REVIEW_STATUSES,
  studyLifecycle,
};
