async function deleteProposal(
  root: any,
  {
    id,
  }: {
    id: string;
  },
  context: KeystoneContext
): Promise<ReportCreateInput> {
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  const profile = await context.query.Profile.findOne({
    where: { id: sesh.itemId },
    query: "permissions { canManageUsers }",
  });
  const isAdmin = (profile?.permissions || []).some(
    (p: { canManageUsers?: boolean }) => p.canManageUsers
  );

  const proposal = await context.query.ProposalBoard.findOne({
    where: { id: id },
    query: `
      id
      isTemplate
      creator { id }
      author { id }
      sections { id cards { id } }
    `,
  });

  if (!proposal) {
    throw new Error("Proposal board not found.");
  }

  if (!isAdmin) {
    if (proposal.isTemplate) {
      throw new Error("You cannot delete a public platform template.");
    }

    const isOwner =
      proposal.creator?.id === sesh.itemId
      || proposal.author?.id === sesh.itemId;

    if (!isOwner) {
      throw new Error("You can only delete project boards you created.");
    }
  }

  if (proposal.sections?.length) {
    const cardIds = proposal.sections
      .map((section: { cards: Array<{ id: string }> }) =>
        section.cards.map((card) => ({ id: card.id }))
      )
      .flat();
    if (cardIds.length) {
      await context.db.ProposalCard.deleteMany({
        where: cardIds,
      });
    }
    const sectionIds = proposal.sections.map((section: { id: string }) => ({
      id: section.id,
    }));
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
