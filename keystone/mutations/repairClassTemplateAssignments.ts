import { permissions } from "../access";

const {
  templateClassIds,
  selectAssignmentsToSplit,
} = require("../lib/classAssignmentCopies");

type RepairArgs = {
  boardId?: string | null;
  dryRun?: boolean | null;
};

type RepairResult = {
  boardsScanned: number;
  assignmentsSplit: number;
  cardsRepointed: number;
  homeworkMoved: number;
};

const BOARD_PAGE_SIZE = 50;

const BOARD_QUERY = `
  id
  isTemplate
  author { id }
  templateForClasses { id }
  templatesForClass { id }
  sections {
    cards {
      id
      assignments { id isTemplate classes { id } }
    }
  }
`;

/**
 * Gives each class template board its own copies of assignments it shares
 * with another class. Before copyProposalBoard created new rows for
 * class-to-class template copies, a teacher copying another class's template
 * got that class's assignment rows: the assignments stayed in (and were
 * published, edited, deleted by) the other class, and mostly never showed in
 * the new class's Assignments tab.
 *
 * For each class template board (or only `boardId`), every linked assignment
 * that is connected to a class the board is not a template for is split:
 * - a copy (same title/content/placeholder/settings/tags) is created for the
 *   board's template classes, unpublished, with templateSource → original,
 *   authored by the board's author;
 * - the board's cards and its student clones' cards link the copy instead;
 * - homework on the original by students of the board's classes moves to the
 *   copy;
 * - the original loses its links to the board's classes.
 *
 * Writes go through the Assignment side (proposalCards connect/disconnect),
 * not ProposalCard updates, so the ProposalCard afterOperation hook
 * (connectAssignmentsToTemplateClasses) never runs and cannot re-link the
 * original to the board's classes.
 *
 * Admin-only (canManageUsers), sudo, idempotent: a second run finds nothing.
 * With dryRun it writes nothing and returns the counts it would produce.
 */
export default async function repairClassTemplateAssignments(
  _root: unknown,
  args: RepairArgs,
  context: any
): Promise<RepairResult> {
  if (!context.session?.itemId) {
    throw new Error("You must be signed in to repair class template assignments.");
  }
  if (!permissions.canManageUsers({ session: context.session })) {
    throw new Error("Forbidden: you need user-management permission.");
  }

  const dryRun = args?.dryRun ?? false;
  const sudo = context.sudo();
  const result: RepairResult = {
    boardsScanned: 0,
    assignmentsSplit: 0,
    cardsRepointed: 0,
    homeworkMoved: 0,
  };

  if (args?.boardId) {
    const board = await sudo.query.ProposalBoard.findOne({
      where: { id: args.boardId },
      query: BOARD_QUERY,
    });
    if (!board) throw new Error("Board not found.");
    if (board.isTemplate || templateClassIds(board).length === 0) {
      throw new Error("That board is not a class template board.");
    }
    await repairBoard(sudo, board, dryRun, result);
    return result;
  }

  // The scanned set (class template boards) does not change during the run,
  // so skip-based paging stays stable.
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
      query: BOARD_QUERY,
    });
    for (const board of boards || []) {
      await repairBoard(sudo, board, dryRun, result);
    }
    if ((boards || []).length < BOARD_PAGE_SIZE) break;
  }

  return result;
}

async function repairBoard(
  sudo: any,
  board: any,
  dryRun: boolean,
  result: RepairResult
): Promise<void> {
  result.boardsScanned += 1;
  const toSplit = selectAssignmentsToSplit(board);
  if (toSplit.length === 0) return;

  const classIds: string[] = templateClassIds(board);
  const originalIds: string[] = toSplit.map(
    ({ assignment }: { assignment: { id: string } }) => assignment.id
  );

  // Student clone cards that still link one of the originals.
  const cloneCards: Array<{ id: string; assignments: Array<{ id: string }> }> =
    await sudo.query.ProposalCard.findMany({
      where: {
        section: { board: { clonedFrom: { id: { equals: board.id } } } },
        assignments: { some: { id: { in: originalIds } } },
      },
      query: "id assignments { id }",
    });

  const originals = await sudo.query.Assignment.findMany({
    where: { id: { in: originalIds } },
    query: "id title content placeholder settings tags { id }",
  });
  const originalById = new Map<string, any>(
    originals.map((a: any) => [String(a.id), a])
  );

  const studentHomeworkWhere = (assignmentId: string) => ({
    assignment: { id: { equals: assignmentId } },
    author: { studentIn: { some: { id: { in: classIds } } } },
  });

  const repointedCards = new Set<string>();

  for (const { assignment, cardIds } of toSplit) {
    const original = originalById.get(String(assignment.id));
    if (!original) continue;

    const cloneCardIds = cloneCards
      .filter((card) => (card.assignments || []).some((a) => a.id === original.id))
      .map((card) => card.id);
    const allCardIds: string[] = [...new Set<string>([...cardIds, ...cloneCardIds])];
    allCardIds.forEach((id) => repointedCards.add(id));

    const homework = await sudo.query.Homework.findMany({
      where: studentHomeworkWhere(original.id),
      query: "id",
    });

    result.assignmentsSplit += 1;
    result.homeworkMoved += homework.length;
    if (dryRun) continue;

    const copy = await sudo.db.Assignment.createOne({
      data: {
        title: original.title,
        content: original.content,
        placeholder: original.placeholder,
        settings: original.settings,
        public: false,
        isTemplate: false,
        templateSource: { connect: { id: original.id } },
        tags:
          original.tags?.length > 0
            ? { connect: original.tags.map((t: { id: string }) => ({ id: t.id })) }
            : undefined,
        classes: { connect: classIds.map((id) => ({ id })) },
        proposalCards: { connect: allCardIds.map((id) => ({ id })) },
      },
    });

    // The author hook credits the session user (the admin running this) on
    // create; the class's own copy belongs to the board's author.
    if (board.author?.id) {
      await sudo.db.Assignment.updateOne({
        where: { id: copy.id },
        data: { author: { connect: { id: board.author.id } } },
      });
    }

    // Unlink the original from this board's cards and classes in one write,
    // after the copy is linked, so the cards never go without it.
    await sudo.db.Assignment.updateOne({
      where: { id: original.id },
      data: {
        proposalCards: { disconnect: allCardIds.map((id) => ({ id })) },
        classes: { disconnect: classIds.map((id) => ({ id })) },
      },
    });

    if (homework.length > 0) {
      await sudo.db.Homework.updateMany({
        data: homework.map((h: { id: string }) => ({
          where: { id: h.id },
          data: { assignment: { connect: { id: copy.id } } },
        })),
      });
    }
  }

  result.cardsRepointed += repointedCards.size;
}
