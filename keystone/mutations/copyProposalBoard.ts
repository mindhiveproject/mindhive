async function copyProposalBoard(
  root: any,
  {
    id,
    study,
  }: {
    id: string;
    study: string;
  },
  context: KeystoneContext
): Promise<ReportCreateInput> {
  // query the current user
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  // get the original proposal board
  const template = await context.query.ProposalBoard.findOne({
    where: { id: id },
    query:
      "id slug title description settings sections { id title position cards { id type title description position content } }",
  });

  // make a full copy
  const argumentsToCopy = {
    title: template.title,
    description: template.description,
    settings: template.settings,
    slug: `${template.slug}-${Date.now()}-${Math.round(
      Math.random() * 100000
    )}`,
  };

  // create a new board
  const board = await context.db.ProposalBoard.createOne(
    {
      data: {
        author: {
          connect: {
            id: sesh.itemId,
          },
        },
        study: {
          connect: {
            id: study,
          },
        },
        ...argumentsToCopy,
      },
    },
    "id"
  );

  // create new sections
  await Promise.all(
    template.sections.map(async (section, i) => {
      const templateSection = template.sections[i];
      const newSection = await context.db.ProposalSection.createOne(
        {
          data: {
            title: templateSection.title,
            position: templateSection.position,
            board: {
              connect: { id: board.id },
            },
          },
        },
        "id"
      );
      // create cards of this section
      await Promise.all(
        templateSection.cards.map(async (card, i) => {
          const templateCard = section.cards[i];
          await context.db.ProposalCard.createOne(
            {
              data: {
                section: {
                  connect: {
                    id: newSection.id,
                  },
                },
                type: templateCard.type,
                title: templateCard.title,
                description: templateCard.description,
                content: templateCard.content,
                position: templateCard.position,
              },
            },
            "id"
          );
        })
      );
    })
  );

  return board;
}

export default copyProposalBoard;
