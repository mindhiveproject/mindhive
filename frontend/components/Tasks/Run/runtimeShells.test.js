const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveRuntimeConfiguration } = require("./runtimeConfig");
const { createShellLifecycle } = require("./shellLifecycle");

test("frontend dispatcher resolves each supported runtime", () => {
  assert.equal(
    resolveRuntimeConfiguration({ runtimeType: "P5", visual: { id: "v1" } })
      .assetField,
    "visual"
  );
  assert.equal(
    resolveRuntimeConfiguration({
      runtimeType: "JSPSYCH",
      jsPsychExperiment: {
        id: "j1",
        entryPoint: "index.html",
        manifest: { files: ["index.html"] },
        archive: { filename: "experiment.zip" },
      },
    }).assetField,
    "jsPsychExperiment"
  );
});

test("P5 shell lifecycle mounts, reports failure, and cleans up once", () => {
  const events = [];
  const lifecycle = createShellLifecycle("P5", "visual-1", (event) =>
    events.push(event)
  );
  assert.equal(lifecycle.mount(), true);
  assert.equal(lifecycle.mount(), false);
  lifecycle.fail("not executable");
  assert.equal(lifecycle.cleanup(), true);
  assert.equal(lifecycle.cleanup(), false);
  assert.deepEqual(events, ["mounted", "failure", "cleanup"]);
});
