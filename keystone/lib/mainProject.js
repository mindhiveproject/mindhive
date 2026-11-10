// Rules for a board's main-project flag (ProposalBoard.isMain) and its class
// link (ProposalBoard.usedInClass). Called from the ProposalBoard hooks and
// from copyProposalBoard, so every writer follows the same rules.
//
// A student has one main project per class. The flag lives on the board, so
// it is shared by every student on it. The class's teachers and mentors are
// not counted as board members: a board a teacher created for one student is
// that student's own board.
//
// Reads use Prisma directly: the rules must see boards and class staff the
// caller may not be able to read.

const SUPPORT = "If it needs to move, the support team can help.";

const idsOf = (items) => (items || []).map((item) => item?.id).filter(Boolean);

const MEMBER_SELECT = {
  id: true,
  title: true,
  authorId: true,
  author: { select: { id: true, username: true } },
  collaborators: { select: { id: true, username: true } },
};

async function loadStaffIds(prisma, classId) {
  if (!classId) return new Set();
  const klass = await prisma.class.findUnique({
    where: { id: String(classId) },
    select: {
      creatorId: true,
      teachingTeam: { select: { id: true } },
      mentors: { select: { id: true } },
    },
  });
  return new Set(
    [klass?.creatorId, ...idsOf(klass?.teachingTeam), ...idsOf(klass?.mentors)]
      .filter(Boolean)
      .map(String)
  );
}

// The board's author and collaborators, without the class's staff.
function studentMembers(board, staffIds) {
  const byId = new Map();
  for (const person of [board?.author, ...(board?.collaborators || [])]) {
    if (person?.id && !staffIds.has(String(person.id))) {
      byId.set(String(person.id), person);
    }
  }
  if (board?.authorId && !byId.has(String(board.authorId))) {
    if (!staffIds.has(String(board.authorId))) {
      byId.set(String(board.authorId), { id: String(board.authorId) });
    }
  }
  return byId;
}

const memberWhere = (ids) => ({
  OR: [
    { authorId: { in: ids } },
    { collaborators: { some: { id: { in: ids } } } },
  ],
});

const quote = (title) => `"${title || "Untitled project"}"`;

// What a relationship input does to the board's class: `undefined` when it
// leaves the class as it is, `null` when it unlinks it, otherwise the new
// class id.
async function resolveClassChange(prisma, input, item) {
  const current = item?.usedInClassId ? String(item.usedInClassId) : null;
  if (!input) return undefined;
  if (input.disconnect) return current ? null : undefined;
  if (!input.connect) return undefined;
  let nextId = input.connect.id ? String(input.connect.id) : null;
  if (!nextId) {
    const klass = await prisma.class.findUnique({
      where: input.connect,
      select: { id: true },
    });
    nextId = klass?.id ? String(klass.id) : null;
  }
  if (!nextId || nextId === current) return undefined;
  return nextId;
}

function parseJson(value) {
  if (typeof value !== "string") return value || null;
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
}

const STARTED = (status) => !!status && status !== "NOT_STARTED";

// Submitted or reviewed work: its reviews and logs belong to the class it was
// submitted in.
function hasSubmittedWork(board) {
  if (board.isSubmitted) return true;
  if (
    STARTED(board.submitProposalStatus) ||
    STARTED(board.peerFeedbackStatus) ||
    STARTED(board.projectReportStatus)
  ) {
    return true;
  }
  const milestoneStatus = parseJson(board.milestoneStatus);
  if (milestoneStatus && typeof milestoneStatus === "object") {
    if (Object.values(milestoneStatus).some((entry) => STARTED(entry?.status))) {
      return true;
    }
  }
  return (board._count?.reviews || 0) > 0;
}

/**
 * May the caller change the board's class to `nextClassId` (null = unlink)?
 * Returns an error message, or null when the change is allowed.
 *
 * Staff of the board's current class and admins may always move it. Anyone
 * may link a board that has no class yet. Otherwise the move is refused when
 * the board is a main project, has submitted or reviewed work, or was made
 * from a class board the destination class does not use: its teacher could
 * not manage it there.
 */
