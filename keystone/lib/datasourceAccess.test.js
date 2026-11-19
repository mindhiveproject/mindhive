const test = require("node:test");
const assert = require("node:assert/strict");
const {
  canSeeSimulatedDatasets,
  datasourceReadWhere,
} = require("./datasourceAccess");

// A small evaluator for the filter shapes datasourceReadWhere emits, so each
// persona is checked against real dataset rows rather than clause shapes.
function matches(row, where) {
  if (where === true) return true;
  if (!where) return false;
  return Object.entries(where).every(([key, cond]) => {
    if (key === "OR") return cond.some((w) => matches(row, w));
    if (key === "AND") return cond.every((w) => matches(row, w));
    const value = row?.[key];
    if ("equals" in cond) return (value ?? null) === cond.equals;
    if ("in" in cond) return cond.in.includes(value);
    if ("not" in cond) return !matchesValue(value, cond.not);
    if ("some" in cond) return (value || []).some((v) => matches(v, cond.some));
    // a to-one relation: the nested where applies to the related row
    if (value == null) return false;
    return matches(value, cond);
  });
}
function matchesValue(value, cond) {
  if ("equals" in cond) return (value ?? null) === cond.equals;
  return false;
}

// Classes: c1 (teacher T, students S1 S2), c2 (teacher T2, student S3).
// Study st1 is researched by S1 (via board b1) and by T (class staff).
const datasets = {
  publicOne: { id: "pub", isPublic: true, dataOrigin: "UPLOADED" },
  s1Upload: { id: "s1u", author: { id: "S1" }, dataOrigin: "UPLOADED" },
  s1Study: {
    id: "s1s",
    author: { id: "S1" },
    study: { id: "st1" },
    dataOrigin: "STUDY",
  },
  s1Board: {
    id: "s1b",
    author: { id: "S1" },
    project: {
      author: { id: "S1" },
      collaborators: [{ id: "S4" }],
      usedInClass: { id: "c1" },
    },
    dataOrigin: "UPLOADED",
  },
  sharedWithC1: {
    id: "shared",
    author: { id: "S1" },
    sharedWithClasses: [{ id: "c1" }],
    dataOrigin: "UPLOADED",
  },
  s1Simulated: { id: "sim", author: { id: "S1" }, dataOrigin: "SIMULATED" },
  legacyNoOrigin: { id: "legacy", author: { id: "S1" } },
};

function visibleTo(viewer) {
  const where = datasourceReadWhere(viewer);
  return Object.values(datasets)
    .filter((row) => matches(row, where))
    .map((row) => row.id)
    .sort();
}

test("public datasets are visible to any signed-in user", () => {
  assert.deepEqual(visibleTo({ me: "stranger" }), ["pub"]);
});

test("the author sees their uploads, study and board datasets, but not simulated ones", () => {
  assert.deepEqual(visibleTo({ me: "S1", studyIds: ["st1"] }), [
    "legacy",
    "pub",
    "s1b",
    "s1s",
    "s1u",
    "shared",
  ]);
});

test("a classmate sees only what the teacher shared with their class", () => {
  assert.deepEqual(visibleTo({ me: "S2", memberClassIds: ["c1"] }), [
    "pub",
    "shared",
  ]);
});

test("a student of another class does not see class-shared datasets", () => {
  assert.deepEqual(visibleTo({ me: "S3", memberClassIds: ["c2"] }), ["pub"]);
});

test("a study researcher who is not the author sees the study dataset", () => {
  // e.g. a study collaborator no longer on the board, or a board member of
  // another board linked to the study: both resolve to st1 in studyIds
  assert.deepEqual(visibleTo({ me: "R", studyIds: ["st1"] }), ["pub", "s1s"]);
});

test("a board collaborator sees the board's dataset", () => {
  assert.deepEqual(visibleTo({ me: "S4" }), ["pub", "s1b"]);
});

test("the teacher sees their students' study and board datasets", () => {
  assert.deepEqual(
    visibleTo({
      me: "T",
      studyIds: ["st1"],
      staffClassIds: ["c1"],
      memberClassIds: ["c1"],
    }),
    ["pub", "s1b", "s1s", "shared"]
  );
});

test("testers also see simulated datasets they can otherwise reach", () => {
  assert.deepEqual(
    visibleTo({ me: "S1", studyIds: ["st1"], canSeeSimulated: true }),
    ["legacy", "pub", "s1b", "s1s", "s1u", "shared", "sim"]
  );
  assert.deepEqual(visibleTo({ me: "stranger", canSeeSimulated: true }), [
    "pub",
  ]);
});

test("only TESTER and ADMIN roles see simulated datasets", () => {
  const role = (name) => ({ data: { permissions: [{ name }] } });
  assert.equal(canSeeSimulatedDatasets(role("TESTER")), true);
  assert.equal(canSeeSimulatedDatasets(role("ADMIN")), true);
  assert.equal(canSeeSimulatedDatasets(role("TEACHER")), false);
  assert.equal(canSeeSimulatedDatasets(undefined), false);
});
