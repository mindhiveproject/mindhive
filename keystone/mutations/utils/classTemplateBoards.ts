import {
  canMutateClassTemplateBoard,
  CLASS_TEMPLATE_BOARD_ACCESS_QUERY,
  isAdmin,
} from "../../access";

type ClassTemplateData = {
  id?: string;
  templateProposal?: { id: string; title?: string; settings?: unknown } | null;
  classTemplateBoards?: Array<{ id: string; title?: string; settings?: unknown }> | null;
};

export function getClassTemplateBoards(
  classData: ClassTemplateData | null | undefined
): Array<{ id: string; title?: string; settings?: unknown }> {
  const fromMany = classData?.classTemplateBoards ?? [];
  const primary = classData?.templateProposal;
  const merged = [...fromMany];

  if (primary?.id && !merged.some((board) => board.id === primary.id)) {
    merged.unshift(primary);
  }

  return merged;
}

export function getPrimaryTemplateBoardId(
  classData: ClassTemplateData | null | undefined
): string | null {
  return (
    classData?.templateProposal?.id
    ?? classData?.classTemplateBoards?.[0]?.id
    ?? null
  );
}

/**
 * Picks the class template board a class-page linking mutation works on: the
 * requested board when it is one of the class's template boards, otherwise
 * the primary board. Throws when a board is requested that does not belong
 * to the class, rather than quietly working on a different board.
 */
export function resolveClassTemplateBoardId(
  classData: ClassTemplateData | null | undefined,
  requestedTemplateBoardId?: string | null
): string | null {
  if (requestedTemplateBoardId) {
    const belongsToClass = getClassTemplateBoards(classData).some(
      (board) => board.id === requestedTemplateBoardId
    );
    if (!belongsToClass) {
      throw new Error("That board is not a template board of this class.");
    }
    return requestedTemplateBoardId;
  }
  return getPrimaryTemplateBoardId(classData);
}

/**
 * Connects assignments to every class that uses the board as a template, so
 * an assignment linked on a class template card shows up in that class
 * (class Assignments tab, published to its students). Mirrors what
 * applyTemplateBoardChanges does for resources.
 *
 * Writes as sudo, so it is gated here: only someone who may edit the class
 * template (class creator, teaching team, mentors, board collaborators) can
 * pull an assignment into the class. Otherwise a student or a network member
 * who can read the class could publish their own assignment to it through
 * the linking mutations. Admins pass. Pass session: null only from callers
 * that already checked admin rights themselves (backfill).
 */
export async function connectAssignmentsToTemplateClasses(
  sudo: any,
  templateBoardId: string,
  assignmentIds: string[],
  session: any
): Promise<void> {
  const ids = [...new Set(assignmentIds.filter(Boolean))];
  if (!templateBoardId || ids.length === 0) return;

  const board = await sudo.query.ProposalBoard.findOne({
    where: { id: templateBoardId },
    query: CLASS_TEMPLATE_BOARD_ACCESS_QUERY,
  });
  if (session !== null) {
    const allowed =
      isAdmin({ session } as any) ||
      canMutateClassTemplateBoard(
        session?.itemId ? String(session.itemId) : null,
        board
      );
    if (!allowed) return;
  }
  const classIds = [
    ...new Set(
      [...(board?.templateForClasses ?? []), ...(board?.templatesForClass ?? [])]
        .map((c: { id: string }) => c?.id)
        .filter(Boolean)
    ),
  ];
  if (classIds.length === 0) return;

  // Platform template assignments are shared by every class that copies
  // them; they must not collect class links.
  const classAssignments = await sudo.query.Assignment.findMany({
    where: {
      id: { in: ids },
      NOT: [{ isTemplate: { equals: true } }],
    },
    query: "id",
  });

  const classConnect = classIds.map((id) => ({ id }));
  await Promise.all(
    classAssignments.map(({ id: assignmentId }: { id: string }) =>
      sudo.db.Assignment.updateOne({
        where: { id: assignmentId },
        data: { classes: { connect: classConnect } },
      })
    )
  );
}

export function isClassTemplateBoard(board: {
  templateForClasses?: Array<{ id: string }> | null;
  templatesForClass?: Array<{ id: string }> | null;
} | null): boolean {
  return Boolean(
    (board?.templateForClasses && board.templateForClasses.length > 0)
    || (board?.templatesForClass && board.templatesForClass.length > 0)
  );
}

export const CLASS_TEMPLATE_QUERY = `
  id
  templateProposal { id }
  classTemplateBoards { id }
`;

/**
 * Ensures Class.classTemplateBoards includes every board linked via either
 * templateForClasses (legacy templateProposal) or templatesForClass.
 */
export async function syncClassTemplateBoards(
  context: any,
  classId: string
): Promise<void> {
  if (!classId) return;

  const classRecord = await context.query.Class.findOne({
    where: { id: classId },
    query: `
      id
      templateProposal { id }
      classTemplateBoards { id }
    `,
  });
  if (!classRecord) return;

  const existingIds = new Set(
    (classRecord.classTemplateBoards || []).map((board: { id: string }) => board.id)
  );

  const linkedBoards = await context.query.ProposalBoard.findMany({
    where: {
      OR: [
        { templatesForClass: { some: { id: { equals: classId } } } },
        { templateForClasses: { some: { id: { equals: classId } } } },
      ],
    },
    query: "id templatesForClass { id }",
  });

  const boardsToConnectOnClass = linkedBoards
    .filter((board: { id: string }) => !existingIds.has(board.id))
    .map((board: { id: string }) => ({ id: board.id }));

  if (boardsToConnectOnClass.length > 0) {
    await context.db.Class.updateOne({
      where: { id: classId },
      data: {
        classTemplateBoards: { connect: boardsToConnectOnClass },
      },
    });
  }

  await Promise.all(
    linkedBoards.map(async (board: { id: string; templatesForClass?: Array<{ id: string }> }) => {
      const hasTemplatesForClass = (board.templatesForClass || []).some(
        (cls: { id: string }) => cls.id === classId
      );
      if (hasTemplatesForClass) return;

      await context.db.ProposalBoard.updateOne({
        where: { id: board.id },
        data: {
          templatesForClass: { connect: { id: classId } },
        },
      });
    })
  );
}
