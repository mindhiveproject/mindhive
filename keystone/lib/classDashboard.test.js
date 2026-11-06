const test = require("node:test");
const assert = require("node:assert/strict");
const {
  BOARD_SELECT,
  STUDY_SELECT,
  readJson,
  loadClassDashboardProjects,
  loadClassDashboardStudies,
} = require("./classDashboard");

const BOARD = {
  id: "b1",
  title: "Board",
  isMain: true,
  sections: [
    { id: "s1", cards: [{ id: "c1", type: "ACTION_SUBMIT", settings: '{"status":"Completed"}' }] },
  ],
  milestoneStatus: '{"proposal":{"status":"SUBMITTED"}}',
  submitProposalStatus: "SUBMITTED",
  submitProposalOpenForComments: false,
  peerFeedbackStatus: "NOT_STARTED",
  peerFeedbackOpenForComments: false,
  projectReportStatus: "NOT_STARTED",
  projectReportOpenForComments: false,
  usedInClassId: "class1",
  clonedFromId: null,
  collaborators: [{ id: "p1", username: "ana" }],
  study: null,
  reviews: [
    { stage: "INDIVIDUAL", milestone: { key: "proposal" } },
    { stage: "FINAL", milestone: null },
  ],
};

// A caller's context: the class reads run with their access (context.db).
// `readableClasses` are the class ids their Class read filter lets through.
function fakeContext({
  session = { itemId: "teacher" },
  readable = 1,
  boards = [BOARD],
  studies = [],
  readableClasses = [],
} = {}) {
  const calls = { classCount: [], classFind: [], boards: [], studies: [] };
  const context = {
    session,
    db: {
      Class: {
        count: async (args) => {
          calls.classCount.push(args);
          return readable;
        },
        findMany: async (args) => {
          calls.classFind.push(args);
          return args.where.id.in
            .filter((id) => readableClasses.includes(id))
            .map((id) => ({ id }));
        },
      },
    },
    prisma: {
      proposalBoard: {
        findMany: async (args) => {
          calls.boards.push(args);
          return boards;
        },
      },
      study: {
        findMany: async (args) => {
          calls.studies.push(args);
          return studies;
        },
      },
    },
    sudo() {
      throw new Error("the class check must not run as sudo");
    },
  };
  return { context, calls };
}

test("signed-out callers are denied without touching the database", async () => {
  const { context, calls } = fakeContext({ session: null });
  await assert.rejects(loadClassDashboardProjects(context, "class1", true), /do not have access/);
  assert.equal(calls.classCount.length, 0);
  assert.equal(calls.boards.length, 0);
});

test("callers who cannot read the class are denied before boards load", async () => {
  const { context, calls } = fakeContext({ readable: 0 });
  await assert.rejects(loadClassDashboardProjects(context, "class1", true), /do not have access/);
  assert.deepEqual(calls.classCount, [{ where: { id: { equals: "class1" } } }]);
  assert.equal(calls.boards.length, 0);
});

test("loads the class's boards in one Prisma call, in the old query's shape", async () => {
  const { context, calls } = fakeContext();
  const [project] = await loadClassDashboardProjects(context, "class1", true);
  assert.deepEqual(calls.boards, [{ where: { usedInClassId: "class1" }, select: BOARD_SELECT }]);
  assert.deepEqual(project.sections, [
    { id: "s1", cards: [{ id: "c1", type: "ACTION_SUBMIT", settings: { status: "Completed" } }] },
  ]);
  assert.deepEqual(project.milestoneStatus, { proposal: { status: "SUBMITTED" } });
  assert.deepEqual(project.usedInClass, { id: "class1" });
  assert.equal(project.clonedFrom, null);
  assert.equal(project.study, null);
  assert.deepEqual(project.reviews, [
    { stage: "INDIVIDUAL", milestone: { key: "proposal" } },
    { stage: "FINAL", milestone: null },
  ]);
  assert.equal("usedInClassId" in project, false);
});

test("readJson parses text only on SQLite, as Keystone does", () => {
  assert.deepEqual(readJson('{"a":1}', true), { a: 1 });
  assert.equal(readJson("not json", true), null);
  assert.equal(readJson(null, true), null);
  // Postgres returns JSON values; a JSON string value stays a string.
  assert.deepEqual(readJson({ a: 1 }, false), { a: 1 });
  assert.equal(readJson('{"a":1}', false), '{"a":1}');
  assert.equal(readJson(undefined, false), null);
});

const STUDIES = [
  {
    id: "st1",
    title: "Sleep",
    classes: [
      { id: "class1", title: "Mine" },
      { id: "other", title: "Someone else's" },
    ],
    collaborators: [{ id: "p1", username: "ana" }],
  },
  {
    id: "st2",
    title: "Memory",
    classes: [{ id: "class1", title: "Mine" }],
    collaborators: [],
  },
];

test("studies: lists only the classes the caller may read, checked once", async () => {
  const { context, calls } = fakeContext({
    studies: STUDIES,
    readableClasses: ["class1"],
  });
  const studies = await loadClassDashboardStudies(context, "class1");
  assert.deepEqual(calls.studies, [
    { where: { classes: { some: { id: "class1" } } }, select: STUDY_SELECT },
  ]);
  assert.deepEqual(calls.classFind, [{ where: { id: { in: ["class1", "other"] } } }]);
  assert.deepEqual(studies, [
    {
      id: "st1",
      title: "Sleep",
      classes: [{ id: "class1", title: "Mine" }],
      collaborators: [{ id: "p1", username: "ana" }],
    },
    { id: "st2", title: "Memory", classes: [{ id: "class1", title: "Mine" }], collaborators: [] },
  ]);
});

test("studies: denied callers get no study data", async () => {
  const { context, calls } = fakeContext({ readable: 0, studies: STUDIES });
  await assert.rejects(loadClassDashboardStudies(context, "class1"), /do not have access/);
  assert.equal(calls.studies.length, 0);
  assert.equal(calls.classFind.length, 0);
});

test("studies: no class lookup when the class has no studies", async () => {
  const { context, calls } = fakeContext({ studies: [] });
  assert.deepEqual(await loadClassDashboardStudies(context, "class1"), []);
  assert.equal(calls.classFind.length, 0);
});
