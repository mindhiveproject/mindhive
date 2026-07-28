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

  // Paginate through every ProposalBoard on the platform in fixed-size
  // chunks. Previously we ran a single findMany with `take` and no `skip`
  // (or ordering), so on a DB with more than the page size total the
  // action cards on later boards never got linked. The `take` arg here is
  // now a CEILING on `updated`, not on rows scanned.
  const PAGE_SIZE = 200;
  const orderBy = [{ createdAt: "asc" as const }, { id: "asc" as const }];

  let updated = 0;
  let skip = 0;
  while (updated < take) {
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
      take: PAGE_SIZE,
      skip,
      orderBy,
    });

    if (!boards || boards.length === 0) break;
    skip += boards.length;

    for (const board of boards) {
      if (updated >= take) break;
      if (!isClassTemplateBoard(board)) continue;
      for (const section of board.sections || []) {
        for (const card of section.cards || []) {
          if (updated >= take) break;
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

    if (boards.length < PAGE_SIZE) break;
  }

  return updated;
}

export default backfillLinkActionCardsToMilestones;
