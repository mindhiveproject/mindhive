const test = require("node:test");
const assert = require("node:assert/strict");
const {
  templateClassIds,
  shouldReuseAssignments,
  collectCardAssignments,
  selectAssignmentsToSplit,
} = require("./classAssignmentCopies");

test("copy into a class template always gets its own assignments", () => {
  assert.equal(
    shouldReuseAssignments({ classIdTemplate: "c2", sourceIsClassTemplate: true }),
    false
  );
  assert.equal(
    shouldReuseAssignments({ classIdTemplate: "c2", sourceIsClassTemplate: false }),
    false
  );
});

test("student copy of a class template reuses the template's assignments", () => {
  assert.equal(
    shouldReuseAssignments({ classIdTemplate: null, sourceIsClassTemplate: true }),
    true
  );
});

test("copy of a non-class board creates new assignments", () => {
  assert.equal(
    shouldReuseAssignments({ classIdTemplate: undefined, sourceIsClassTemplate: false }),
    false
  );
});

test("templateClassIds merges both relationship fields without duplicates", () => {
  assert.deepEqual(
    templateClassIds({
      templateForClasses: [{ id: "c1" }],
      templatesForClass: [{ id: "c1" }, { id: "c2" }],
    }),
    ["c1", "c2"]
  );
  assert.deepEqual(templateClassIds(null), []);
});

test("collectCardAssignments dedupes an assignment linked on two cards", () => {
  const a = { id: "a1" };
  const entries = collectCardAssignments([
    { cards: [{ id: "k1", assignments: [a] }] },
    { cards: [{ id: "k2", assignments: [a, { id: "a2" }] }] },
  ]);
  assert.deepEqual(
    entries.map((e) => [e.assignment.id, e.cardIds]),
    [
      ["a1", ["k1", "k2"]],
      ["a2", ["k2"]],
    ]
  );
});

function board(assignmentsByCard, classes = [{ id: "mine" }]) {
  return {
    templatesForClass: classes,
    sections: [
      {
        cards: assignmentsByCard.map((assignments, i) => ({
          id: `k${i}`,
          assignments,
        })),
      },
    ],
  };
}

test("selects assignments that belong to another class", () => {
  const selected = selectAssignmentsToSplit(
    board([
      [{ id: "shared", classes: [{ id: "other" }] }],
      [{ id: "half", classes: [{ id: "other" }, { id: "mine" }] }],
      [{ id: "own", classes: [{ id: "mine" }] }],
      [{ id: "none", classes: [] }],
      [{ id: "platform", isTemplate: true, classes: [{ id: "other" }] }],
    ])
  );
  assert.deepEqual(
    selected.map((e) => e.assignment.id),
    ["shared", "half"]
  );
});

test("an assignment shared by two classes of the same board is not split", () => {
  const selected = selectAssignmentsToSplit(
    board(
      [[{ id: "a", classes: [{ id: "c1" }, { id: "c2" }] }]],
      [{ id: "c1" }, { id: "c2" }]
    )
  );
  assert.deepEqual(selected, []);
});

test("a board that is not a class template selects nothing", () => {
  const selected = selectAssignmentsToSplit(
    board([[{ id: "a", classes: [{ id: "other" }] }]], [])
  );
  assert.deepEqual(selected, []);
});

test("after the repair (copy owned by the board's classes) nothing is selected", () => {
  const selected = selectAssignmentsToSplit(
    board([[{ id: "copy", classes: [{ id: "mine" }] }]])
  );
  assert.deepEqual(selected, []);
});
