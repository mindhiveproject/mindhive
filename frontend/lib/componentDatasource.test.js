const test = require("node:test");
const assert = require("node:assert/strict");
const {
  componentDatasourceStatus,
  legacyDatasourceId,
} = require("./componentDatasource");

const journal = [{ id: "a" }, { id: "b" }];

test("a component reads the dataset it names", () => {
  assert.deepEqual(componentDatasourceStatus({ datasourceId: "b" }, journal), {
    status: "ok",
    datasourceId: "b",
  });
});

test("a component naming a dataset no longer in the journal is missing, not given another", () => {
  assert.deepEqual(componentDatasourceStatus({ datasourceId: "z" }, journal), {
    status: "missing",
    datasourceId: "z",
  });
});

test("a component naming no dataset is unassigned", () => {
  assert.equal(componentDatasourceStatus({}, journal).status, "unassigned");
  assert.equal(
    componentDatasourceStatus({ datasourceId: "  " }, journal).status,
    "unassigned"
  );
});

test("a journal without datasets says so", () => {
  assert.equal(
    componentDatasourceStatus({ datasourceId: "a" }, []).status,
    "noDatasets"
  );
});

const dated = [
  { id: "old", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "new", updatedAt: "2026-06-01T00:00:00Z" },
  { id: "created", createdAt: "2026-03-01T00:00:00Z" },
];

test("legacy choice keeps a named dataset the journal has", () => {
  assert.equal(legacyDatasourceId({ datasourceId: "old" }, dated), "old");
});

test("legacy choice falls back to the most recently updated dataset", () => {
  assert.equal(legacyDatasourceId({}, dated), "new");
  assert.equal(legacyDatasourceId({ datasourceId: "gone" }, dated), "new");
  assert.equal(legacyDatasourceId({}, []), null);
});
