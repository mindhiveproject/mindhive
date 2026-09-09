const test = require("node:test");
const assert = require("node:assert/strict");
const {
  acceptSequence,
  assertRunClaimsMatchDataset,
  findTaskVersion,
  resolveRuntimeConfiguration,
  signRunClaims,
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
