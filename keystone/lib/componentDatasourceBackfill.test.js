const test = require("node:test");
const assert = require("node:assert/strict");
const { planComponent } = require("./componentDatasourceBackfill");

const datasources = [
  { id: "old", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "new", updatedAt: "2026-06-01T00:00:00Z" },
];

test("a component naming one of its journal's datasets is kept", () => {
  const plan = planComponent({
    type: "GRAPH",
    content: { datasourceId: "old", selectors: { x: "a" } },
    datasources,
  });
  assert.deepEqual(plan, { action: "keep" });
});

test("a component naming none gets the dataset it shows today", () => {
  const plan = planComponent({
    type: "TABLE",
    content: { selectors: { visibleColumns: ["a"] } },
    datasources,
  });
  assert.equal(plan.action, "set");
  assert.equal(plan.reason, "unassigned");
  assert.deepEqual(plan.content, {
    selectors: { visibleColumns: ["a"] },
    datasourceId: "new",
  });
});

test("a component naming a dataset gone from its journal is repointed", () => {
  const plan = planComponent({
    type: "STATTEST",
    content: JSON.stringify({ datasourceId: "template-ds" }),
    datasources,
  });
  assert.equal(plan.reason, "dangling");
  assert.equal(plan.datasourceId, "new");
});

test("components without a dataset to point at, and non-data ones, are left", () => {
  assert.equal(
    planComponent({ type: "GRAPH", content: {}, datasources: [] }).action,
    "noDatasets"
  );
  assert.equal(
    planComponent({ type: "PARAGRAPH", content: {}, datasources }).action,
    "skip"
  );
});

test("a component with empty content still gets its dataset", () => {
  const plan = planComponent({ type: "CODE", content: null, datasources });
  assert.deepEqual(plan.content, { datasourceId: "new" });
});
