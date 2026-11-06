const test = require("node:test");
const assert = require("node:assert/strict");
const { studyGateWhere, loadStudyCollectData } = require("./studyCollect");

// A context whose study gate matches `allowed` and whose reads return fixtures.
function fakeContext({ allowed = true, profiles = [], guests = [], datasets = [] }) {
  const calls = { studyCount: [], profiles: [], guests: [], datasets: [] };
  const sudo = {
    db: {
      Study: {
        count: async (args) => {
          calls.studyCount.push(args);
          return allowed ? 1 : 0;
        },
      },
    },
    query: {
      Profile: {
        findMany: async (args) => {
          calls.profiles.push(args);
          return profiles;
        },
      },
      Guest: {
        findMany: async (args) => {
          calls.guests.push(args);
          return guests;
        },
      },
    },
  };
  return {
    calls,
    sudo: () => sudo,
    prisma: {
      dataset: {
        findMany: async (args) => {
          calls.datasets.push(args);
          return datasets;
        },
      },
    },
  };
}

test("the gate is closed without a session filter or a study id", () => {
  assert.equal(studyGateWhere("study-1", false), null);
  assert.equal(studyGateWhere("", true), null);
});

test("admins are gated on the study id only; others also on the edit filter", () => {
  assert.deepEqual(studyGateWhere("study-1", true), {
    id: { equals: "study-1" },
  });
  const editFilter = { OR: [{ author: { id: { equals: "me" } } }] };
  assert.deepEqual(studyGateWhere("study-1", editFilter), {
    AND: [{ id: { equals: "study-1" } }, editFilter],
  });
});

test("signed-out viewers are refused without touching the database", async () => {
  const context = fakeContext({});
  await assert.rejects(loadStudyCollectData(context, "study-1", false));
  assert.equal(context.calls.studyCount.length, 0);
  assert.equal(context.calls.profiles.length, 0);
});

test("viewers who cannot edit the study read nothing", async () => {
  const context = fakeContext({ allowed: false });
  await assert.rejects(
    loadStudyCollectData(context, "study-1", { OR: [] }),
    /do not have access/
  );
  assert.equal(context.calls.profiles.length, 0);
  assert.equal(context.calls.guests.length, 0);
  assert.equal(context.calls.datasets.length, 0);
});

test("one read per list, with datasets attached to their participant", async () => {
  const context = fakeContext({
    profiles: [
      {
        id: "p1",
        publicId: "pub-p1",
        type: "STUDENT",
        generalInfo: { "consent-c1": "agree" },
        studiesInfo: { "study-1": { info: { path: [1] } }, other: { x: 1 } },
      },
      { id: "p2", publicId: "pub-p2", studiesInfo: null },
    ],
    guests: [{ id: "g1", publicId: "pub-g1", studiesInfo: {} }],
    datasets: [
      { id: "d1", token: "t1", isCompleted: true, studyId: "study-1", profileId: "p1" },
      { id: "d2", token: "t2", isCompleted: false, studyId: "study-1", profileId: "p1" },
      { id: "d3", token: "t3", isCompleted: true, studyId: "study-1", guestId: "g1" },
    ],
  });
  const result = await loadStudyCollectData(context, "study-1", true);

  assert.equal(context.calls.profiles.length, 1);
  assert.equal(context.calls.guests.length, 1);
  assert.deepEqual(context.calls.datasets[0].where, { studyId: "study-1" });

  const [p1, p2] = result.participants;
  assert.deepEqual(
    p1.datasets.map((d) => [d.token, d.isCompleted, d.study.id]),
    [
      ["t1", true, "study-1"],
      ["t2", false, "study-1"],
    ]
  );
  // only this study's entry of studiesInfo leaves the server
  assert.deepEqual(p1.studiesInfo, { "study-1": { info: { path: [1] } } });
  assert.deepEqual(p1.generalInfo, { "consent-c1": "agree" });
  assert.deepEqual(p2.datasets, []);
  assert.deepEqual(p2.studiesInfo, {});
  assert.deepEqual(
    result.guests[0].datasets.map((d) => d.token),
    ["t3"]
  );
});
