const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveRuntimeConfiguration } = require("./runtimeConfig");
const { createShellLifecycle } = require("./shellLifecycle");
const {
  createShellDocument,
  isTrustedBridgeMessage,
} = require("./jsPsychBridge");

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

test("jsPsych bridge accepts only tokenized source-and-origin messages", () => {
  const iframeWindow = {};
  const base = {
    iframeWindow,
    expectedOrigin: "https://mindhive.test",
    channelToken: "channel-1",
  };
  const trustedEvent = {
    source: iframeWindow,
    origin: "https://mindhive.test",
    data: {
      protocol: "mindhive-runtime-v1",
      channelToken: "channel-1",
      type: "handshake",
    },
  };
  assert.equal(isTrustedBridgeMessage({ ...base, event: trustedEvent }), true);
  assert.equal(
    isTrustedBridgeMessage({
      ...base,
      event: { ...trustedEvent, origin: "https://attacker.test" },
    }),
    false
  );
  assert.equal(
    isTrustedBridgeMessage({
      ...base,
      event: {
        ...trustedEvent,
        data: { ...trustedEvent.data, channelToken: "spoofed" },
      },
    }),
    false
  );
});

test("jsPsych shell document performs handshake and acknowledgement only", () => {
  const source = createShellDocument("channel-token");
  assert.match(source, /type: "handshake"/);
  assert.match(source, /type: "acknowledged"/);
  assert.doesNotMatch(source, /jsPsych\.run|import\(|archive/);
});
