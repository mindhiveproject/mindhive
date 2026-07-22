// Links existing ACTION_* cards on template boards to global Milestones by actionCardType.
import { MILESTONE_SEEDS } from "./seedData/milestoneSeed";
import { isClassTemplateBoard } from "./utils/boardPropagation";

const ACTION_TYPES = MILESTONE_SEEDS.map((s) => s.actionCardType);

async function backfillLinkActionCardsToMilestones(
  _root: unknown,
  { limit, dryRun }: { limit?: number; dryRun?: boolean },
  context: any
) {
  const take = Math.min(Math.max(limit ?? 500, 1), 1000);
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in.");
  }

  const profile = await context.query.Profile.findOne({
    where: { id: session.itemId },
    query: "permissions { canManageUsers canManageForms }",
  });
  const canManage = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers || p.canManageForms
  );
  if (!canManage) {
    throw new Error("Forbidden.");
  }

  const globalMilestones = await context.query.Milestone.findMany({
    where: { scope: { equals: "global" } },
    query: "id key actionCardType",
  });
  const byActionType = new Map(
    globalMilestones.map((m: any) => [m.actionCardType, m])
  );

  const boards = await context.query.ProposalBoard.findMany({
    query: `
      id
      templateForClasses { id }
      templatesForClass { id }
      sections {
        cards {
          id
          type
          milestone { id }
        }
      }
    `,
    take,
  });

  let updated = 0;
  for (const board of boards) {
    if (!isClassTemplateBoard(board)) continue;
    for (const section of board.sections || []) {
      for (const card of section.cards || []) {
        if (!ACTION_TYPES.includes(card.type)) continue;
        if (card.milestone?.id) continue;
        const milestone = byActionType.get(card.type);
        if (!milestone) continue;
        if (!dryRun) {
          await context.query.ProposalCard.updateOne({
            where: { id: card.id },
            data: { milestone: { connect: { id: milestone.id } } },
          });
        }
        updated += 1;
      }
    }
  }

  return updated;
}

export default backfillLinkActionCardsToMilestones;
