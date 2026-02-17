/**
 * Unlinks an assignment from all cards on the class template board
 * and all corresponding cloned student boards for that class.
 *
 * The assignment itself and its class relationships are left untouched;
 * only the `proposalCards` relation is updated.
 */
async function unlinkAssignmentFromTemplateCards(
  _root: unknown,
  {
    assignmentId,
    classId,
  }: {
    assignmentId: string;
    classId: string;
  },
  context: any
): Promise<{ id: string } | null> {
  const sesh = context.session;
  if (!sesh?.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  const classData = await context.query.Class.findOne({
    where: { id: classId },
    query:
      "id templateProposal { id } studentProposals { id clonedFrom { id } }",
  });

  if (!classData?.templateProposal?.id) {
    throw new Error("Class has no template board.");
  }

  const templateBoardId = classData.templateProposal.id;

  const studentBoards = (classData.studentProposals || []).filter(
    (b: any) => b?.clonedFrom?.id === templateBoardId
  );
  const studentBoardIds = new Set((studentBoards || []).map((b: any) => b.id));

  const assignment = await context.query.Assignment.findOne({
    where: { id: assignmentId },
    query:
      "id proposalCards { id section { board { id } } }",
  });

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  const proposalCards = assignment.proposalCards || [];

  // Cards on the class template board
  const templateBoardCardIds = proposalCards
    .filter((c: any) => c?.section?.board?.id === templateBoardId)
    .map((c: any) => c.id);

  // Cards on any cloned student boards for this class
  const studentBoardCardIds = proposalCards
    .filter(
      (c: any) =>
        c?.section?.board?.id && studentBoardIds.has(c.section.board.id)
    )
    .map((c: any) => c.id);

  const allIds = [
    ...new Set([...templateBoardCardIds, ...studentBoardCardIds]),
  ];

  if (allIds.length === 0) {
    // Nothing to unlink; return early without touching other relationships.
    return { id: assignmentId };
  }

  await context.db.Assignment.updateOne({
    where: { id: assignmentId },
    data: {
      proposalCards: {
        disconnect: allIds.map((id) => ({ id })),
      },
    },
  });

  return { id: assignmentId };
}

export default unlinkAssignmentFromTemplateCards;

