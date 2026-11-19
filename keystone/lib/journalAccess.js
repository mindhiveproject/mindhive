// Who may read and change Data Journals: VizJournal (journal collection),
// VizPart (journal), VizChapter (workspace) and VizSection (component).
//
// A journal collection belongs to a study and/or a project board. Its team may
// read and change it, and everything inside it:
//   - the study's researchers (studyUpdateWhere in access.ts: study author and
//     collaborators, the author and collaborators of every board linked to the
//     study, staff of the study's classes);
//   - the board's author and collaborators, and staff of the board's class or
//     of the classes it is a template for.
// On top of that, journals an admin marked as templates (VizPart.isTemplate)
// can be read by every signed-in user, so they can be copied, along with their
// workspaces and components. Only admins may set the template flags.
//
// Datasets inside a journal keep their own rule (lib/datasourceAccess.js).

/**
 * Journal collections whose team `me` is on, from ids looked up once per
 * request: the studies `me` researches and the classes `me` staffs.
 */
function journalTeamWhere({ me, studyIds = [], staffClassIds = [] }) {
  return {
    OR: [
      { study: { id: { in: studyIds } } },
      {
        project: {
          OR: [
            { author: { id: { equals: me } } },
            { collaborators: { some: { id: { equals: me } } } },
            { usedInClass: { id: { in: staffClassIds } } },
            { templateForClasses: { some: { id: { in: staffClassIds } } } },
          ],
        },
      },
    ],
  };
}

const TEMPLATE_PART = { isTemplate: { equals: true } };

/**
 * Filters for each journal list, given the ids of the journal collections the
 * user's team owns. `read` adds the admin-marked templates; `write` does not.
 */
function journalListFilters(journalIds = []) {
  const inTeamJournal = { vizJournal: { id: { in: journalIds } } };
  const partRead = { OR: [inTeamJournal, TEMPLATE_PART] };
  return {
    VizJournal: {
      read: { id: { in: journalIds } },
      write: { id: { in: journalIds } },
    },
    VizPart: { read: partRead, write: inTeamJournal },
    VizChapter: {
      read: { vizPart: partRead },
      write: { vizPart: inTeamJournal },
    },
    VizSection: {
      read: { vizChapter: { vizPart: partRead } },
      write: { vizChapter: { vizPart: inTeamJournal } },
    },
  };
}

// Each list's parent relation, which a new item must connect to something the
// caller may change.
const JOURNAL_PARENT = {
  VizPart: { field: "vizJournal", list: "VizJournal" },
  VizChapter: { field: "vizPart", list: "VizPart" },
  VizSection: { field: "vizChapter", list: "VizChapter" },
};

// Fields only admins may set: they publish a journal to everyone.
const ADMIN_ONLY_JOURNAL_FIELDS = ["isTemplate", "isPublic", "isFeatured"];

module.exports = {
  journalTeamWhere,
  journalListFilters,
  JOURNAL_PARENT,
  ADMIN_ONLY_JOURNAL_FIELDS,
};
