const test = require("node:test");
const assert = require("node:assert/strict");
const { contentFileTokens, newFileTokens } = require("./datasourceFiles");

test("only tokens at an address count", () => {
  const content = {
    isModified: true,
    uploaded: { address: { year: 2026, month: 11, day: 22, token: "up1" } },
    modified: { address: { token: "mod1" }, metadata: { id: "mod1" } },
    note: "smuggled",
    nested: [{ note: "also-smuggled" }],
  };
  assert.deepEqual([...contentFileTokens(content)].sort(), ["mod1", "up1"]);
});

test("content stored as text (SQLite) is read too", () => {
  const text = JSON.stringify({ uploaded: { address: { token: "abc" } } });
  assert.deepEqual([...contentFileTokens(text)], ["abc"]);
  assert.deepEqual([...contentFileTokens("not json")], []);
  assert.deepEqual([...contentFileTokens(null)], []);
});

test("new tokens are the ones the previous content did not have", () => {
  const before = { uploaded: { address: { token: "up1" } } };
  const after = {
    uploaded: { address: { token: "up1" } },
    modified: { address: { token: "mod2" } },
  };
  assert.deepEqual(newFileTokens(before, after), ["mod2"]);
  assert.deepEqual(newFileTokens(null, before), ["up1"]);
  assert.deepEqual(newFileTokens(after, after), []);
});
