// Run with: node --test lib/studyConditions.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  conditionCount,
  selectCondition,
  conditionFlow,
} = require("./studyConditions");

const conditions = [
  { name: "n1", label: "Control", probability: "50", flow: ["a"] },
  { name: "n2", label: "Treatment", probability: 50, flow: ["b"] },
];

test("counts by name, plus counts recorded by label before names", () => {
  assert.equal(conditionCount({ n1: 3, Control: 2 }, conditions[0]), 5);
  assert.equal(conditionCount({ n1: 3 }, { ...conditions[0], label: "Renamed" }), 3);
  assert.equal(conditionCount(undefined, conditions[0]), 0);
});

test("a full condition is not picked while another has room", () => {
  for (let i = 0; i < 50; i += 1) {
    const picked = selectCondition({ conditions, components: { n1: 50, n2: 10 } });
    assert.deepEqual(picked, { conditionName: "n2", conditionLabel: "Treatment" });
  }
});

test("when every condition is full the places are scaled up", () => {
  const picked = selectCondition({
    conditions,
    components: { n1: 50, n2: 50 },
    random: () => 0,
  });
  assert.equal(picked.conditionName, "n1");
});

test("conditions at 0% or without a probability do not hang", () => {
  const picked = selectCondition({
    conditions: [{ name: "a", probability: 0 }, { name: "b" }],
    components: {},
    random: () => 0.99,
  });
  assert.equal(picked.conditionName, "b");
});

test("finds the branch by name, then by label for older paths", () => {
  assert.deepEqual(conditionFlow(conditions, { conditionName: "n2", conditionLabel: "Control" }), ["b"]);
  assert.deepEqual(conditionFlow(conditions, { conditionLabel: "Treatment" }), ["b"]);
  assert.equal(conditionFlow(conditions, { conditionName: "gone" }), undefined);
});
