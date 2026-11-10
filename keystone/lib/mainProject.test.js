const test = require("node:test");
const assert = require("node:assert/strict");
const {
  resolveClassChange,
  hasSubmittedWork,
  checkClassChange,
  checkSetMain,
  swapOtherMains,
  isFirstBoardInClass,
} = require("./mainProject");

const person = (id) => ({ id, username: id });

// Class c1: teacher "teacher", mentor "mentor". Class c2: teacher "other".
const CLASSES = {
  c1: { creatorId: "teacher", teachingTeam: [], mentors: [person("mentor")] },
  c2: { creatorId: "other", teachingTeam: [], mentors: [] },
};

function board(overrides) {
  return {
    title: overrides.id,
    isMain: false,
    isHidden: false,
    isSubmitted: false,
    submitProposalStatus: "NOT_STARTED",
    peerFeedbackStatus: "NOT_STARTED",
    projectReportStatus: "NOT_STARTED",
    milestoneStatus: null,
    usedInClassId: "c1",
    authorId: null,
    author: null,
    collaborators: [],
    clonedFrom: null,
    _count: { reviews: 0 },
    ...overrides,
  };
}

const isMember = (b, ids) =>
  ids.includes(b.authorId) || b.collaborators.some((c) => ids.includes(c.id));

// The few Prisma calls the rules make, over an in-memory list of boards.
function fakePrisma(boards) {
  const matches = (b, where) =>
    (!where.id?.not || b.id !== where.id.not) &&
    (where.isMain === undefined || b.isMain === where.isMain) &&
    (where.isHidden === undefined || b.isHidden === where.isHidden) &&
    (!where.usedInClassId || b.usedInClassId === where.usedInClassId) &&
    (!where.OR || isMember(b, where.OR[0].authorId.in));
  return {
    class: {
      findUnique: async ({ where }) =>
        where.id ? CLASSES[where.id] || null : { id: "c2" },
    },
    proposalBoard: {
      findUnique: async ({ where }) => boards.find((b) => b.id === where.id) || null,
      findMany: async ({ where }) => boards.filter((b) => matches(b, where)),
      count: async ({ where }) => boards.filter((b) => matches(b, where)).length,
      updateMany: async ({ where, data }) => {
        for (const b of boards) {
          if (where.id.in.includes(b.id)) Object.assign(b, data);
        }
      },
    },
  };
}

test("resolveClassChange: tells a real change from a no-op", async () => {
  const prisma = fakePrisma([]);
  const item = { usedInClassId: "c1" };
  assert.equal(await resolveClassChange(prisma, undefined, item), undefined);
  assert.equal(await resolveClassChange(prisma, { connect: { id: "c1" } }, item), undefined);
  assert.equal(await resolveClassChange(prisma, { connect: { id: "c2" } }, item), "c2");
  assert.equal(await resolveClassChange(prisma, { disconnect: true }, item), null);
  assert.equal(await resolveClassChange(prisma, { disconnect: true }, {}), undefined);
  assert.equal(await resolveClassChange(prisma, { connect: { code: "X" } }, item), "c2");
});

test("hasSubmittedWork: flags, legacy statuses, milestone JSON and reviews", () => {
  assert.equal(hasSubmittedWork(board({ id: "b" })), false);
  assert.equal(hasSubmittedWork(board({ id: "b", isSubmitted: true })), true);
  assert.equal(hasSubmittedWork(board({ id: "b", peerFeedbackStatus: "SUBMITTED" })), true);
  assert.equal(
    hasSubmittedWork(board({ id: "b", milestoneStatus: '{"m":{"status":"SUBMITTED"}}' })),
    true
  );
  assert.equal(
    hasSubmittedWork(board({ id: "b", milestoneStatus: { m: { status: "NOT_STARTED" } } })),
    false
  );
  assert.equal(hasSubmittedWork(board({ id: "b", _count: { reviews: 2 } })), true);
});

test("checkClassChange: a student cannot move a main or submitted board", async () => {
  const main = board({ id: "b1", isMain: true, collaborators: [person("ana")] });
  const submitted = board({ id: "b2", isSubmitted: true });
  const plain = board({ id: "b3" });
  const prisma = fakePrisma([main, submitted, plain]);
  const ask = (boardId, extra = {}) =>
    checkClassChange({ prisma, boardId, nextClassId: "c2", callerId: "ana", ...extra });

  assert.match(await ask("b1"), /main project/);
  assert.match(await ask("b2"), /submitted or reviewed/);
  assert.equal(await ask("b3"), null);
  // Staff of the current class and admins may move anything.
  assert.equal(await ask("b1", { callerId: "teacher" }), null);
  assert.equal(await ask("b1", { callerId: "mentor" }), null);
  assert.equal(await ask("b2", { callerIsAdmin: true }), null);
  // Staff of the destination class only is not enough.
  assert.match(await ask("b1", { callerId: "other" }), /main project/);
});

