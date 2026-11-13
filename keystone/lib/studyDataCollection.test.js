const test = require("node:test");
const assert = require("node:assert/strict");
const {
  summarizeStudy,
  planAction,
  buildWrites,
  changedStudyMilestoneStatuses,
  carryOverStage,
  turnOffImpact,
} = require("./studyDataCollection");

const person = (id) => ({ id, username: id });
const klass = { id: "c1", title: "PSY", creator: person("teacher"), teachingTeam: [person("co")], mentors: [person("mentor")] };
const MILESTONE = { id: "m1", key: "data_collection", logEventName: "STUDY_SUBMITTED_FOR_DATA_COLLECTION" };

function board(id, author, overrides = {}) {
  return {
    id,
    title: `Board ${id}`,
    usedInClass: klass,
    author: person(author),
    collaborators: [],
    milestoneStatus: { proposal: { status: "SUBMITTED", openForComments: true } },
    milestone: MILESTONE,
    ...overrides,
  };
}

function study(overrides = {}) {
  return {
    id: "s1",
    status: "WORKING",
    dataCollectionStatus: "IN_PROGRESS",
    dataCollectionOpenForParticipation: false,
    author: person("maya"),
    collaborators: [person("jonah"), person("mentor")],
    classes: [],
    ...overrides,
  };
}

const summarize = (callerId, s = study(), boards = [board("b1", "maya"), board("b2", "jonah")]) =>
  summarizeStudy({ study: s, boards, callerId, callerIsAdmin: false, callerCanEdit: ["maya", "jonah"].includes(callerId) });

test("a study with a class board resolving a study milestone is supervised", () => {
  assert.equal(summarize("maya").supervised, true);
  const noClass = [board("b1", "maya", { usedInClass: null })];
  assert.equal(summarize("maya", study(), noClass).supervised, false);
  const noMilestone = [board("b1", "maya", { milestone: null })];
  assert.equal(summarize("maya", study(), noMilestone).supervised, false);
});

test("people sharing the study exclude the class staff", () => {
  const ids = summarize("maya").people.map((p) => p.id).sort();
  assert.deepEqual(ids, ["jonah", "maya"]);
});

test("teachers and the teaching team manage; mentors and students do not", () => {
  assert.equal(summarize("teacher").canManage, true);
  assert.equal(summarize("co").canManage, true);
  assert.equal(summarize("mentor").canManage, false);
  assert.equal(summarize("maya").canManage, false);
});

test("a student must acknowledge every other collaborator to submit", () => {
  const summary = summarize("maya");
  assert.ok(planAction(summary, { action: "SUBMIT", callerId: "maya", confirmed: true, acknowledgedProfileIds: [] }).error);
  const plan = planAction(summary, { action: "SUBMIT", callerId: "maya", confirmed: true, acknowledgedProfileIds: ["jonah"] });
  assert.deepEqual(plan, { stage: "COLLECTING", open: true });
});

test("a teacher submits without acknowledgements", () => {
  const plan = planAction(summarize("teacher"), { action: "SUBMIT", callerId: "teacher", confirmed: true });
  assert.equal(plan.stage, "COLLECTING");
});

test("only teachers reopen or resume", () => {
  const collecting = study({ dataCollectionStatus: "SUBMITTED" });
  assert.ok(planAction(summarize("maya", collecting), { action: "REOPEN", callerId: "maya" }).error);
  assert.equal(planAction(summarize("teacher", collecting), { action: "REOPEN", callerId: "teacher" }).stage, "DESIGNING");
  const finished = study({ dataCollectionStatus: "FINISHED" });
  assert.ok(planAction(summarize("maya", finished), { action: "RESUME", callerId: "maya" }).error);
  assert.equal(planAction(summarize("teacher", finished), { action: "RESUME", callerId: "teacher" }).stage, "COLLECTING");
});

test("students finish a collecting study and toggle participation only while collecting", () => {
  const collecting = study({ dataCollectionStatus: "SUBMITTED" });
  assert.equal(planAction(summarize("maya", collecting), { action: "FINISH", callerId: "maya", confirmed: true }).stage, "FINISHED");
  assert.deepEqual(
    planAction(summarize("maya", collecting), { action: "SET_PARTICIPATION", open: false, callerId: "maya" }),
    { stage: "COLLECTING", open: false }
  );
  assert.ok(planAction(summarize("maya"), { action: "SET_PARTICIPATION", open: true, callerId: "maya" }).error);
});

test("a self-managed study sets its label and participation, never submits", () => {
  const boards = [];
  const summary = summarizeStudy({ study: study({ dataCollectionStatus: "NOT_STARTED" }), boards, callerId: "maya", callerIsAdmin: false, callerCanEdit: true });
  assert.equal(summary.supervised, false);
  assert.ok(planAction(summary, { action: "SUBMIT", callerId: "maya" }).error);
  const plan = planAction(summary, { action: "SET_LABEL", stage: "COLLECTING", callerId: "maya" });
  const writes = buildWrites({ summary, plan, action: "SET_LABEL", boards, caller: person("maya"), now: "t" });
  assert.deepEqual(writes, { study: { status: "COLLECTING_DATA" }, boards: [] });
  const open = planAction(summary, { action: "SET_PARTICIPATION", open: true, callerId: "maya" });
  assert.deepEqual(
    buildWrites({ summary, plan: open, action: "SET_PARTICIPATION", boards, caller: person("maya"), now: "t" }).study,
    { dataCollectionOpenForParticipation: true }
  );
});

