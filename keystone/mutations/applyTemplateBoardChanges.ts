/**
 * Applies the current state of a template proposal board to all clone boards
 * (boards that have clonedFrom = templateBoardId). Syncs sections and cards
 * including positions and template-owned fields; preserves student-owned
 * content on clone cards where we only update structure and instructions.
 *
 * Additionally, for any board that is used as a template for one or more
 * classes (templateForClasses), ensure that any resources linked on its cards
 * are associated with those classes via Resource.classes. Clones that
 * themselves become templates for other classes are handled independently via
 * their own templateForClasses relationship.
 */
import { applyTemplateToClones, getTemplateAndClones } from "./utils/boardPropagation";

async function applyTemplateBoardChanges(
  _root: unknown,
  {
    templateBoardId,
    cardIdsWithContentUpdate,
  }: {
    templateBoardId: string;
    cardIdsWithContentUpdate?: string[] | null;
  },
  context: any
): Promise<{ id: string; updatedCloneCount: number; errors: string[] }> {
  const sesh = context.session;
  if (!sesh?.itemId) {
    throw new Error("You must be logged in to apply template changes.");
  }

  const templateExists = await context.query.ProposalBoard.findOne({
    where: { id: templateBoardId },
    query: "id",
  });
  if (!templateExists) {
    throw new Error("Template board not found.");
  }

  const result = await applyTemplateToClones(context, templateBoardId, {
    cardIdsWithContentUpdate: cardIdsWithContentUpdate ?? undefined,
  });

  // After propagating structure and linked items to clones, reconcile
  // Resource.classes for any classes that use this board as their template.
  // This ensures that any resource linked on the template's cards is
  // associated with the class(es) whose templateProposal is this board.
  const { template } = await getTemplateAndClones(context, templateBoardId);
  if (template) {
    const templateClasses = template.templateForClasses ?? [];

    if (templateClasses.length > 0) {
      const classIds = Array.from(
        new Set(templateClasses.map((c) => c.id).filter(Boolean))
      );

      if (classIds.length > 0) {
        const resourceIdsSet = new Set<string>();
        for (const section of template.sections || []) {
          for (const card of section.cards || []) {
            for (const resource of card.resources || []) {
              if (resource?.id) {
                resourceIdsSet.add(resource.id);
              }
            }
          }
        }

        if (resourceIdsSet.size > 0) {
          const resourceIds = Array.from(resourceIdsSet);
          const classConnect = classIds.map((id) => ({ id }));

          await Promise.all(
            resourceIds.map((resourceId) =>
              context.db.Resource.updateOne({
                where: { id: resourceId },
                data: {
                  classes: { connect: classConnect },
                },
              })
            )
          );
        }
      }
    }
  }

  return {
    id: templateBoardId,
    updatedCloneCount: result.updatedCloneCount,
    errors: result.errors,
  };
}

export default applyTemplateBoardChanges;
