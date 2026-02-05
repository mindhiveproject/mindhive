/**
 * Re-establishes an assignment's link to a card on the class template board,
 * and propagates that link to all student boards for the class.
 * Clone cards are matched by publicId when set, otherwise by section publicId + card position.
 */
async function linkAssignmentToTemplateCard(
  _root: unknown,
  {
    assignmentId,
    templateCardId,
    classId,
  }: {
    assignmentId: string;
    templateCardId: string;
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

  console.log("[linkAssignmentToTemplateCard] classId:", classId, "templateBoardId:", templateBoardId, "studentProposals:", (classData.studentProposals || []).length, "studentBoards (cloned from template):", studentBoards.length);

  const templateCard = await context.query.ProposalCard.findOne({
    where: { id: templateCardId },
    query: "id publicId position section { id publicId position board { id } }",
  });
  if (!templateCard) {
    throw new Error("Template card not found.");
  }
  if (templateCard.section?.board?.id !== templateBoardId) {
    throw new Error("Card does not belong to the class template board.");
  }

  const assignment = await context.query.Assignment.findOne({
    where: { id: assignmentId },
    query:
      "id proposalCards { id publicId position section { id publicId position board { id } } }",
  });
  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  const templateBoardCards = (assignment.proposalCards || []).filter(
    (c: any) => c?.section?.board?.id === templateBoardId
  );
  const toDisconnectTemplate = templateBoardCards.map((c: any) => ({ id: c.id }));

  const studentBoardIds = new Set((studentBoards || []).map((b: any) => b.id));
  const toDisconnectStudentFromAssignment = (assignment.proposalCards || [])
    .filter(
      (c: any) =>
        c?.section?.board?.id && studentBoardIds.has(c.section.board.id)
    )
    .map((c: any) => c.id);

  const toDisconnectStudentFromOldTemplate: string[] = [];
  for (const oldTemplateCard of templateBoardCards || []) {
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
    ...new Set([...toDisconnectStudentFromAssignment, ...toDisconnectStudentFromOldTemplate]),
  ];
  const toDisconnectStudent = toDisconnectStudentIds.map((id) => ({ id }));

  const toConnect: { id: string }[] = [{ id: templateCardId }];
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
      console.log(
        "[linkAssignmentToTemplateCard] matching clone cards by",
        matchBySectionPublicId ? "section publicId + position" : "section position + card position",
        "(template card has no publicId)"
      );
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

  const disconnectAll = [...toDisconnectTemplate, ...toDisconnectStudent];

  console.log("[linkAssignmentToTemplateCard] toConnect:", toConnect.length, "ids:", toConnect.map((x) => x.id), "| disconnectAll:", disconnectAll.length, "| newPublicId:", newPublicId);

  await context.db.Assignment.updateOne({
    where: { id: assignmentId },
    data: {
      proposalCards: {
        disconnect: disconnectAll,
        connect: toConnect,
      },
    },
  });

  return { id: assignmentId };
}

export default linkAssignmentToTemplateCard;
