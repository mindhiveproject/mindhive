// One-off backfill for the migration to lowercase keys everywhere.
//
// Rewrites:
//   - Milestone.key           → lowercased if it contains uppercase
//   - Milestone.reviewStage   → same
//   - FormDefinition.key      → lowercased when it matches review_*
//                                (leaves non-review keys alone)
//
// Dry-run by default. Pass dryRun: false to actually mutate.
// Idempotent — safe to run multiple times.
//
// Permission gate: canManageUsers OR canManageForms.
async function backfillLowercaseKeys(
  root: any,
  { dryRun = true }: { dryRun?: boolean },
  context: any
) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in to run this mutation.");
  }
  const profile = await context.query.Profile.findOne({
    where: { id: session.itemId },
    query: "permissions { canManageUsers canManageForms }",
  });
  const canManage = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers || p.canManageForms
  );
  if (!canManage) {
    throw new Error(
      "Forbidden: canManageUsers or canManageForms required."
    );
  }

  const changes: string[] = [];

  // Milestones ----------------------------------------------------------
  const milestones = await context.query.Milestone.findMany({
    query: "id key reviewStage",
  });
  for (const m of milestones) {
    const nextKey = typeof m.key === "string" ? m.key.toLowerCase() : m.key;
    const nextStage =
      typeof m.reviewStage === "string"
        ? m.reviewStage.toLowerCase()
        : m.reviewStage;
    const keyChanged = nextKey !== m.key;
    const stageChanged = nextStage !== m.reviewStage;
    if (!keyChanged && !stageChanged) continue;
    changes.push(
      `Milestone ${m.id}: ${keyChanged ? `key ${m.key}→${nextKey}` : ""}${keyChanged && stageChanged ? " · " : ""}${stageChanged ? `stage ${m.reviewStage}→${nextStage}` : ""}`
    );
    if (!dryRun) {
      await context.db.Milestone.updateOne({
        where: { id: m.id },
        data: {
          ...(keyChanged ? { key: nextKey } : {}),
          ...(stageChanged ? { reviewStage: nextStage } : {}),
        },
      });
    }
  }

  // FormDefinitions with review_* keys -----------------------------------
  const forms = await context.query.FormDefinition.findMany({
    where: { key: { startsWith: "review_" } },
    query: "id key",
  });
  for (const f of forms) {
    if (typeof f.key !== "string") continue;
    const next = f.key.toLowerCase();
    if (next === f.key) continue;
    changes.push(`FormDefinition ${f.id}: key ${f.key}→${next}`);
    if (!dryRun) {
      await context.db.FormDefinition.updateOne({
        where: { id: f.id },
        data: { key: next },
      });
    }
  }

  return changes.length === 0
    ? [`No changes needed — everything is already lowercase.`]
    : dryRun
      ? [`Dry run — pass dryRun:false to apply these ${changes.length} change(s):`, ...changes]
      : [`Applied ${changes.length} change(s):`, ...changes];
}

export default backfillLowercaseKeys;
