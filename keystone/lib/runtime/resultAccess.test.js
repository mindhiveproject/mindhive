const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildResultAccessFilter,
  buildResultManageFilter,
  buildSummaryAccessFilter,
} = require("./resultAccess");

test("Dataset and SummaryResult ACLs reject anonymous GraphQL reads", () => {
  assert.equal(buildResultAccessFilter(undefined, false), false);
  assert.equal(buildSummaryAccessFilter(undefined, false), false);
});

test("participants may read but cannot directly rewrite result associations", () => {
  const readFilter = buildResultAccessFilter({ itemId: "profile-1" }, false);
  const manageFilter = buildResultManageFilter(
    { itemId: "profile-1" },
    false
  );
  assert.ok(readFilter.OR.some((clause) => clause.profile));
  assert.ok(!manageFilter.OR.some((clause) => clause.profile));
  assert.ok(manageFilter.OR.some((clause) => clause.study?.author));
  assert.ok(manageFilter.OR.some((clause) => clause.study?.collaborators));
});

test("result ACL includes participant and both server-derived authors", () => {
  const filter = buildResultAccessFilter({ itemId: "profile-1" }, false);
  assert.deepEqual(filter.OR[0], {
    profile: { id: { equals: "profile-1" } },
  });
  assert.ok(filter.OR.some((clause) => clause.taskAuthor));
  assert.ok(filter.OR.some((clause) => clause.assetAuthor));

  const summaryFilter = buildSummaryAccessFilter(
    { itemId: "profile-1" },
    false
  );
  assert.deepEqual(summaryFilter.OR[0], {
    user: { id: { equals: "profile-1" } },
  });
});