async function checkClassChange({
  prisma,
  boardId,
  nextClassId,
  callerId,
  callerIsAdmin,
}) {
  if (callerIsAdmin) return null;
  const board = await prisma.proposalBoard.findUnique({
    where: { id: String(boardId) },
    select: {
      id: true,
      isMain: true,
      isSubmitted: true,
      submitProposalStatus: true,
      peerFeedbackStatus: true,
      projectReportStatus: true,
      milestoneStatus: true,
      usedInClassId: true,
      clonedFrom: {
        select: {
          templatesForClass: { select: { id: true } },
          templateForClasses: { select: { id: true } },
        },
      },
      _count: { select: { reviews: true } },
    },
  });
  if (!board) return null;

  if (board.usedInClassId) {
    const staffIds = await loadStaffIds(prisma, board.usedInClassId);
    if (callerId && staffIds.has(String(callerId))) return null;

    if (board.isMain) {
      return `This is a main project in its class, so it cannot be moved to another class. Remove it as main project first. ${SUPPORT}`;
    }
    if (hasSubmittedWork(board)) {
      return `This project has work that was submitted or reviewed in its class, so it cannot be moved to another class. ${SUPPORT}`;
    }
  }

  if (nextClassId) {
    const templateClassIds = new Set(
      [
        ...idsOf(board.clonedFrom?.templatesForClass),
        ...idsOf(board.clonedFrom?.templateForClasses),
      ].map(String)
    );
    if (templateClassIds.size && !templateClassIds.has(String(nextClassId))) {
      return `This project was made from a project board that the selected class does not use, so its teacher could not manage it there. ${SUPPORT}`;
    }
  }
  return null;
}

/**
 * May the board become the main project of `classId`?
 *
 * Returns `{ error }` when a student on the board already has another main
 * project in the class that is shared with someone who is not on this board:
 * un-maining it would change their main project too. Otherwise returns
 * `{ swapIds }`, the students' other main projects in the class, which stop
 * being main when this one is set (every student on them is on this board).
 */
async function checkSetMain({ prisma, boardId, classId }) {
  if (!classId) {
    return {
      error: "A main project must be linked to a class. Link this project to a class first.",
    };
  }
  const board = await prisma.proposalBoard.findUnique({
    where: { id: String(boardId) },
    select: MEMBER_SELECT,
  });
  if (!board) return { swapIds: [] };

  const staffIds = await loadStaffIds(prisma, classId);
  const students = studentMembers(board, staffIds);
  if (!students.size) return { swapIds: [] };

  const others = await prisma.proposalBoard.findMany({
    where: {
      id: { not: String(boardId) },
      isMain: true,
      isHidden: false,
      usedInClassId: String(classId),
      ...memberWhere([...students.keys()]),
    },
    select: MEMBER_SELECT,
  });

  const swapIds = [];
  const conflicts = [];
  for (const other of others) {
    const otherStudents = studentMembers(other, staffIds);
    const outsiders = [...otherStudents.keys()].filter((id) => !students.has(id));
    if (!outsiders.length) {
      swapIds.push(other.id);
      continue;
    }
    const names = [...otherStudents.values()]
      .filter((person) => students.has(String(person.id)))
      .map((person) => person.username)
      .filter(Boolean);
    conflicts.push({ title: other.title, names });
  }

  if (conflicts.length) {
    const parts = conflicts.map(({ title, names }) =>
      names.length
        ? `${quote(title)} (main project of ${names.join(", ")})`
        : quote(title)
    );
    return {
      error: `A student can have one main project per class. Already a main project in this class: ${parts.join(
        ", "
      )}. It is shared with other students, so it is not changed automatically. Remove it as main project first.`,
    };
  }
  return { swapIds };
}

// Un-main the boards `checkSetMain` listed as replaced. Runs after the board
// was saved as main.
async function swapOtherMains({ prisma, boardId, classId }) {
  const { swapIds = [] } = await checkSetMain({ prisma, boardId, classId });
  if (!swapIds.length) return [];
  await prisma.proposalBoard.updateMany({
    where: { id: { in: swapIds } },
    data: { isMain: false },
  });
  return swapIds;
}

/**
 * Is a board being created in `classId` its students' first board there? It
 * then starts as their main project. `memberIds` are the new board's author
 * and collaborators; class staff among them are ignored.
 */
async function isFirstBoardInClass({ prisma, classId, memberIds }) {
  if (!classId) return false;
  const staffIds = await loadStaffIds(prisma, classId);
  const students = [...new Set((memberIds || []).filter(Boolean).map(String))]
    .filter((id) => !staffIds.has(id));
  if (!students.length) return false;
  const existing = await prisma.proposalBoard.count({
    where: {
      isHidden: false,
      usedInClassId: String(classId),
      ...memberWhere(students),
    },
  });
  return existing === 0;
}

module.exports = {
  resolveClassChange,
  hasSubmittedWork,
  studentMembers,
  checkClassChange,
  checkSetMain,
  swapOtherMains,
  isFirstBoardInClass,
};
