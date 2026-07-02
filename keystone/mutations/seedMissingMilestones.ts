// Safe self-service seeder for the admin UI. Checks each baseline
// Milestone key and only inserts when no row with that key exists at all
// (any scope). Never clobbers existing milestones.
import {
  MILESTONE_SEEDS,
  createMilestoneFromSeed,
  MILESTONE_SEED_RETURN_QUERY,
} from "./seedData/milestoneSeedHelpers";

async function seedMissingMilestones(_root: unknown, _args: {}, context: any) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in to do this.");
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

  const inserted: string[] = [];

  for (const seed of MILESTONE_SEEDS) {
    const existing = await context.query.Milestone.findMany({
      where: { key: { equals: seed.key } },
      query: "id",
    });
    if (existing.length > 0) continue;
    const created = await createMilestoneFromSeed(context, seed);
    inserted.push(created.id);
  }

  if (inserted.length === 0) {
    return [];
  }

  return context.query.Milestone.findMany({
    where: { id: { in: inserted } },
    query: MILESTONE_SEED_RETURN_QUERY,
    orderBy: [{ key: "asc" }],
  });
}

export default seedMissingMilestones;
