/**
 * Applies the current state of a template proposal board to all clone boards
 * (boards that have clonedFrom = templateBoardId). Syncs sections and cards
 * including positions and template-owned fields; preserves student-owned
 * content on clone cards where we only update structure and instructions.
 */
import { applyTemplateToClones } from "./utils/boardPropagation";

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

  const template = await context.query.ProposalBoard.findOne({
    where: { id: templateBoardId },
    query: "id",
  });
  if (!template) {
    throw new Error("Template board not found.");
  }

  const result = await applyTemplateToClones(context, templateBoardId, {
    cardIdsWithContentUpdate: cardIdsWithContentUpdate ?? undefined,
  });

  return {
    id: templateBoardId,
    updatedCloneCount: result.updatedCloneCount,
    errors: result.errors,
  };
}

export default applyTemplateBoardChanges;
