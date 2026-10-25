const test = require("node:test");
const assert = require("node:assert/strict");
const {
  acceptSequence,
  assertRunClaimsMatchDataset,
  findTaskVersion,
  resolveRuntimeConfiguration,
  signRunClaims,
  validateParameterDefinitions,
  validateRunMessage,
  verifyRunToken,
} = require("./runtimeCore");

const authoredAsset = { id: "asset-1", version: "7", author: { id: "author" } };

test("defaults legacy Template tasks to LABJS", () => {
  const result = resolveRuntimeConfiguration({ template: authoredAsset });
  assert.equal(result.runtimeType, "LABJS");
  assert.equal(result.asset.id, "asset-1");
});

test("rejects missing and mismatched runtime assets", () => {
  assert.throws(
    () => resolveRuntimeConfiguration({ runtimeType: "P5", template: authoredAsset }),
    /requires exactly one visual/
  );
  assert.throws(
    () =>
      resolveRuntimeConfiguration({
        runtimeType: "LABJS",
        template: authoredAsset,
        visual: authoredAsset,
      }),
    /requires exactly one template/
  );
});

test("requires complete jsPsych package metadata", () => {
  assert.throws(
    () =>
      resolveRuntimeConfiguration({
        runtimeType: "JSPSYCH",
        jsPsychExperiment: authoredAsset,
      }),
    /archive, manifest, and entry point/
  );
  assert.throws(
    () =>
      resolveRuntimeConfiguration({
        runtimeType: "JSPSYCH",
        jsPsychExperiment: {
          ...authoredAsset,
          archive: { filename: "experiment.zip" },
          entryPoint: "index.html",
          manifest: { files: ["other.html"] },
        },
      }),
    /declared in manifest.files/
  );
});

test("a jsPsych run records the pinned row id; other runtimes keep their label", () => {
  const jsPsych = resolveRuntimeConfiguration({
    runtimeType: "JSPSYCH",
    jsPsychExperiment: {
      ...authoredAsset,
      archive: { filename: "experiment.zip" },
      entryPoint: "index.html",
      manifest: { files: ["index.html"] },
    },
  });
  assert.equal(jsPsych.assetVersion, "asset-1");
  assert.equal(
    resolveRuntimeConfiguration({ template: authoredAsset }).assetVersion,
    "7"
  );
});

test("parameter definitions follow the Template.parameters format", () => {
  assert.doesNotThrow(() => validateParameterDefinitions(undefined));
  assert.doesNotThrow(() =>
    validateParameterDefinitions([
      { name: "trials", type: "number", value: 20, help: "How many" },
      { name: "hand", type: "select", value: "left", options: ["left", "right"] },
    ])
  );
  assert.throws(() => validateParameterDefinitions({}), /list of definitions/);
  assert.throws(() => validateParameterDefinitions([{ type: "text" }]), /needs a name/);
  assert.throws(
    () => validateParameterDefinitions([{ name: "a" }, { name: "a" }]),
    /Duplicate parameter name: a/
  );
  assert.doesNotThrow(() =>
    validateParameterDefinitions([
      { name: "sections", type: "select", value: "Both", options: "Both\nFree play only" },
    ])
  );
  assert.throws(
    () => validateParameterDefinitions([{ name: "a", options: 3 }]),
    /options must be text or a list/
  );
});

