const test = require("node:test");
const assert = require("node:assert/strict");
const { slugBase, nextFreeSlug } = require("./uniqueSlug");

test("a free slug is used as is", () => {
  assert.equal(nextFreeSlug("flanker", []), "flanker");
  assert.equal(nextFreeSlug("flanker", ["flanker-1", "flanker-2"]), "flanker");
});

test("a taken slug gets the next number", () => {
  assert.equal(nextFreeSlug("flanker", ["flanker"]), "flanker-1");
  assert.equal(
    nextFreeSlug("flanker", ["flanker", "flanker-1", "flanker-2"]),
    "flanker-3"
  );
});

test("a gap from a deleted item never gives a taken slug", () => {
  // the case that broke block copies: -7 deleted, 10 numbered slugs exist
  const taken = ["ccas", "ccas-1", "ccas-2", "ccas-3", "ccas-4", "ccas-5",
    "ccas-6", "ccas-8", "ccas-9", "ccas-10"];
  assert.equal(nextFreeSlug("ccas", taken), "ccas-11");
});

test("other slugs sharing the prefix are ignored", () => {
  assert.equal(
    nextFreeSlug("stroop", ["stroop", "stroop-task", "stroop-2024", "stroopy-9"]),
    "stroop-2025"
  );
  assert.equal(nextFreeSlug("stroop", ["stroop", "stroop-task-4"]), "stroop-1");
});

test("a title with no usable characters falls back", () => {
  assert.equal(slugBase("!!!", "task"), "task");
  assert.equal(slugBase("Flanker (US) Task"), "flanker-us-task");
});
