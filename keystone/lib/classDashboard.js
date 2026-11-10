// Project boards for a teacher's class dashboard, with the sections, cards,
// collaborators, study and reviews the dashboard reads.
//
// Through the regular API, Keystone resolved every relationship of every board
// on its own: each board's sections, each section's cards, the collaborators,
// the study and its collaborators, the reviews and each review's milestone.
// That was about 1,400 database queries per view for a class with many boards,
// and in Nov 2026 repeated views held the connection pool long enough for
// other users' requests to time out. Here the viewer passes one check (they
// may read the class) and Prisma loads the boards with one query per
// relation, however many boards the class has.
//
// Everything returned is readable through the regular API by any signed-in
// user: boards, sections, cards, studies, milestones and usernames are open,
// and reviews need a session. The check only narrows who may ask.

const PROFILE_SELECT = { select: { id: true, username: true } };

const BOARD_SELECT = {
  id: true,
  title: true,
  isMain: true,
  sections: {
    select: {
      id: true,
      cards: { select: { id: true, type: true, settings: true } },
    },
  },
  milestoneStatus: true,
  submitProposalStatus: true,
  submitProposalOpenForComments: true,
  peerFeedbackStatus: true,
  peerFeedbackOpenForComments: true,
  projectReportStatus: true,
  projectReportOpenForComments: true,
  usedInClassId: true,
  clonedFromId: true,
  author: PROFILE_SELECT,
  collaborators: PROFILE_SELECT,
  study: {
    select: {
      id: true,
      title: true,
      status: true,
      collaborators: PROFILE_SELECT,
      dataCollectionStatus: true,
      dataCollectionOpenForParticipation: true,
    },
  },
  reviews: { select: { stage: true, milestone: { select: { key: true } } } },
};

const DENIED = "You do not have access to this class.";

// JSON fields as Keystone returns them: SQLite stores them as text, which
// Keystone parses (null when it is not valid JSON); Postgres returns JSON.
function readJson(value, jsonAsText) {
  if (!jsonAsText || value === null || value === undefined) return value ?? null;
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
}

const idRef = (id) => (id ? { id } : null);

// The shape CLASS_DASHBOARD_PROJECTS_QUERY used to return for each board.
function toProjectOutput(board, jsonAsText) {
  const { study } = board;
  return {
    id: board.id,
    title: board.title,
    isMain: board.isMain,
    sections: board.sections.map((section) => ({
      id: section.id,
      cards: section.cards.map((card) => ({
        id: card.id,
        type: card.type,
        settings: readJson(card.settings, jsonAsText),
      })),
    })),
    milestoneStatus: readJson(board.milestoneStatus, jsonAsText),
    submitProposalStatus: board.submitProposalStatus,
    submitProposalOpenForComments: board.submitProposalOpenForComments,
    peerFeedbackStatus: board.peerFeedbackStatus,
    peerFeedbackOpenForComments: board.peerFeedbackOpenForComments,
    projectReportStatus: board.projectReportStatus,
    projectReportOpenForComments: board.projectReportOpenForComments,
    usedInClass: idRef(board.usedInClassId),
    clonedFrom: idRef(board.clonedFromId),
    author: board.author || null,
    collaborators: board.collaborators,
    study: study
      ? {
          id: study.id,
          title: study.title,
          status: study.status,
          collaborators: study.collaborators,
          dataCollectionStatus: study.dataCollectionStatus,
          dataCollectionOpenForParticipation:
            study.dataCollectionOpenForParticipation,
        }
      : null,
    reviews: board.reviews.map((review) => ({
      stage: review.stage,
      milestone: review.milestone ? { key: review.milestone.key } : null,
    })),
  };
}

// `context` must be the caller's (not sudo): the class check runs with their
// access. Returns the class id as a string.
async function assertCanReadClass(context, classId) {
  if (!context.session?.itemId || !classId) throw new Error(DENIED);
  const id = String(classId);
  const readable = await context.db.Class.count({
    where: { id: { equals: id } },
  });
  if (!readable) throw new Error(DENIED);
  return id;
}

// `jsonAsText` is true on SQLite (see readJson).
async function loadClassDashboardProjects(context, classId, jsonAsText) {
  const id = await assertCanReadClass(context, classId);
  const boards = await context.prisma.proposalBoard.findMany({
    where: { usedInClassId: id },
    select: BOARD_SELECT,
  });
  return boards.map((board) => toProjectOutput(board, jsonAsText));
}

const STUDY_SELECT = {
  id: true,
  title: true,
  classes: { select: { id: true, title: true } },
  collaborators: PROFILE_SELECT,
};

// The class's studies, in the shape CLASS_DASHBOARD_STUDIES_QUERY used to
// return. A study's `classes` lists only the classes the caller may read, as
// the Class read filter did when Keystone resolved it per study; here that
// filter runs once for all of them.
async function loadClassDashboardStudies(context, classId) {
  const id = await assertCanReadClass(context, classId);
  const studies = await context.prisma.study.findMany({
    where: { classes: { some: { id } } },
    select: STUDY_SELECT,
  });
  const classIds = [
    ...new Set(studies.flatMap((study) => study.classes.map((c) => c.id))),
  ];
  const readable = classIds.length
    ? await context.db.Class.findMany({ where: { id: { in: classIds } } })
    : [];
  const readableIds = new Set(readable.map((item) => String(item.id)));
  return studies.map((study) => ({
    id: study.id,
    title: study.title,
    classes: study.classes.filter((item) => readableIds.has(item.id)),
    collaborators: study.collaborators,
  }));
}

module.exports = {
  BOARD_SELECT,
  STUDY_SELECT,
  readJson,
  toProjectOutput,
  loadClassDashboardProjects,
  loadClassDashboardStudies,
};
