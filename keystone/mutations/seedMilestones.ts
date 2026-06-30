// One-off mutation that inserts (or, with force, replaces) the four baseline
// Milestone rows. Idempotent by default: existing milestones (matched by key)
// are returned unchanged unless force=true.
//
// Admin-only: requires canManageUsers OR canManageForms.
import {
  MILESTONE_SEEDS,
  type MilestoneSeed,
} from "./seedData/milestoneSeed";

async function resolvePermissionIds(
  context: any,
  names: string[]
): Promise<string[]> {
  if (!names.length) return [];

  const permissions = await context.query.Permission.findMany({
    where: { name: { in: names } },
    query: "id name",
  });

  const found = new Map(
    (permissions || []).map((p: { id: string; name: string }) => [p.name, p.id])
  );
  const missing = names.filter((name) => !found.has(name));
  if (missing.length) {
    throw new Error(
      `Cannot seed milestones: missing Permission rows: ${missing.join(", ")}`
    );
  }

  return names.map((name) => found.get(name) as string);
}

async function createMilestoneFromSeed(
  context: any,
  seed: MilestoneSeed
) {
  const permissionIds = await resolvePermissionIds(
    context,
    seed.canReviewPermissionNames
  );

  return context.query.Milestone.createOne({
    data: {
      key: seed.key,
      title: seed.title,
      description: seed.description || "",
      scope: "global",
      actionCardType: seed.actionCardType,
      reviewStage: seed.reviewStage,
      statusTarget: seed.statusTarget,
      legacyBoardStatusField: seed.legacyBoardStatusField || "",
      legacyOpenForCommentsField: seed.legacyOpenForCommentsField || "",
      logEventName: seed.logEventName,
      formDefinitionKeyPattern:
        seed.formDefinitionKeyPattern || "review_{{key}}_{{curriculumType}}",
      isActive: seed.isActive ?? true,
      canReview: permissionIds.length
        ? { connect: permissionIds.map((id) => ({ id })) }
        : undefined,
    },
    query: "id key title actionCardType reviewStage statusTarget isActive",
  });
}

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
    return context.query.Milestone.findMany({
      where: { key: { in: keys } },
      query:
        "id key title actionCardType reviewStage statusTarget logEventName isActive canReview { id name }",
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

  return context.query.Milestone.findMany({
    where: { key: { in: keys } },
    query:
      "id key title actionCardType reviewStage statusTarget logEventName isActive canReview { id name }",
    orderBy: [{ key: "asc" }],
  });
}

export default seedMilestones;
