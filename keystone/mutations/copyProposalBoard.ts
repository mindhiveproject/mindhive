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
  context: any
): Promise<any> {
  // query the current user
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  // get the original proposal board with additional relationships
  const template = await context.query.ProposalBoard.findOne({
    where: { id: id },
    query:
      "id publicId slug title description settings resources { id } templateForClasses { id } sections { id publicId title position cards { id publicId type shareType title description settings position content comment resources { id } assignments { id title content placeholder settings public isTemplate tags { id } } studies { id } tasks { id } } }",
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
        publicId: template.publicId,
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
                connect: template.resources.map((resource: any) => ({
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
    template.sections.map(async (section: any, i: number) => {
      const templateSection = template.sections[i];
      const newSection = await context.db.ProposalSection.createOne(
        {
          data: {
            publicId: templateSection.publicId,
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
        templateSection.cards.map(async (card: any, i: number) => {
          const templateCard = section.cards[i];
          // Create the new card first (without assignments)
          const newCard = await context.db.ProposalCard.createOne(
            {
              data: {
                publicId: templateCard.publicId,
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
                        connect: templateCard.resources.map((resource: any) => ({
                          id: resource.id,
                        })),
                      }
                    : null,
                studies:
                  templateCard.studies?.length > 0
                    ? {
                        connect: templateCard.studies.map((study: any) => ({
                          id: study.id,
                        })),
                      }
                    : null,
                tasks:
                  templateCard.tasks?.length > 0
                    ? {
                        connect: templateCard.tasks.map((task: any) => ({
                          id: task.id,
                        })),
                      }
                    : null,
                settings: templateCard.settings,
              },
            },
            "id"
          );

          // Handle assignments based on whether this is a student copy or teacher copy
          if (templateCard.assignments?.length > 0) {
            // Check if the template board is a class template (has templateForClasses set)
            const isClassTemplate = template.templateForClasses && template.templateForClasses.length > 0;
            
            if (isClassTemplate) {
              // Student copying from teacher's template: reuse the same assignment IDs
              await context.db.ProposalCard.updateOne({
                where: { id: newCard.id },
                data: {
                  assignments: {
                    connect: templateCard.assignments.map((a: any) => ({ id: a.id })),
                  },
                },
              });
            } else {
              // Teacher copying from platform template: create new assignments (not associated to any class)
              await Promise.all(
                templateCard.assignments.map(async (a: any) => {
                  await context.db.Assignment.createOne(
                    {
                      data: {
                        title: a.title,
                        content: a.content,
                        placeholder: a.placeholder,
                        settings: a.settings,
                        public: a.public,
                        isTemplate: false,
                        templateSource: { connect: { id: a.id } },
                        // carry tags
                        tags:
                          a.tags?.length > 0
                            ? { connect: a.tags.map((t: any) => ({ id: t.id })) }
                            : undefined,
                        // link to the new card
                        proposalCards: { connect: [{ id: newCard.id }] },
                      },
                    },
                    "id"
                  );
                })
              );
            }
          }
        })
      );
    })
  );

  return board;
}

export default copyProposalBoard;
