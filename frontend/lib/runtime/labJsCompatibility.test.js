const test = require("node:test");
const assert = require("node:assert/strict");
const {
  GRAPHQL_INGEST_BUDGET_BYTES,
  aggregateLabJsRows,
  labJsGraphqlFinalPayload,
  neutralLabJsFinal,
  stampLabJsMetadata,
} = require("./labJsCompatibility");

test("LabJS row-embedded aggregates retain merge behavior", () => {
  const rows = [
    { trial: 1, aggregated: { score: 4, condition: "a" } },
    { trial: 2 },
    { trial: 3, aggregated: { score: 9, accuracy: 0.75 } },
  ];
  assert.deepEqual(aggregateLabJsRows(rows), {
    score: 9,
    condition: "a",
    accuracy: 0.75,
  });
  assert.deepEqual(neutralLabJsFinal(rows), {
    data: rows,
    aggregated: {
      score: 9,
      condition: "a",
      accuracy: 0.75,
    },
  });
});

test("LabJS GraphQL FINAL keeps rows under budget and drops only oversized trial arrays", () => {
  const rows = [
    { trial: 1, aggregated: { score: 4 } },
    { trial: 2, aggregated: { score: 9 } },
  ];
  assert.deepEqual(labJsGraphqlFinalPayload(rows), {
    data: rows,
    aggregated: { score: 9 },
  });

  const oversized = [
    {
      trial: 1,
      blob: "x".repeat(GRAPHQL_INGEST_BUDGET_BYTES),
      aggregated: { score: 12 },
    },
  ];
  const payload = labJsGraphqlFinalPayload(oversized);
  assert.deepEqual(payload.data, []);
  assert.deepEqual(payload.aggregated, { score: 12 });
});

test("LabJS adapter stamps server-derived associations over client metadata", () => {
  const stamped = stampLabJsMetadata(
    {
      datasetToken: "server-token",
      runtimeType: "LABJS",
      assetId: "template-1",
      assetVersion: "7",
      testVersion: "v2",
      studyVersion: "3",
      studyId: "study-1",
      templateId: "template-1",
      taskId: "task-1",
      participantType: "GUEST",
      participantPublicId: "guest-public",
    },
    {
      id: "attacker-token",
      study: "attacker-study",
      task: "attacker-task",
      type: "USER",
      publicId: "attacker",
      payload: "full",
    }
  );
  assert.equal(stamped.id, "server-token");
  assert.equal(stamped.study, "study-1");
  assert.equal(stamped.task, "task-1");
  assert.equal(stamped.type, "GUEST");
  assert.equal(stamped.publicId, "guest-public");
  assert.equal(stamped.payload, "full");
});
