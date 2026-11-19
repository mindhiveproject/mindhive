const test = require("node:test");
const assert = require("node:assert/strict");
const {
  loadDatasourceStudyRows,
  shapeSummaryRow,
} = require("./datasourceStudyRows");

// `readable` is what the caller's own Datasource read returns (null when the
// dataset read rule hides it); sudo reads return the study and its results.
function fakeContext({
  readable,
  study,
  summaries = [],
  profiles = [],
  signedIn = true,
}) {
  const calls = { summaryWhere: null, summaryQuery: null, profileWhere: null };
  return {
    calls,
    session: signedIn ? { itemId: "viewer" } : undefined,
    prisma: {
      profile: {
        findMany: async ({ where }) => {
          calls.profileWhere = where;
          return profiles.filter((p) => where.id.in.includes(p.id));
        },
      },
    },
    query: {
      Datasource: { findOne: async () => readable },
    },
    sudo: () => ({
      query: {
        Study: { findOne: async () => study },
        SummaryResult: {
          findMany: async ({ where, query }) => {
            calls.summaryWhere = where;
            calls.summaryQuery = query;
            return summaries;
          },
        },
      },
    }),
  };
}

const study = {
  id: "st1",
  flow: [{ type: "my-node", testId: "t1" }],
  datasets: [{ token: "run-1" }],
  dataSourceRecords: [
    { profile: { publicId: "p-1" }, guest: null, steps: [{ stepId: "n1" }] },
  ],
};

const summary = {
  metadataId: "run-1",
  testVersion: "t1",
  type: "USER",
  data: { rt: 420 },
  user: {
    id: "internal-profile-id",
    publicId: "p-1",
    publicReadableId: "brave-otter",
    studiesInfo: { st1: { consent: "yes" } },
    studentIn: [{ code: "CLASS1", id: "class-internal" }],
  },
  guest: null,
  task: { title: "Stroop" },
};

test("no rows for anonymous callers", async () => {
  const context = fakeContext({ signedIn: false, readable: {}, study });
  assert.equal(await loadDatasourceStudyRows(context, "ds1"), null);
});

test("no rows when the dataset read rule hides the dataset", async () => {
  const context = fakeContext({ readable: null, study });
  assert.equal(await loadDatasourceStudyRows(context, "ds1"), null);
});

test("no rows for datasets that do not read a study", async () => {
  const uploaded = { id: "ds1", dataOrigin: "UPLOADED", study: { id: "st1" } };
  assert.equal(
    await loadDatasourceStudyRows(fakeContext({ readable: uploaded, study }), "ds1"),
    null
  );
  const noStudy = { id: "ds1", dataOrigin: "STUDY", study: null };
  assert.equal(
    await loadDatasourceStudyRows(fakeContext({ readable: noStudy, study }), "ds1"),
    null
  );
});

test("a readable study dataset returns included rows only", async () => {
  const context = fakeContext({
    readable: { id: "ds1", dataOrigin: "STUDY", study: { id: "st1" } },
    study,
    summaries: [summary],
  });
  const rows = await loadDatasourceStudyRows(context, "ds1");
  assert.deepEqual(context.calls.summaryWhere, {
    study: { id: { equals: "st1" } },
    metadataId: { in: ["run-1"] },
  });
  assert.equal(rows.includedCount, 1);
  assert.equal(rows.summaryResults.length, 1);
  assert.deepEqual(rows.flow, study.flow);
  assert.deepEqual(rows.dataSourceRecords, [
    { profile: { publicId: "p-1" }, guest: null, steps: [{ stepId: "n1" }] },
  ]);
});

test("nothing is read when no run is included", async () => {
  const context = fakeContext({
    readable: { id: "ds1", dataOrigin: "TEMPLATE", study: { id: "st1" } },
    study: { ...study, datasets: [] },
  });
  const rows = await loadDatasourceStudyRows(context, "ds1");
  assert.equal(rows.includedCount, 0);
  assert.deepEqual(rows.summaryResults, []);
  assert.equal(context.calls.summaryWhere, null);
});

test("rows carry public ids only, no internal ids or participant info", () => {
  const row = shapeSummaryRow(summary);
  assert.deepEqual(row, {
    metadataId: "run-1",
    testVersion: "t1",
    type: "USER",
    user: {
      publicId: "p-1",
      publicReadableId: "brave-otter",
      studentIn: [{ code: "CLASS1" }],
    },
    guest: null,
    task: { title: "Stroop" },
    data: { rt: 420 },
  });
  const text = JSON.stringify(row);
  assert.ok(!text.includes("internal-profile-id"));
  assert.ok(!text.includes("consent"));
  assert.ok(!text.includes("class-internal"));
});

test("class codes are looked up once for all participants, not per row", async () => {
  const { studentIn, ...userWithoutClasses } = summary.user;
  const other = {
    ...summary,
    metadataId: "run-1",
    user: { ...userWithoutClasses, id: "other-profile", publicId: "p-2" },
  };
  const context = fakeContext({
    readable: { id: "ds1", dataOrigin: "STUDY", study: { id: "st1" } },
    study,
    summaries: [{ ...summary, user: userWithoutClasses }, other, { ...other }],
    profiles: [
      { id: "internal-profile-id", studentIn: [{ code: "CLASS1" }] },
      { id: "other-profile", studentIn: [] },
    ],
  });
  const rows = await loadDatasourceStudyRows(context, "ds1");
  assert.ok(!/studentIn/.test(context.calls.summaryQuery));
  assert.deepEqual(context.calls.profileWhere, {
    id: { in: ["internal-profile-id", "other-profile"] },
  });
  assert.deepEqual(
    rows.summaryResults.map((r) => r.user.studentIn),
    [[{ code: "CLASS1" }], [], []]
  );
  assert.ok(!JSON.stringify(rows).includes("internal-profile-id"));
});
