/**
 * Sets an assignment's linked template cards to the given list, and propagates
 * to all student boards. Clone cards are matched by publicId, or section publicId + position.
 */
async function setAssignmentTemplateCards(
  _root: unknown,
  {
    assignmentId,
    templateCardIds,
    classId,
  }: {
    assignmentId: string;
    templateCardIds: string[];
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
      "id templateProposal { id } studentProposals { id clonedFrom { id } sections { id publicId position cards { id publicId position } } }",
  });
  if (!classData?.templateProposal?.id) {
    throw new Error("Class has no template board.");
  }
  const templateBoardId = classData.templateProposal.id;

  const studentBoards = (classData.studentProposals || []).filter(
    (b: any) => b?.clonedFrom?.id === templateBoardId
  );

  const assignment = await context.query.Assignment.findOne({
    where: { id: assignmentId },
    query:
      "id proposalCards { id publicId position section { id publicId position board { id } } }",
  });
  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  const uniqueTemplateCardIds = [...new Set(templateCardIds)].filter(Boolean);
  const toConnect: { id: string }[] = [];

  for (const templateCardId of uniqueTemplateCardIds) {
    const templateCard = await context.query.ProposalCard.findOne({
      where: { id: templateCardId },
      query: "id publicId position section { id publicId position board { id } }",
    });
    if (!templateCard) continue;
    if (templateCard.section?.board?.id !== templateBoardId) continue;

    toConnect.push({ id: templateCardId });

    const newPublicId = templateCard.publicId;
    const templateSectionPublicId = templateCard.section?.publicId;
    const templateCardPosition = templateCard.position;

    if (newPublicId) {
      for (const board of studentBoards || []) {
        for (const sec of board.sections || []) {
          for (const card of sec.cards || []) {
            if (card?.publicId === newPublicId) {
              toConnect.push({ id: card.id });
            }
          }
        }
      }
    } else {
      const templateSectionPosition = templateCard.section?.position;
      const matchBySectionPublicId =
        templateSectionPublicId != null && templateCardPosition != null;
      const matchByPosition =
        templateSectionPosition != null && templateCardPosition != null;

      if (matchBySectionPublicId || matchByPosition) {
        for (const board of studentBoards || []) {
          for (const sec of board.sections || []) {
            const sectionMatches = matchBySectionPublicId
              ? sec?.publicId === templateSectionPublicId
              : sec?.position === templateSectionPosition;
            if (!sectionMatches) continue;
            for (const card of sec.cards || []) {
              if (card?.position === templateCardPosition) {
                toConnect.push({ id: card.id });
              }
            }
          }
        }
      }
    }
  }

  const currentCards = assignment.proposalCards || [];
  const templateBoardCards = currentCards.filter(
    (c: any) => c?.section?.board?.id === templateBoardId
  );
  const studentBoardIds = new Set((studentBoards || []).map((b: any) => b.id));
  const currentStudentCards = currentCards.filter(
    (c: any) =>
      c?.section?.board?.id && studentBoardIds.has(c.section.board.id)
  );

  const toConnectIds = new Set(toConnect.map((x) => x.id));
  const toDisconnectTemplate = templateBoardCards
    .filter((c: any) => !toConnectIds.has(c.id))
    .map((c: any) => ({ id: c.id }));

  const toDisconnectStudentFromOldTemplate: string[] = [];
  for (const oldTemplateCard of templateBoardCards || []) {
    if (toConnectIds.has(oldTemplateCard.id)) continue;
    const oldPublicId = oldTemplateCard.publicId;
    const oldSectionPublicId = oldTemplateCard.section?.publicId;
    const oldSectionPosition = oldTemplateCard.section?.position;
    const oldPosition = oldTemplateCard.position;

    for (const board of studentBoards || []) {
      for (const sec of board.sections || []) {
        for (const card of sec.cards || []) {
          const matchByPublicId =
            oldPublicId && card?.publicId === oldPublicId;
          const matchBySectionPublicIdAndPosition =
            oldSectionPublicId != null &&
            oldPosition != null &&
            sec?.publicId === oldSectionPublicId &&
            card?.position === oldPosition;
          const matchBySectionPositionAndPosition =
            oldSectionPosition != null &&
            oldPosition != null &&
            sec?.position === oldSectionPosition &&
            card?.position === oldPosition;
          if (
            matchByPublicId ||
            matchBySectionPublicIdAndPosition ||
            matchBySectionPositionAndPosition
          ) {
            toDisconnectStudentFromOldTemplate.push(card.id);
          }
        }
      }
    }
  }

  const toDisconnectStudentIds = [
    ...new Set(
      currentStudentCards
        .filter((c: any) => !toConnectIds.has(c.id))
        .map((c: any) => c.id)
        .concat(toDisconnectStudentFromOldTemplate)
    ),
  ];
  const toDisconnectStudent = toDisconnectStudentIds.map((id) => ({ id }));

  const disconnectAll = [...toDisconnectTemplate, ...toDisconnectStudent];

  const connectDeduped = Array.from(
    new Map(toConnect.map((x) => [x.id, x])).values()
  );

  await context.db.Assignment.updateOne({
    where: { id: assignmentId },
    data: {
      proposalCards: {
        disconnect: disconnectAll,
        connect: connectDeduped,
      },
    },
  });

  return { id: assignmentId };
}

export default setAssignmentTemplateCards;
