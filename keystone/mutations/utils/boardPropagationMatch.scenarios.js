/**
 * Runnable scenario checks for boardPropagationMatch.planRowMatches.
 *
 * Run from keystone/:  node mutations/utils/boardPropagationMatch.scenarios.js
 *
 * Manual checklist after deploy:
 * 1. Open a small class template that already has student clones.
 * 2. Add a dummy section; with auto-update on (or click Save & Update).
 * 3. Confirm each student board gets exactly ONE new column (not copies of
 *    the old ones).
 * 4. Delete the dummy section and confirm that one column is removed.
 * 5. Do not use boards that already have duplicate columns as the test.
 */

const {
  planRowMatches,
  hasPublicId,
} = require("./boardPropagationMatch");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function summarize(plans) {
  return {
    update: plans.filter((p) => p.decision.action === "update").length,
    create: plans.filter((p) => p.decision.action === "create").length,
    skip: plans.filter((p) => p.decision.action === "skip").length,
    needsShared: plans.filter(
      (p) =>
        p.decision.action === "update" && p.decision.needsSharedPublicId
    ).length,
  };
}

function scenarioAddSectionCreatesOnlyNew() {
  // 3 empty-id sections + 1 new id'd section vs 3 empty-id clone sections
  // → update 3, create 1, never 4 creates
  const template = [
    { id: "t1", publicId: "", position: 1 },
    { id: "t2", publicId: null, position: 2 },
    { id: "t3", publicId: undefined, position: 3 },
    { id: "t4", publicId: "new-section-uuid", position: 4 },
  ];
  const clone = [
    { id: "c1", publicId: "", position: 1 },
    { id: "c2", publicId: "", position: 2 },
    { id: "c3", publicId: "", position: 3 },
  ];
  const plans = planRowMatches(template, clone);
  const s = summarize(plans);
  assert(s.update === 3, `expected 3 updates, got ${s.update}`);
  assert(s.create === 1, `expected 1 create, got ${s.create}`);
  assert(s.skip === 0, `expected 0 skips, got ${s.skip}`);
  assert(s.needsShared === 3, `expected 3 shared stamps, got ${s.needsShared}`);
  assert(
    plans[3].decision.action === "create",
    "new section with publicId should create"
  );
}

function scenarioSecondPropagateNoNewRows() {
  // After ids are stamped, second pass should only update — no creates
  const template = [
    { id: "t1", publicId: "pid-a", position: 1 },
    { id: "t2", publicId: "pid-b", position: 2 },
    { id: "t3", publicId: "pid-c", position: 3 },
    { id: "t4", publicId: "pid-d", position: 4 },
  ];
  const clone = [
    { id: "c1", publicId: "pid-a", position: 1 },
    { id: "c2", publicId: "pid-b", position: 2 },
    { id: "c3", publicId: "pid-c", position: 3 },
    { id: "c4", publicId: "pid-d", position: 4 },
  ];
  const plans = planRowMatches(template, clone);
  const s = summarize(plans);
  assert(s.update === 4, `expected 4 updates, got ${s.update}`);
  assert(s.create === 0, `expected 0 creates, got ${s.create}`);
  assert(s.needsShared === 0, `expected 0 shared stamps, got ${s.needsShared}`);
}

function scenarioExtraCloneRowsNoCreateNoDelete() {
  // Clone already has extra empty-id copies → pair leftover subset, do not
  // create more. (Deletes of empty-id extras are intentionally not done by
  // the matcher; sync keeps them.)
  const template = [
    { id: "t1", publicId: "", position: 1 },
    { id: "t2", publicId: "", position: 2 },
    { id: "t3", publicId: "", position: 3 },
  ];
  const clone = [
    { id: "c1", publicId: "", position: 1 },
    { id: "c2", publicId: "", position: 2 },
    { id: "c3", publicId: "", position: 3 },
    { id: "c1b", publicId: "", position: 4 },
    { id: "c2b", publicId: "", position: 5 },
    { id: "c3b", publicId: "", position: 6 },
  ];
  const plans = planRowMatches(template, clone);
  const s = summarize(plans);
  assert(s.update === 3, `expected 3 updates, got ${s.update}`);
  assert(s.create === 0, `expected 0 creates, got ${s.create}`);
  const claimed = new Set(
    plans
      .filter((p) => p.decision.action === "update")
      .map((p) => p.decision.clone.id)
  );
  assert(claimed.size === 3, "should claim exactly 3 clone rows");
  assert(!claimed.has("c1b"), "extra empty clones must remain unclaimed");
}

function scenarioEmptyTemplateVsUuidCloneDoesNotCreate() {
  // Template card empty, clone card already has a UUID → do not create a
  // second card (skip). Do not mint a second id via create.
  const template = [
    { id: "t1", publicId: "", position: 1 },
    { id: "t2", publicId: "", position: 2 },
  ];
  const clone = [
    {
      id: "c1",
      publicId: "7ec73620-26ef-11f1-b96e-176ccc6967e5",
      position: 1,
    },
    {
      id: "c2",
      publicId: "7ec6c0f0-26ef-11f1-b96e-176ccc6967e5",
      position: 2,
    },
  ];
  const plans = planRowMatches(template, clone);
  const s = summarize(plans);
  assert(s.create === 0, `expected 0 creates, got ${s.create}`);
  assert(s.skip === 2, `expected 2 skips, got ${s.skip}`);
  assert(s.update === 0, `expected 0 updates, got ${s.update}`);
}

function scenarioHasPublicIdTreatsEmptyStringAsMissing() {
  assert(!hasPublicId(""), '"" should be missing');
  assert(!hasPublicId(null), "null should be missing");
  assert(!hasPublicId(undefined), "undefined should be missing");
  assert(!hasPublicId("   "), "whitespace should be missing");
  assert(hasPublicId("abc"), "non-empty should count");
}

function main() {
  scenarioHasPublicIdTreatsEmptyStringAsMissing();
  scenarioAddSectionCreatesOnlyNew();
  scenarioSecondPropagateNoNewRows();
  scenarioExtraCloneRowsNoCreateNoDelete();
  scenarioEmptyTemplateVsUuidCloneDoesNotCreate();
  console.log("boardPropagationMatch scenarios: all passed");
}

main();
