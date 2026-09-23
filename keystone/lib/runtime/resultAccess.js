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
    ],
  };
}

module.exports = {
  buildResultAccessFilter,
  buildResultManageFilter,
  buildSummaryAccessFilter,
};