test("checkClassChange: the destination class must use the board's template", async () => {
  const fromC1 = { templatesForClass: [{ id: "c1" }], templateForClasses: [] };
  const shared = { templatesForClass: [{ id: "c1" }], templateForClasses: [{ id: "c2" }] };
  const platform = { templatesForClass: [], templateForClasses: [] };
  const prisma = fakePrisma([
    board({ id: "b1", clonedFrom: fromC1 }),
    board({ id: "b2", clonedFrom: shared }),
    board({ id: "b3", clonedFrom: platform }),
    board({ id: "b4", clonedFrom: fromC1, usedInClassId: null }),
  ]);
  const ask = (boardId, nextClassId = "c2") =>
    checkClassChange({ prisma, boardId, nextClassId, callerId: "ana" });

  assert.match(await ask("b1"), /does not use/);
  assert.equal(await ask("b2"), null);
  assert.equal(await ask("b3"), null);
  // Unlinking has no destination to check.
  assert.equal(await ask("b1", null), null);
  // A first link is checked against the template too.
  assert.match(await ask("b4"), /does not use/);
  assert.equal(await ask("b4", "c1"), null);
});

test("checkSetMain: needs a class", async () => {
  const prisma = fakePrisma([board({ id: "b1", usedInClassId: null })]);
  const result = await checkSetMain({ prisma, boardId: "b1", classId: null });
  assert.match(result.error, /linked to a class/);
});

test("checkSetMain: a student's own other main is swapped", async () => {
  const prisma = fakePrisma([
    board({ id: "new", collaborators: [person("ana")] }),
    board({ id: "old", isMain: true, collaborators: [person("ana")] }),
    board({ id: "elsewhere", isMain: true, usedInClassId: "c2", collaborators: [person("ana")] }),
    board({ id: "hidden", isMain: true, isHidden: true, collaborators: [person("ana")] }),
  ]);
  assert.deepEqual(await checkSetMain({ prisma, boardId: "new", classId: "c1" }), {
    swapIds: ["old"],
  });
});

test("checkSetMain: a main shared with a student off this board is refused", async () => {
  const prisma = fakePrisma([
    board({ id: "new", collaborators: [person("ana")] }),
    board({ id: "group", title: "Group", isMain: true, collaborators: [person("ana"), person("ben")] }),
  ]);
  const result = await checkSetMain({ prisma, boardId: "new", classId: "c1" });
  assert.match(result.error, /"Group" \(main project of ana\)/);
  assert.equal(result.swapIds, undefined);
});

test("checkSetMain: class staff are not board members", async () => {
  // A board the teacher created for ana is ana's own board, so it is swapped,
  // and the teacher's and mentor's other boards are not looked at.
  const prisma = fakePrisma([
    board({ id: "new", authorId: "teacher", author: person("teacher"), collaborators: [person("ana")] }),
    board({ id: "old", isMain: true, authorId: "teacher", author: person("teacher"), collaborators: [person("ana"), person("mentor")] }),
    board({ id: "bens", isMain: true, authorId: "teacher", author: person("teacher"), collaborators: [person("ben")] }),
  ]);
  assert.deepEqual(await checkSetMain({ prisma, boardId: "new", classId: "c1" }), {
    swapIds: ["old"],
  });
});

test("checkSetMain: a group can replace the mains of its own members", async () => {
  const prisma = fakePrisma([
    board({ id: "new", collaborators: [person("ana"), person("ben")] }),
    board({ id: "anas", isMain: true, collaborators: [person("ana")] }),
    board({ id: "both", isMain: true, collaborators: [person("ben"), person("ana")] }),
  ]);
  const { swapIds } = await checkSetMain({ prisma, boardId: "new", classId: "c1" });
  assert.deepEqual(swapIds.sort(), ["anas", "both"]);
});

test("swapOtherMains: un-mains the replaced boards only", async () => {
  const boards = [
    board({ id: "new", isMain: true, collaborators: [person("ana")] }),
    board({ id: "old", isMain: true, collaborators: [person("ana")] }),
    board({ id: "bens", isMain: true, collaborators: [person("ben")] }),
  ];
  await swapOtherMains({ prisma: fakePrisma(boards), boardId: "new", classId: "c1" });
  assert.deepEqual(
    boards.map((b) => [b.id, b.isMain]),
    [["new", true], ["old", false], ["bens", true]]
  );
});

test("isFirstBoardInClass: counts the students, not the teacher who creates", async () => {
  const prisma = fakePrisma([
    board({ id: "bens", authorId: "teacher", collaborators: [person("ben")] }),
  ]);
  const ask = (memberIds, classId = "c1") =>
    isFirstBoardInClass({ prisma, classId, memberIds });

  assert.equal(await ask(["teacher", "ana"]), true);
  assert.equal(await ask(["teacher", "ben"]), false);
  assert.equal(await ask(["ana", "ben"]), false);
  // A board with no student on it is nobody's main project.
  assert.equal(await ask(["teacher"]), false);
  assert.equal(await ask(["ana"], null), false);
});
