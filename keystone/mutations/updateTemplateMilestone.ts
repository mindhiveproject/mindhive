import { assertTemplateBoardTeacher } from "./resolveMilestonesForBoard";

type UpdateTemplateMilestoneInput = {
  id: string;
  title?: string;
  description?: string;
  formDefinitionId?: string | null;
  canReviewPermissionIds?: string[];
  showInFeedbackCenter?: boolean;
  isActive?: boolean;
  position?: number;
};

async function updateTemplateMilestone(
  _root: unknown,
  { input }: { input: UpdateTemplateMilestoneInput },
  context: any
) {
  const existing = await context.query.Milestone.findOne({
    where: { id: input.id },
    query: "id scope templateBoard { id }",
  });
  if (!existing || existing.scope !== "template") {
    throw new Error("Template milestone not found.");
  }
  await assertTemplateBoardTeacher(context, existing.templateBoard.id);

  const data: Record<string, unknown> = {};
  if (input.title != null) data.title = input.title;
  if (input.description != null) data.description = input.description;
  if (input.showInFeedbackCenter != null) {
    data.showInFeedbackCenter = input.showInFeedbackCenter;
  }
  if (input.isActive != null) data.isActive = input.isActive;
  if (input.position != null) data.position = input.position;
  if (input.formDefinitionId !== undefined) {
    data.formDefinition = input.formDefinitionId
      ? { connect: { id: input.formDefinitionId } }
      : { disconnect: true };
  }
  if (input.canReviewPermissionIds) {
    data.canReview = {
      set: input.canReviewPermissionIds.map((id) => ({ id })),
    };
  }

  await context.db.Milestone.updateOne({
    where: { id: input.id },
    data,
  });

  // See resolveMilestonesForBoard — context.db (raw Prisma) avoids the
  // pre-serialized-value trap that breaks GraphQL sub-selection
  // resolution on custom-mutation returns.
  return context.db.Milestone.findOne({ where: { id: String(input.id) } });
}

export default updateTemplateMilestone;
