import {
  MILESTONE_SEEDS,
  type MilestoneSeed,
} from "./milestoneSeed";

export { MILESTONE_SEEDS, type MilestoneSeed };

export async function resolvePermissionIds(
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

export async function createMilestoneFromSeed(context: any, seed: MilestoneSeed) {
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

export const MILESTONE_SEED_RETURN_QUERY =
  "id key title description scope actionCardType reviewStage statusTarget logEventName formDefinitionKeyPattern isActive showInFeedbackCenter canReview { id name }";