test("signed run token cannot be altered to spoof associations", () => {
  const secret = "test-secret";
  const token = signRunClaims(
    { datasetId: "dataset-1", datasetToken: "dataset-token" },
    secret,
    100
  );
  assert.equal(verifyRunToken(token, secret, 101).datasetId, "dataset-1");
  const [payload, signature] = token.split(".");
  const spoofedPayload = Buffer.from(
    JSON.stringify({
      datasetId: "other-dataset",
      datasetToken: "dataset-token",
      profileId: "attacker",
      iat: 100,
      exp: 100000,
    })
  ).toString("base64url");
  assert.throws(
    () => verifyRunToken(`${spoofedPayload}.${signature}`, secret, 101),
    /Invalid run token/
  );
  assert.notEqual(payload, spoofedPayload);
  assert.throws(() => verifyRunToken("not-a-token", secret, 101), /Invalid/);
  assert.throws(
    () => verifyRunToken(`${payload}.${signature}`, secret, 100 + 13 * 60 * 60 * 1000),
    /Expired or incomplete/
  );
  const arrayPayload = Buffer.from("[]").toString("base64url");
  const arraySignature = require("crypto")
    .createHmac("sha256", secret)
    .update(arrayPayload)
    .digest("base64url");
  assert.throws(
    () => verifyRunToken(`${arrayPayload}.${arraySignature}`, secret, 101),
    /Invalid run token/
  );
});

test("signed run claims are bound to every server-derived association", () => {
  const claims = {
    datasetId: "dataset-1",
    datasetToken: "token-1",
    participantType: "USER",
    profileId: "profile-1",
    guestId: null,
    studyId: "study-1",
    taskId: "task-1",
    runtimeType: "LABJS",
    runtimeAssetId: "template-1",
  };
  const dataset = {
    id: "dataset-1",
    token: "token-1",
    type: "USER",
    profile: { id: "profile-1" },
    guest: null,
    study: { id: "study-1" },
    task: { id: "task-1" },
    runtimeType: "LABJS",
    runtimeAssetId: "template-1",
  };
  assert.doesNotThrow(() => assertRunClaimsMatchDataset(claims, dataset));
  assert.throws(
    () =>
      assertRunClaimsMatchDataset(
        { ...claims, studyId: "attacker-study" },
        dataset
      ),
    /does not match/
  );
});

test("sequence handling is monotonic and duplicate-safe", () => {
  assert.deepEqual(acceptSequence(0, 1), {
    accepted: true,
    duplicate: false,
    nextSequence: 1,
  });
  assert.equal(acceptSequence(1, 1).duplicate, true);
  assert.throws(() => acceptSequence(1, 3), /Expected sequence 2/);
});

test("runtime messages validate lifecycle payload shape and size", () => {
  assert.doesNotThrow(() =>
    validateRunMessage({
      messageType: "FINAL",
      data: [{ trial: 1 }],
      aggregated: { score: 1 },
    })
  );
  assert.throws(
    () => validateRunMessage({ messageType: "COMPLETE", data: [] }),
    /cannot include/
  );
  assert.doesNotThrow(() =>
    validateRunMessage({
      messageType: "COMPLETE",
      data: null,
      aggregated: null,
    })
  );
  assert.throws(
    () =>
      validateRunMessage({
        messageType: "FINAL",
        data: {},
        aggregated: [],
      }),
    /data must be an array/
  );
  assert.throws(
    () =>
      validateRunMessage({
        messageType: "FAILURE",
        error: "x".repeat(16 * 1024 + 1),
      }),
    /failure message is invalid/
  );
});

test("jsPsych manifest rejects traversal paths", () => {
  assert.throws(
    () =>
      resolveRuntimeConfiguration({
        runtimeType: "JSPSYCH",
        jsPsychExperiment: {
          ...authoredAsset,
          archive: { filename: "experiment.zip" },
          entryPoint: "../index.html",
          manifest: { files: ["../index.html"] },
        },
      }),
    /invalid archive paths/
  );
});

test("test version is derived from unchanged nested study flow", () => {
  const flow = [
    {
      type: "design",
      conditions: [
        { flow: [{ type: "my-node", componentID: "task-1", testId: "v2" }] },
      ],
    },
  ];
  assert.equal(findTaskVersion(flow, "task-1", "v2"), "v2");
  assert.throws(() => findTaskVersion(flow, "task-1", "v3"), /not part/);
});

