const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildResultAccessFilter,
  buildResultManageFilter,
  buildSummaryAccessFilter,
} = require("./resultAccess");

// A context whose researcher-study lookup returns `studyIds` and counts calls.
function fakeContext(studyIds = []) {
  const context = {
    req: {},
    lookups: [],
    prisma: {
      study: {
        findMany: async (args) => {
          context.lookups.push(args);
          return studyIds.map((id) => ({ id }));
        },
      },
    },
  };
  return context;
}

test("Dataset and SummaryResult ACLs reject anonymous GraphQL reads", async () => {
  const context = fakeContext();
  assert.equal(await buildResultAccessFilter(undefined, false, context), false);
  assert.equal(await buildSummaryAccessFilter(undefined, false, context), false);
  assert.equal(context.lookups.length, 0);
});

test("admins are not filtered and skip the study lookup", async () => {
  const context = fakeContext();
  const session = { itemId: "admin-1" };
  assert.equal(await buildResultAccessFilter(session, true, context), true);
  assert.equal(await buildResultManageFilter(session, true, context), true);
  assert.equal(context.lookups.length, 0);
});

test("participants may read but cannot directly rewrite result associations", async () => {
  const context = fakeContext();
  const session = { itemId: "profile-1" };
  const readFilter = await buildResultAccessFilter(session, false, context);
  const manageFilter = await buildResultManageFilter(session, false, context);
  assert.ok(readFilter.OR.some((clause) => clause.profile));
  assert.ok(!manageFilter.OR.some((clause) => clause.profile));
});

test("result ACL includes participant and both server-derived authors", async () => {
  const context = fakeContext();
  const session = { itemId: "profile-1" };
  const filter = await buildResultAccessFilter(session, false, context);
  assert.deepEqual(filter.OR[0], {
    profile: { id: { equals: "profile-1" } },
  });
  assert.ok(filter.OR.some((clause) => clause.taskAuthor));
  assert.ok(filter.OR.some((clause) => clause.assetAuthor));

  const summaryFilter = await buildSummaryAccessFilter(session, false, context);
  assert.deepEqual(summaryFilter.OR[0], {
    user: { id: { equals: "profile-1" } },
  });
});

test("researchers of a study read and manage its results by study id", async () => {
  const context = fakeContext(["study-1", "study-2"]);
  const session = { itemId: "student-1" };
  const studyClause = { study: { id: { in: ["study-1", "study-2"] } } };
  assert.deepEqual(
    (await buildResultAccessFilter(session, false, context)).OR.at(-1),
    studyClause
  );
  assert.deepEqual(
    (await buildResultManageFilter(session, false, context)).OR.at(-1),
    studyClause
  );
  // SummaryResult also has `study`, so the clause passes through unchanged
  assert.deepEqual(
    (await buildSummaryAccessFilter(session, false, context)).OR.at(-1),
    studyClause
  );
});

test("the lookup covers study authors, collaborators and project boards", async () => {
  const context = fakeContext();
  await buildResultAccessFilter({ itemId: "student-1" }, false, context);
  assert.deepEqual(context.lookups[0].where, {
    OR: [
      { author: { id: "student-1" } },
      { collaborators: { some: { id: "student-1" } } },
      {
        proposal: {
          some: {
            OR: [
              { author: { id: "student-1" } },
              { collaborators: { some: { id: "student-1" } } },
            ],
          },
        },
      },
    ],
  });
});

test("researcher studies are looked up once per request", async () => {
  const context = fakeContext(["study-1"]);
  const session = { itemId: "profile-1" };
  await Promise.all([
    buildResultAccessFilter(session, false, context),
    buildSummaryAccessFilter(session, false, context),
    buildResultManageFilter(session, false, context),
  ]);
  assert.equal(context.lookups.length, 1);

  const nextRequest = { ...context, req: {} };
  await buildResultAccessFilter(session, false, nextRequest);
  assert.equal(context.lookups.length, 2);
});