test("submitting updates the study and every linked board's milestone", () => {
  const boards = [board("b1", "maya"), board("b2", "jonah")];
  const summary = summarize("maya", study(), boards);
  const plan = planAction(summary, { action: "SUBMIT", callerId: "maya", confirmed: true, acknowledgedProfileIds: ["jonah"] });
  const writes = buildWrites({ summary, plan, action: "SUBMIT", boards, caller: person("maya"), now: "2026-11-12" });
  assert.deepEqual(writes.study, {
    dataCollectionStatus: "SUBMITTED",
    dataCollectionOpenForParticipation: true,
    status: "COLLECTING_DATA",
    dataCollectionData: "REAL_DATA",
  });
  assert.equal(writes.boards.length, 2);
  for (const b of writes.boards) {
    assert.deepEqual(b.milestoneStatus.data_collection, {
      status: "SUBMITTED",
      openForParticipation: true,
      submittedBy: { id: "maya", username: "maya" },
      submittedAt: "2026-11-12",
    });
    // Other milestones are kept.
    assert.deepEqual(b.milestoneStatus.proposal, { status: "SUBMITTED", openForComments: true });
  }
});

test("reopening clears who submitted; toggling participation keeps it", () => {
  const submitted = { data_collection: { status: "SUBMITTED", openForParticipation: true, submittedBy: person("maya"), submittedAt: "t" } };
  const boards = [board("b1", "maya", { milestoneStatus: submitted })];
  const s = study({ dataCollectionStatus: "SUBMITTED" });
  const teacher = summarize("teacher", s, boards);
  const reopen = buildWrites({ summary: teacher, plan: { stage: "DESIGNING", open: false }, action: "REOPEN", boards, caller: person("teacher"), now: "t2" });
  assert.deepEqual(reopen.boards[0].milestoneStatus.data_collection, { status: "IN_PROGRESS", openForParticipation: false });
  const toggle = buildWrites({ summary: teacher, plan: { stage: "COLLECTING", open: false }, action: "SET_PARTICIPATION", boards, caller: person("maya"), now: "t2" });
  assert.equal(toggle.boards[0].milestoneStatus.data_collection.submittedBy.id, "maya");
  assert.equal(teacher.submittedBy, "maya");
});

test("the board guard spots changed study milestone statuses only", () => {
  const before = { proposal: { status: "IN_PROGRESS", openForComments: false }, dc: { status: "IN_PROGRESS", openForParticipation: false } };
  assert.deepEqual(changedStudyMilestoneStatuses(before, { ...before, proposal: { status: "SUBMITTED", openForComments: true } }), []);
  assert.deepEqual(changedStudyMilestoneStatuses(before, { ...before, dc: { status: "SUBMITTED", openForParticipation: true } }), ["dc"]);
  assert.deepEqual(changedStudyMilestoneStatuses(JSON.stringify(before), { ...before, dc: { status: "IN_PROGRESS", openForParticipation: true } }), []);
  assert.deepEqual(changedStudyMilestoneStatuses(null, { dc: { status: "SUBMITTED", openForParticipation: true } }), ["dc"]);
});

test("submitting and finishing need the confirmation, from students and teachers", () => {
  const { planAction: plan } = require("./studyDataCollection");
  assert.ok(plan(summarize("teacher"), { action: "SUBMIT", callerId: "teacher" }).error);
  assert.equal(plan(summarize("teacher"), { action: "SUBMIT", callerId: "teacher", confirmed: true }).stage, "COLLECTING");
  const collecting = study({ dataCollectionStatus: "SUBMITTED" });
  assert.ok(plan(summarize("maya", collecting), { action: "FINISH", callerId: "maya" }).error);
  assert.equal(plan(summarize("maya", collecting), { action: "FINISH", callerId: "maya", confirmed: true }).stage, "FINISHED");
});

