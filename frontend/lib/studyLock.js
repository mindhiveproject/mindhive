// A study is locked once it has been submitted through its data-collection
// milestone (and stays locked once data collection is finished): neither its
// flow (Study Builder) nor its participant page can be edited until a teacher
// reopens it. Self-managed studies (no milestone) never reach these values, so
// they are never locked. Cloning a locked study is still allowed, since it
// creates a new study.
const LOCKED_STATUSES = ["SUBMITTED", "FINISHED"];

function isStudyLocked(study, { isClone = false } = {}) {
  if (isClone) return false;
  return LOCKED_STATUSES.includes(study?.dataCollectionStatus);
}

module.exports = { isStudyLocked, LOCKED_STATUSES };
