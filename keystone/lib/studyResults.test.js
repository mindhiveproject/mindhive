const test = require("node:test");
const assert = require("node:assert/strict");
const { loadStudyResults } = require("./studyResults");

// A context whose study gate matches `allowed` and whose Prisma reads return
// fixtures (JSON fields as text, as SQLite returns them).
function fakeContext({ allowed = true, study = null, datasets = [], summaries = [], records = [] }) {
  const calls = { studyCount: 0, reads: 0 };
  const read = (rows) => async () => {
    calls.reads += 1;
    return rows;
  };
  return {
    calls,
    sudo: () => ({
      db: {
        Study: {
          count: async () => {
            calls.studyCount += 1;
            return allowed ? 1 : 0;
          },
        },
      },
    }),
    prisma: {
      study: { findUnique: read(study) },
      dataset: { findMany: read(datasets) },
      summaryResult: { findMany: read(summaries) },
      studyDataSourceRecord: { findMany: read(records) },
    },
  };
}

const STUDY = {
  id: "study-1",
  slug: "my-study",
  title: "My study",
  flow: '[{"type":"my-node","testId":"t1"}]',
  versionHistory: null,
  consent: [{ id: "c1", title: "Consent" }],
  versions: [{ id: "v1", name: "Version 1", legacyId: "" }],
};

test("refuses without a session filter, before reading any results", async () => {
  const context = fakeContext({ study: STUDY });
  await assert.rejects(loadStudyResults(context, "study-1", false));
  assert.equal(context.calls.reads, 0);
});

test("refuses when the viewer may not edit the study", async () => {
  const context = fakeContext({ allowed: false, study: STUDY });
  await assert.rejects(loadStudyResults(context, "study-1", { OR: [] }));
  assert.equal(context.calls.reads, 0);
});

test("returns the GET_STUDY_RESULTS shape with JSON fields parsed", async () => {
  const createdAt = new Date("2026-11-01T10:00:00Z");
  const context = fakeContext({
    study: STUDY,
    datasets: [
      {
        date: "2026-11-01",
        token: "tok",
        isCompleted: 1,
        isIncluded: 0,
        testVersion: "",
        dataPolicy: "science",
        task: { id: "t1", slug: "task" },
      },
    ],
    summaries: [
      {
        data: '{"score":3}',
        testVersion: "",
        metadataId: "m1",
        createdAt,
        user: null,
        guest: { publicId: "g1" },
        task: { id: "t1", slug: "task", title: "Task" },
      },
    ],
    records: [{ steps: "[]", profile: { publicId: "p1" }, guest: null }],
  });

  const result = await loadStudyResults(context, "study-1", true);

  assert.deepEqual(result.flow, [{ type: "my-node", testId: "t1" }]);
  assert.equal(result.datasets[0].isCompleted, true);
  assert.equal(result.datasets[0].isIncluded, false);
  assert.deepEqual(result.summaryResults[0], {
    data: { score: 3 },
    user: null,
    guest: { publicId: "g1" },
    study: { title: "My study" },
    task: { id: "t1", slug: "task", title: "Task" },
    testVersion: "",
    metadataId: "m1",
    createdAt: "2026-11-01T10:00:00.000Z",
  });
  assert.deepEqual(result.dataSourceRecords, [
    { profile: { publicId: "p1" }, guest: null, steps: [] },
  ]);
  assert.deepEqual(result.consent, STUDY.consent);
  assert.deepEqual(result.versions, STUDY.versions);
  assert.equal(result.versionHistory, null);
});
