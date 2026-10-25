// How the signed-in user relates to a block, for the tags on block cards:
// "author" when they created it, "collaborator" when they were invited on
// it, null otherwise. Authorship wins when both are true.

function blockRelation(task, userId) {
  if (!userId || !task) return null;
  if (String(task.author?.id) === String(userId)) return 'author';
  if (
    (task.collaborators || []).some((c) => String(c?.id) === String(userId))
  ) {
    return 'collaborator';
  }
  return null;
}

module.exports = { blockRelation };
