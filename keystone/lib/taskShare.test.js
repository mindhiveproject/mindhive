const test = require("node:test");
const assert = require("node:assert/strict");
const {
  sharingRights,
  checkShareRequest,
  isInviteRecipient,
  inviteStateFor,
  sharedCopySettings,
  pickableMemberIds,
} = require("./taskShare");

const p = (id) => ({ id });
const klass = (settings) => ({
  id: "c1",
  creator: p("teacher"),
  teachingTeam: [p("coteacher")],
  mentors: [p("mentor")],
  students: [p("s1"), p("s2"), p("s3")],
  settings,
});
const task = (author, collaborators = []) => ({
  id: "t1",
  author: p(author),
  collaborators: collaborators.map(p),
});

test("creator, teaching team and mentors share with the whole class", () => {
  for (const id of ["teacher", "coteacher", "mentor"]) {
    assert.deepEqual(sharingRights(klass(), id), {
      role: "staff",
      canShare: true,
      canShareWithClass: true,
    });
  }
});

test("students share with people only, and only when the class allows it", () => {
  assert.deepEqual(sharingRights(klass(), "s1"), {
    role: "student",
    canShare: true,
    canShareWithClass: false,
  });
  assert.equal(
    sharingRights(klass({ allowStudentTaskSharing: false }), "s1").canShare,
    false
  );
  // SQLite hands json over as a string
  assert.equal(
    sharingRights(klass('{"allowStudentTaskSharing":false}'), "s1").canShare,
    false
  );
  assert.equal(sharingRights(klass(), "stranger").canShare, false);
});

test("only an owned task can be shared", () => {
  const base = { klass: klass(), wholeClass: false, recipientIds: ["s2"] };
  assert.equal(
    checkShareRequest({ ...base, task: task("s1"), userId: "s1" }),
    null
  );
  assert.equal(
    checkShareRequest({ ...base, task: task("x", ["s1"]), userId: "s1" }),
    null
  );
  assert.match(
    checkShareRequest({ ...base, task: task("x"), userId: "s1" }),
    /only share tasks/
  );
});

test("a student can share with classmates and staff, not the whole class", () => {
  const args = { task: task("s1"), klass: klass(), userId: "s1" };
  assert.equal(
    checkShareRequest({ ...args, recipientIds: ["s2", "teacher", "mentor"] }),
    null
  );
  assert.match(
    checkShareRequest({ ...args, wholeClass: true }),
    /whole class/
  );
  assert.match(
    checkShareRequest({ ...args, recipientIds: ["outsider"] }),
    /must be in this class/
  );
  assert.match(checkShareRequest({ ...args, recipientIds: [] }), /at least one/);
  assert.match(
    checkShareRequest({
      ...args,
      klass: klass({ allowStudentTaskSharing: false }),
      recipientIds: ["s2"],
    }),
    /turned off/
  );
});

test("you cannot pick yourself", () => {
  assert.ok(!pickableMemberIds(klass(), "s1").includes("s1"));
  assert.match(
    checkShareRequest({
      task: task("s1"),
      klass: klass(),
      userId: "s1",
      recipientIds: ["s1"],
    }),
    /must be in this class/
  );
});

test("a whole-class invite reaches the students in the class now", () => {
  const invite = { sender: p("teacher"), wholeClass: true, recipients: [] };
  assert.equal(isInviteRecipient(invite, klass(), "s3"), true);
  assert.equal(isInviteRecipient(invite, klass(), "teacher"), false);
  assert.equal(isInviteRecipient(invite, klass(), "mentor"), false);
  const left = { ...klass(), students: [p("s1")] };
  assert.equal(isInviteRecipient(invite, left, "s3"), false);
});

test("a chosen recipient who left the class no longer gets it", () => {
  const invite = { sender: p("s1"), wholeClass: false, recipients: [p("s2")] };
  assert.equal(isInviteRecipient(invite, klass(), "s2"), true);
  assert.equal(isInviteRecipient(invite, klass(), "s3"), false);
  const left = { ...klass(), students: [p("s1")] };
  assert.equal(isInviteRecipient(invite, left, "s2"), false);
});

test("invite state for the viewer", () => {
  const invite = {
    sender: p("teacher"),
    task: p("t1"),
    status: "active",
    acceptedBy: [p("s1")],
    declinedBy: [p("s2")],
  };
  assert.equal(inviteStateFor(invite, "teacher"), "sent");
  assert.equal(inviteStateFor(invite, "s1"), "accepted");
  assert.equal(inviteStateFor(invite, "s2"), "declined");
  assert.equal(inviteStateFor(invite, "s3"), "pending");
  assert.equal(inviteStateFor({ ...invite, status: "withdrawn" }, "s3"), "closed");
  assert.equal(inviteStateFor({ ...invite, task: null }, "s3"), "closed");
  // an accepted copy stays the recipient's whatever happens to the invite
  assert.equal(
    inviteStateFor({ ...invite, status: "withdrawn", task: null }, "s1"),
    "accepted"
  );
});

test("a shared copy records its parent in settings", () => {
  assert.deepEqual(
    sharedCopySettings('{"addInfo":"x","sharedFrom":{"taskId":"old"}}', {
      taskId: "t1",
      inviteId: "i1",
      sharedById: "teacher",
    }),
    {
      addInfo: "x",
      sharedFrom: { taskId: "t1", inviteId: "i1", sharedById: "teacher" },
    }
  );
  assert.deepEqual(
    sharedCopySettings(null, { taskId: "t1", inviteId: "i1", sharedById: "u" }),
    { sharedFrom: { taskId: "t1", inviteId: "i1", sharedById: "u" } }
  );
});