test("the log records who, when, what was confirmed and who it was shared with", () => {
  const { logContent, summarizeHistory } = require("./studyDataCollection");
  const boards = [board("b1", "maya"), board("b2", "jonah")];
  const summary = summarize("maya", study(), boards);
  const content = logContent({
    action: "SUBMIT", plan: { stage: "COLLECTING", open: true }, summary,
    caller: person("maya"), now: "2026-11-12T10:00:00.000Z", confirmed: true,
    acknowledgedProfileIds: ["jonah"], boards,
  });
  assert.deepEqual(content.by, { id: "maya", username: "maya" });
  assert.equal(content.at, "2026-11-12T10:00:00.000Z");
  assert.equal(content.confirmed, true);
  assert.deepEqual(content.sharedWith, ["jonah"]);
  assert.deepEqual(content.acknowledged, ["jonah"]);
  // One decision logged on two boards reads as one history entry.
  const logs = [
    { event: "STUDY_SUBMITTED_FOR_DATA_COLLECTION", content, createdAt: "2026-11-12T10:00:00.100Z" },
    { event: "STUDY_SUBMITTED_FOR_DATA_COLLECTION", content: JSON.stringify(content), createdAt: "2026-11-12T10:00:00.200Z" },
    { event: "STUDY_DATA_COLLECTION_REOPENED", content: { action: "REOPEN", by: person("teacher"), at: "2026-11-13T09:00:00.000Z" }, createdAt: "2026-11-13T09:00:00.000Z" },
  ];
  const history = summarizeHistory(logs);
  assert.equal(history.length, 2);
  assert.equal(history[0].action, "REOPEN");
  assert.equal(history[1].by, "maya");
  assert.equal(history[1].confirmed, true);
});

test("older submission logs without content still show who and when", () => {
  const { summarizeHistory } = require("./studyDataCollection");
  const history = summarizeHistory([
    { event: "STUDY_SUBMITTED_FOR_DATA_COLLECTION", content: { proposalSnapshot: "No cards submitted" }, createdAt: "2026-10-01T08:00:00.000Z", user: { username: "lea" } },
  ]);
  assert.deepEqual(history[0], { action: "SUBMIT", by: "lea", at: "2026-10-01T08:00:00.000Z", open: null, stage: null, confirmed: false, sharedWith: [], carriedOver: false });
});

test("a class that follows data collection supervises its studies without a board", () => {
  const following = { ...klass, settings: { dataCollectionMilestone: true } };
  const s = study({ classes: [following] });
  const summary = summarizeStudy({ study: s, boards: [], callerId: "maya", callerIsAdmin: false, callerCanEdit: true });
  assert.equal(summary.supervised, true);
  assert.deepEqual(summary.classes, [{ id: "c1", title: "PSY", supervising: true }]);
  // Peers to acknowledge come from the study itself.
  assert.deepEqual(summary.people.map((p) => p.id).sort(), ["jonah", "maya"]);
  const teacher = summarizeStudy({ study: s, boards: [], callerId: "teacher", callerIsAdmin: false, callerCanEdit: false });
  assert.equal(teacher.canManage, true);
  // Off: self-managed again.
  const off = summarizeStudy({ study: study({ classes: [{ ...klass, settings: { dataCollectionMilestone: false } }] }), boards: [], callerId: "maya", callerIsAdmin: false, callerCanEdit: true });
  assert.equal(off.supervised, false);
});

test("board and class supervision are interchangeable: the stage stays on the study", () => {
  const following = { ...klass, settings: JSON.stringify({ dataCollectionMilestone: true }) };
  const s = study({ classes: [following], dataCollectionStatus: "SUBMITTED", status: "COLLECTING_DATA" });
  const byClass = summarizeStudy({ study: s, boards: [], callerId: "maya", callerIsAdmin: false, callerCanEdit: true });
  const byBoard = summarizeStudy({ study: { ...s, classes: [klass] }, boards: [board("b1", "maya", { milestoneStatus: {} })], callerId: "maya", callerIsAdmin: false, callerCanEdit: true });
  assert.equal(byClass.stage, "COLLECTING");
  assert.equal(byBoard.stage, "COLLECTING");
});

test("carry-over stage reads the students' label, never a locked study", () => {
  assert.equal(carryOverStage({ status: "COLLECTING_DATA", dataCollectionStatus: "IN_PROGRESS" }), "COLLECTING");
  assert.equal(carryOverStage({ status: "DATA_COLLECTION_IS_COMPLETED", dataCollectionStatus: null }), "FINISHED");
  assert.equal(carryOverStage({ status: "WORKING" }), null);
  assert.equal(carryOverStage({ status: "COLLECTING_DATA", dataCollectionStatus: "SUBMITTED" }), null);
});

test("turning a class milestone off: kept, left locked, or self-managed", () => {
  const thisClass = { id: "c1", settings: { dataCollectionMilestone: true } };
  const other = { id: "c2", settings: { dataCollectionMilestone: true } };
  const impact = turnOffImpact(
    [
      { dataCollectionStatus: "IN_PROGRESS", classes: [thisClass], boardSupervised: true },
      { dataCollectionStatus: "SUBMITTED", classes: [thisClass, other] },
      { dataCollectionStatus: "SUBMITTED", classes: [thisClass] },
      { dataCollectionStatus: "FINISHED", classes: [thisClass] },
      { dataCollectionStatus: "IN_PROGRESS", classes: [thisClass] },
      { dataCollectionStatus: null, classes: [thisClass] },
    ],
    "c1"
  );
  assert.deepEqual(impact, { keep: 2, staysLocked: 2, selfManaged: 2 });
});
