// Who may read a Data Journal dataset (the Datasource list). One rule, applied
// on the server; the dataset library's tabs only group what it lets through.
//
// A signed-in user sees a dataset when it is:
//   - public: `isPublic`, which only admins may set, or attached to a journal
//     an admin marked as a template (VizPart.isTemplate, also admin-only), so
//     copying a template journal copies its datasets;
//   - shared with a class they belong to: `sharedWithClasses`, which only that
//     class's staff may set (mutations/datasourceClassSharing.ts). Classmates
//     never see each other's datasets through class links alone;
//   - theirs: they authored it (uploaded, created, simulated), they are on its
//     collaborator list (people the author picked from its study/board team,
//     lib/datasourceTeam.ts), or — while `sharedWithTeam` is on — they work on
//     its study (the study's researchers — studyUpdateWhere in access.ts: the
//     study author and collaborators, the author and collaborators of every
//     project board linked to the study, and staff of the study's classes), or
//     they work on its project board (author, collaborators, staff of the
//     board's class).
// Simulated datasets stay hidden from everyone but testers and admins.
//
// Edit rights are separate (Datasource item access): the author, and
// collaborators while collaboratorsCanEdit is on.

const SIMULATED_DATASET_ROLES = ["TESTER", "ADMIN"];

function canSeeSimulatedDatasets(session) {
  return !!session?.data?.permissions?.some((role) =>
    SIMULATED_DATASET_ROLES.includes(role?.name ?? "")
  );
}

/**
 * The where-clause for the datasets `me` may read, from ids looked up once per
 * request: the studies `me` researches, the classes `me` staffs and the
 * classes `me` belongs to (staff or student).
 */
function datasourceReadWhere({
  me,
  studyIds = [],
  staffClassIds = [],
  memberClassIds = [],
  canSeeSimulated = false,
}) {
  const visible = {
    OR: [
      { isPublic: { equals: true } },
      { journal: { some: { isTemplate: { equals: true } } } },
      { author: { id: { equals: me } } },
      // named collaborators, picked by the author from the study/board team
      { collaborators: { some: { id: { equals: me } } } },
      // the study and board team reach a dataset only while its author keeps
      // it shared with them (`sharedWithTeam`, off on fresh copies)
      {
        AND: [
          { sharedWithTeam: { equals: true } },
          {
            OR: [
              { study: { id: { in: studyIds } } },
              {
                project: {
                  OR: [
                    { author: { id: { equals: me } } },
                    { collaborators: { some: { id: { equals: me } } } },
                    { usedInClass: { id: { in: staffClassIds } } },
                  ],
                },
              },
            ],
          },
        ],
      },
      { sharedWithClasses: { some: { id: { in: memberClassIds } } } },
    ],
  };
  if (canSeeSimulated) return visible;
  return {
    AND: [
      visible,
      {
        OR: [
          { dataOrigin: { equals: null } },
          { dataOrigin: { not: { equals: "SIMULATED" } } },
        ],
      },
    ],
  };
}

module.exports = {
  SIMULATED_DATASET_ROLES,
  canSeeSimulatedDatasets,
  datasourceReadWhere,
};
