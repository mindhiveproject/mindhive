// Studies whose results `id` may see as a researcher: the same people who may
// edit the study (studyUpdateWhere in access.ts). That is the study's author or
// a collaborator on it; whoever works on it through its project board — the
// board's author or any collaborator on it (students run a study this way: the
// study itself belongs to their teacher, so they are researchers of it even
// though they are neither Study.author nor in Study.collaborators); and the
// staff (creator, teaching team, mentors) of a class the study is linked to or
// that its author or a collaborator studies in. Keep the two rules in step:
// someone who can open a study's Collect page should see its results.
function researcherStudyWhere(id) {
  const staffClass = {
    some: {
      OR: [
        { creator: { id } },
        { teachingTeam: { some: { id } } },
        { mentors: { some: { id } } },
      ],
    },
  };
  return {
    OR: [
      { author: { id } },
      { collaborators: { some: { id } } },
      {
        proposal: {
          some: {
            OR: [{ author: { id } }, { collaborators: { some: { id } } }],
          },
        },
      },
      { classes: staffClass },
      { author: { studentIn: staffClass } },
      { collaborators: { some: { studentIn: staffClass } } },
    ],
  };
}

// Resolved once per request and reused. Inlined into the result filters, the
// clauses above made Postgres re-walk the study/board join tables on every
// Dataset query, and Keystone applies a list's filter again for each nested
// relationship it resolves (e.g. once per participant in
// `participants { datasets }`). A plain `study.id in [...]` is cheap.
const studyIdsByRequest = new WeakMap();

function researcherStudyIds(context, id) {
  const key = context.req || context;
  let ids = studyIdsByRequest.get(key);
  if (!ids) {
    ids = context.prisma.study
      .findMany({ where: researcherStudyWhere(id), select: { id: true } })
      .then((studies) => studies.map((study) => study.id));
    studyIdsByRequest.set(key, ids);
  }
  return ids;
}

async function researcherStudyClause(context, id) {
  return { study: { id: { in: await researcherStudyIds(context, id) } } };
}

async function buildResultAccessFilter(session, isAdmin, context) {
  if (!session?.itemId) return false;
  if (isAdmin) return true;
  const id = session.itemId;
  return {
    OR: [
      { profile: { id: { equals: id } } },
      { taskAuthor: { id: { equals: id } } },
      { assetAuthor: { id: { equals: id } } },
      await researcherStudyClause(context, id),
    ],
  };
}

async function buildSummaryAccessFilter(session, isAdmin, context) {
  const filter = await buildResultAccessFilter(session, isAdmin, context);
  if (!filter || filter === true) return filter;
  return {
    OR: filter.OR.map((clause) =>
      clause.profile
        ? { user: clause.profile }
        : clause
    ),
  };
}

async function buildResultManageFilter(session, isAdmin, context) {
  if (!session?.itemId) return false;
  if (isAdmin) return true;
  const id = session.itemId;
  return {
    OR: [
      { taskAuthor: { id: { equals: id } } },
      { assetAuthor: { id: { equals: id } } },
      await researcherStudyClause(context, id),
    ],
  };
}

module.exports = {
  researcherStudyClause,
  buildResultAccessFilter,
  buildResultManageFilter,
  buildSummaryAccessFilter,
};
