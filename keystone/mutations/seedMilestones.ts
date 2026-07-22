// One-off mutation that inserts (or, with force, replaces) the four baseline
// Milestone rows. Idempotent by default: existing milestones (matched by key)
// are returned unchanged unless force=true.
//
// Admin-only: requires canManageUsers OR canManageForms.
import {
  MILESTONE_SEEDS,
  createMilestoneFromSeed,
} from "./seedData/milestoneSeedHelpers";

async function seedMilestones(
  _root: unknown,
  { force }: { force?: boolean },
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
    (p: { canManageUsers?: boolean; canManageForms?: boolean }) =>
      p.canManageUsers || p.canManageForms
  );
  if (!canManage) {
    throw new Error(
      "Forbidden: you need canManageUsers or canManageForms to seed milestones."
    );
  }

  const keys = MILESTONE_SEEDS.map((seed) => seed.key);
  const existing = await context.query.Milestone.findMany({
    where: {
      key: { in: keys },
      scope: { equals: "global" },
    },
    query: "id key",
  });

  if (existing.length > 0 && !force) {
    // See resolveMilestonesForBoard — context.db avoids the
    // pre-serialized-value trap on custom-mutation returns.
    return context.db.Milestone.findMany({
      where: { key: { in: keys } },
      orderBy: [{ key: "asc" }],
    });
  }

  if (existing.length > 0 && force) {
    for (const milestone of existing) {
      await context.query.Milestone.deleteOne({ where: { id: milestone.id } });
    }
  }

  for (const seed of MILESTONE_SEEDS) {
    await createMilestoneFromSeed(context, seed);
  }

  // See resolveMilestonesForBoard — context.db avoids the
  // pre-serialized-value trap on custom-mutation returns.
  return context.db.Milestone.findMany({
    where: { key: { in: keys } },
    orderBy: [{ key: "asc" }],
  });
}

export default seedMilestones;