test("asset tokens name one asset, expire, and are not run tokens", () => {
  const { signAssetToken, verifyAssetToken } = require("./runtimeCore");
  const secret = "test-secret";
  const token = signAssetToken("version-7", secret, 1000);
  assert.equal(verifyAssetToken(token, secret, 2000).assetId, "version-7");
  assert.throws(() => verifyAssetToken(token, "other", 2000), /Invalid asset token/);
  assert.throws(
    () => verifyAssetToken(token, secret, 1000 + 13 * 60 * 60 * 1000),
    /Expired/
  );
  const runToken = signRunClaims(
    { datasetId: "d", datasetToken: "t", assetId: "version-7" },
    secret,
    1000
  );
  assert.throws(() => verifyAssetToken(runToken, secret, 2000), /Invalid asset token/);
  assert.throws(() => verifyRunToken(token, secret, 2000));
});

test("an asset token says which runtime's route may use it", () => {
  const { signAssetToken, verifyAssetToken } = require("./runtimeCore");
  const token = signAssetToken("visual-1", "secret", 1000, "P5");
  assert.equal(verifyAssetToken(token, "secret", 2000).runtime, "P5");
  assert.equal(
    verifyAssetToken(signAssetToken("v", "secret", 1000), "secret", 2000).runtime,
    undefined
  );
});

test("a version update merges parameters by name", () => {
  const { mergeParameters } = require("./runtimeCore");
  const previous = [
    { name: "trials", type: "number", value: 10 },
    { name: "hand", type: "select", value: "left", options: ["left", "right"] },
    { name: "speed", type: "number", value: 1 },
    { name: "label", type: "text", value: "A" },
  ];
  const next = [
    { name: "trials", type: "number", value: 20 },
    { name: "hand", type: "select", value: "left", options: ["left", "right", "both"] },
    { name: "label", type: "textarea", value: "B" },
    { name: "feedback", type: "select", value: "on", options: ["on", "off"] },
  ];
  const current = [
    { name: "trials", type: "number", value: 40 },
    { name: "hand", type: "select", value: "right", options: ["left", "right"] },
    { name: "speed", type: "number", value: 2 },
    { name: "label", type: "text", value: "mine" },
  ];
  const merged = mergeParameters(current, previous, next);
  assert.deepEqual(
    merged.parameters.map((p) => [p.name, p.value]),
    [["trials", 40], ["hand", "left"], ["label", "B"], ["feedback", "on"]]
  );
  assert.deepEqual(merged.added, ["feedback"]);
  assert.deepEqual(merged.removed, ["speed"]);
  assert.deepEqual(merged.reset, ["hand", "label"]);
  assert.deepEqual(merged.parameters[1].options, ["left", "right", "both"]);
});

test("a task on the old defaults is merged against those defaults", () => {
  const { mergeParameters } = require("./runtimeCore");
  const previous = [{ name: "trials", type: "number", value: 10 }];
  const next = [{ name: "trials", type: "number", value: 20 }];
  const merged = mergeParameters(null, previous, next);
  assert.deepEqual(merged.parameters, [{ name: "trials", type: "number", value: 10 }]);
  assert.deepEqual([merged.added, merged.removed, merged.reset], [[], [], []]);
});

test("a study flow uses a task directly or inside a condition", () => {
  const { studyFlowUsesTask } = require("./runtimeCore");
  const flow = [
    { type: "my-anchor" },
    { type: "my-node", componentID: "a" },
    { type: "my-condition", conditions: [{ flow: [{ type: "my-node", componentID: "b" }] }] },
  ];
  assert.equal(studyFlowUsesTask(flow, "a"), true);
  assert.equal(studyFlowUsesTask(flow, "b"), true);
  assert.equal(studyFlowUsesTask(JSON.stringify(flow), "b"), true);
  assert.equal(studyFlowUsesTask(flow, "c"), false);
  assert.equal(studyFlowUsesTask("not json", "a"), false);
});
