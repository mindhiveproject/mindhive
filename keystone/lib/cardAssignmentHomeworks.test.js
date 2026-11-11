const test = require("node:test");
const assert = require("node:assert/strict");
const { loadCardAssignmentHomeworks } = require("./cardAssignmentHomeworks");

function fakeContext({ session = { itemId: "me" }, rows = [] } = {}) {
  const calls = [];
  return {
    calls,
    session,
    db: {
      Homework: {
        findMany: async (args) => {
          calls.push(args);
          return rows;
        },
      },
    },
  };
}

test("signed out, or nothing to look up: no read", async () => {
  const signedOut = fakeContext({ session: null });
  assert.deepEqual(await loadCardAssignmentHomeworks(signedOut, ["a1"], ["u1"]), []);
  const empty = fakeContext();
  assert.deepEqual(await loadCardAssignmentHomeworks(empty, [], ["u1"]), []);
  assert.deepEqual(await loadCardAssignmentHomeworks(empty, ["a1"], []), []);
  assert.equal(signedOut.calls.length + empty.calls.length, 0);
});

test("reads once through context.db (Homework's read filter) with deduped ids", async () => {
  const context = fakeContext({
    rows: [
      { id: "h1", settings: '{"status":"Completed"}', assignmentId: "a1", authorId: "u1" },
      { id: "h2", settings: { status: "Started" }, assignmentId: "a2", authorId: null },
    ],
  });
  const result = await loadCardAssignmentHomeworks(context, ["a1", "a1", "a2"], ["u1"]);

  assert.deepEqual(context.calls, [
    {
      where: {
        assignment: { id: { in: ["a1", "a2"] } },
        author: { id: { in: ["u1"] } },
      },
    },
  ]);
  assert.deepEqual(result, [
    { id: "h1", settings: { status: "Completed" }, assignment: { id: "a1" }, author: { id: "u1" } },
    { id: "h2", settings: { status: "Started" }, assignment: { id: "a2" }, author: null },
  ]);
});
