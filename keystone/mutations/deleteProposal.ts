async function deleteProposal(
  root: any,
  {
    id,
  }: {
    id: string;
  },
  context: KeystoneContext
): Promise<ReportCreateInput> {
  // query the current user
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  // get the original proposal board
  const proposal = await context.query.ProposalBoard.findOne({
    where: { id: id },
    query: "id sections { id cards { id } }",
  });

  if (proposal.sections.length) {
    // delete all cards
    const cardIds = proposal.sections
      .map((section) => section.cards.map((card) => ({ id: card.id })))
      .flat();
    if (cardIds.length) {
      await context.db.ProposalCard.deleteMany({
        where: cardIds,
      });
    }
    // delete all sections
    const sectionIds = proposal.sections.map((section) => ({ id: section.id }));
    await context.db.ProposalSection.deleteMany({
      where: sectionIds,
    });
  }

  return context.query.ProposalBoard.deleteOne({
    where: { id: id },
    query: "id",
  });
}

export default deleteProposal;
