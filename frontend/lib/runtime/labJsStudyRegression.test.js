const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const frontendRoot = path.resolve(__dirname, "../..");
const repositoryRoot = path.resolve(frontendRoot, "..");

function source(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

test("LabJS adapter preserves existing path, branching, retake, and resume inputs", () => {
  const manager = source("frontend/components/Studies/Run/Manager.js");
  const adapter = source("frontend/components/Labjs/Run/index.js");
  const saveRoute = source("frontend/pages/api/save.ts");
  assert.match(manager, /getNextSteps/);
  assert.match(manager, /conditionLabel/);
  assert.match(manager, /isTaskRetaken/);
  assert.match(manager, /studiesInfo/);
  assert.match(adapter, /currentStep/);
  assert.match(adapter, /isTaskRetaken/);
  assert.match(adapter, /onFinish/);
  assert.match(adapter, /useExternalDevices/);
  assert.match(adapter, /\/api\/save\?runToken=/);
  assert.doesNotMatch(adapter, /CREATE_DATASET|UPDATE_DATASET/);
  assert.match(saveRoute, /A server-issued run token is required/);
  assert.match(saveRoute, /stampLabJsMetadata/);
  assert.match(saveRoute, /INGEST_COMPLETE_MUTATION/);
});

test("collection joins remain on Task, Dataset, and SummaryResult", () => {
  const task = source("keystone/schemas/Task.ts");
  const dataset = source("keystone/schemas/Dataset.ts");
  const summary = source("keystone/schemas/SummaryResult.ts");
  assert.match(task, /ref: "Dataset\.task"/);
  assert.match(task, /ref: "SummaryResult\.task"/);
  assert.match(dataset, /ref: "SummaryResult\.fullResult"/);
  assert.match(summary, /ref: "Dataset\.summaryResult"/);
});
