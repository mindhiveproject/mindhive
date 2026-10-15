import { permissions } from "../access";
import { connectAssignmentsToTemplateClasses } from "./utils/classTemplateBoards";

type BackfillArgs = {
  dryRun?: boolean;
};

const BOARD_PAGE_SIZE = 200;

/**
 * Connects assignments linked on class template cards to the classes using
 * that template — the link that linking on a template card now makes
 * automatically (ProposalCard hook, applyTemplateBoardChanges). Assignments
 * linked before that never got it, so they warn "not connected to a class"
 * and are missing from the class Assignments tab.
 *
 * Idempotent; returns how many assignments were (or, with dryRun, would be)
 * connected to at least one more class. Platform template assignments are
 * skipped, as in connectAssignmentsToTemplateClasses.
 */
export default async function backfillTemplateAssignmentClasses(
  _root: unknown,
  args: BackfillArgs,
  context: any
): Promise<number> {
  if (!context.session?.itemId) {
    throw new Error("You must be signed in to backfill assignment classes.");
  }
  if (!permissions.canManageUsers({ session: context.session })) {
    throw new Error("Forbidden: you need user-management permission.");
  }

  const dryRun = args?.dryRun ?? false;
  const sudo = context.sudo();
  const updatedAssignmentIds = new Set<string>();

  for (let skip = 0; ; skip += BOARD_PAGE_SIZE) {
    const boards = await sudo.query.ProposalBoard.findMany({
      where: {
        isTemplate: { equals: false },
        OR: [
          { templatesForClass: { some: {} } },
          { templateForClasses: { some: {} } },
        ],
      },
      orderBy: [{ id: "asc" }],
      take: BOARD_PAGE_SIZE,
      skip,
      query: `
        id
        templateForClasses { id }
        templatesForClass { id }
        sections {
          cards {
            assignments { id isTemplate classes { id } }
          }
        }
      `,
    });

    for (const board of boards || []) {
      const classIds = [
        ...(board.templateForClasses || []),
        ...(board.templatesForClass || []),
      ].map((c: { id: string }) => c.id);

      const missingIds = new Set<string>();
      for (const section of board.sections || []) {
        for (const card of section.cards || []) {
          for (const assignment of card.assignments || []) {
            if (!assignment?.id || assignment.isTemplate) continue;
            const has = new Set(
              (assignment.classes || []).map((c: { id: string }) => c.id)
            );
            if (classIds.some((id) => !has.has(id))) {
              missingIds.add(assignment.id);
            }
          }
        }
      }
      if (missingIds.size === 0) continue;

      if (!dryRun) {
        // session: null — this mutation already required admin rights.
        await connectAssignmentsToTemplateClasses(
          sudo,
          board.id,
          [...missingIds],
          null
        );
      }
      missingIds.forEach((id) => updatedAssignmentIds.add(id));
    }

    if ((boards || []).length < BOARD_PAGE_SIZE) break;
  }

  return updatedAssignmentIds.size;
}
