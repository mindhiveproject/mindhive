// Whoever works on the study through its project board — the board's author
// or any collaborator on it. Students run a study this way (the study itself
// belongs to their teacher), so they are researchers of it even though they
// are neither Study.author nor in Study.collaborators.
function boardMemberClause(id) {
  return {
    study: {
      proposal: {
        some: {
          OR: [
            { author: { id: { equals: id } } },
            { collaborators: { some: { id: { equals: id } } } },
          ],
        },
      },
    },
  };
}

function buildResultAccessFilter(session, isAdmin) {
  if (!session?.itemId) return false;
  if (isAdmin) return true;
  const id = session.itemId;
  return {
    OR: [
      { profile: { id: { equals: id } } },
      { taskAuthor: { id: { equals: id } } },
      { assetAuthor: { id: { equals: id } } },
      { study: { author: { id: { equals: id } } } },
      { study: { collaborators: { some: { id: { equals: id } } } } },
      boardMemberClause(id),
    ],
  };
}

function buildSummaryAccessFilter(session, isAdmin) {
  const filter = buildResultAccessFilter(session, isAdmin);
  if (!filter || filter === true) return filter;
  return {
    OR: filter.OR.map((clause) =>
      clause.profile
        ? { user: clause.profile }
        : clause
    ),
  };
}

function buildResultManageFilter(session, isAdmin) {
  if (!session?.itemId) return false;
  if (isAdmin) return true;
  const id = session.itemId;
  return {
    OR: [
      { taskAuthor: { id: { equals: id } } },
      { assetAuthor: { id: { equals: id } } },
      { study: { author: { id: { equals: id } } } },
      { study: { collaborators: { some: { id: { equals: id } } } } },
      boardMemberClause(id),
    ],
  };
}

module.exports = {
  boardMemberClause,
  buildResultAccessFilter,
  buildResultManageFilter,
  buildSummaryAccessFilter,
};
