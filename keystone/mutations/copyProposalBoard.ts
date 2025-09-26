async function copyProposalBoard(
  root: any,
  {
    id,
    study,
    title,
    classIdTemplate,
    classIdUsed,
    collaborators,
    isTemplate,
  }: {
    id: string;
    study: string;
    title: string;
    classIdTemplate: string;
    classIdUsed: string;
    collaborators: string[];
    isTemplate: boolean;
  },
  context: KeystoneContext
): Promise<ReportCreateInput> {
  // query the current user
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  // get the original proposal board with additional relationships
  const template = await context.query.ProposalBoard.findOne({
    where: { id: id },
    query:
      "id slug title description settings resources { id } sections { id title position cards { id type shareType title description settings position content comment resources { id } assignments { id } studies { id } tasks { id } } }",
  });

  // make a full copy
  const argumentsToCopy = {
    title: title || template.title,
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
        collaborators: collaborators
          ? {
              connect: collaborators.map((c) => ({ id: c })),
            }
          : null,
        templateForClasses: classIdTemplate
          ? {
              connect: {
                id: classIdTemplate,
              },
            }
          : null,
        usedInClass: classIdUsed
          ? {
              connect: {
                id: classIdUsed,
              },
            }
          : null,
        clonedFrom: id
          ? {
              connect: {
                id: id,
              },
            }
          : null,
        study: study
          ? {
              connect: {
                id: study,
              },
            }
          : null,
        resources:
          template?.resources?.length > 0
            ? {
                connect: template.resources.map((resource) => ({
                  id: resource.id,
                })),
              }
            : null,
        isTemplate: isTemplate,
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
                shareType: templateCard.shareType,
                title: templateCard.title,
                description: templateCard.description,
                content: templateCard.content,
                comment: templateCard.comment,
                position: templateCard.position,
                resources:
                  templateCard.resources?.length > 0
                    ? {
                        connect: templateCard.resources.map((resource) => ({
                          id: resource.id,
                        })),
                      }
                    : null,
                assignments:
                  templateCard.assignments?.length > 0
                    ? {
                        connect: templateCard.assignments.map((assignment) => ({
                          id: assignment.id,
                        })),
                      }
                    : null,
                studies:
                  templateCard.studies?.length > 0
                    ? {
                        connect: templateCard.studies.map((study) => ({
                          id: study.id,
                        })),
                      }
                    : null,
                tasks:
                  templateCard.tasks?.length > 0
                    ? {
                        connect: templateCard.tasks.map((task) => ({
                          id: task.id,
                        })),
                      }
                    : null,
                settings: templateCard.settings,
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
