import { assertCanMutateClassTemplateBoard } from "./resolveMilestonesForBoard";

/**
 * Deletes a template-scoped milestone from a class template board.
 *
 * POLICY (bulk card delete / review-step removal): we delete the milestone
 * only. Board-scoped review forms are NOT deleted—they become unavailable on
 * this board once nothing links to them.
 *
 * FUTURE: When teachers can reassociate review forms to milestones, revisit
 * deleteTemplateMilestone and the bulk-delete copy in
 * frontend/components/Proposal/Builder/DeleteCardsConfirmModal.js.
 */
async function deleteTemplateMilestone(
  _root: unknown,
  { id }: { id: string },
  context: any
) {
  const existing = await context.query.Milestone.findOne({
    where: { id },
    query: "id scope templateBoard { id }",
  });
  if (!existing || existing.scope !== "template") {
    throw new Error("Template milestone not found.");
  }

  const templateBoardId = existing.templateBoard?.id;
  if (!templateBoardId) {
    throw new Error("Template milestone has no template board.");
  }

  await assertCanMutateClassTemplateBoard(context, templateBoardId);

  const sudo = context.sudo();
  await sudo.db.Milestone.deleteOne({ where: { id } });
  return { id: String(id) };
}

export default deleteTemplateMilestone;
