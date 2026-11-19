const test = require("node:test");
const assert = require("node:assert/strict");
const { journalTeamWhere, journalListFilters } = require("./journalAccess");
const { matches } = require("./whereMatcher.testutil");

// Journal collections: j1 on study st1, j2 on board b1 (author S1,
// collaborator S4, class c1), j3 on a teacher's class template board,
// j4 with neither (legacy orphan).
const collections = [
  { id: "j1", study: { id: "st1" } },
  {
    id: "j2",
    project: {
      author: { id: "S1" },
      collaborators: [{ id: "S4" }],
      usedInClass: { id: "c1" },
    },
  },
  {
    id: "j3",
    project: {
      author: { id: "T" },
      collaborators: [],
      templateForClasses: [{ id: "c1" }],
    },
  },
  { id: "j4" },
];

function teamJournalIds(viewer) {
  const where = journalTeamWhere(viewer);
  return collections.filter((j) => matches(j, where)).map((j) => j.id);
}

// Journals (parts) and their nested workspaces/components.
const parts = [
  { id: "p1", vizJournal: { id: "j1" }, isTemplate: false },
  { id: "p2", vizJournal: { id: "j2" }, isTemplate: false },
  { id: "p4", vizJournal: { id: "j4" }, isTemplate: true },
];
const chapters = parts.map((p) => ({ id: `w-${p.id}`, vizPart: p }));
const sections = chapters.map((c) => ({ id: `c-${c.id}`, vizChapter: c }));

function visible(viewer, list, mode) {
  const filters = journalListFilters(teamJournalIds(viewer));
  const rows = { VizPart: parts, VizChapter: chapters, VizSection: sections }[
    list
  ];
  return rows.filter((r) => matches(r, filters[list][mode])).map((r) => r.id);
}

test("a study researcher owns the study's journal collection", () => {
  assert.deepEqual(teamJournalIds({ me: "R", studyIds: ["st1"] }), ["j1"]);
});

test("board author and collaborators own the board's journal collection", () => {
  assert.deepEqual(teamJournalIds({ me: "S1" }), ["j2"]);
  assert.deepEqual(teamJournalIds({ me: "S4" }), ["j2"]);
});

test("class staff own their students' board and class template journals", () => {
  assert.deepEqual(teamJournalIds({ me: "T2", staffClassIds: ["c1"] }), [
    "j2",
    "j3",
  ]);
});

test("a stranger owns nothing; orphan collections belong to no team", () => {
  assert.deepEqual(teamJournalIds({ me: "X" }), []);
});

test("strangers can read template journals, their workspaces and components", () => {
  assert.deepEqual(visible({ me: "X" }, "VizPart", "read"), ["p4"]);
  assert.deepEqual(visible({ me: "X" }, "VizChapter", "read"), ["w-p4"]);
  assert.deepEqual(visible({ me: "X" }, "VizSection", "read"), ["c-w-p4"]);
});

test("nobody outside the team can change a template", () => {
  assert.deepEqual(visible({ me: "X" }, "VizPart", "write"), []);
  assert.deepEqual(visible({ me: "X" }, "VizSection", "write"), []);
});

test("the team reads and changes everything in its journals", () => {
  const viewer = { me: "S4" };
  assert.deepEqual(visible(viewer, "VizPart", "read"), ["p2", "p4"]);
  assert.deepEqual(visible(viewer, "VizPart", "write"), ["p2"]);
  assert.deepEqual(visible(viewer, "VizChapter", "write"), ["w-p2"]);
  assert.deepEqual(visible(viewer, "VizSection", "write"), ["c-w-p2"]);
});
