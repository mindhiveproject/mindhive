// A study is locked once it has been submitted: neither its flow (Study
// Builder) nor its participant page can be edited until a teacher un-submits it.
// Cloning a submitted study is still allowed, since it creates a new study.
function isStudyLocked(study, { isClone = false } = {}) {
  if (isClone) return false;
  return study?.dataCollectionStatus === "SUBMITTED";
}

module.exports = { isStudyLocked };
