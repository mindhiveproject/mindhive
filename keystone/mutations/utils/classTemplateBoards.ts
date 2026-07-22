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
