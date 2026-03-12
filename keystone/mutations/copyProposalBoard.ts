import uniqid from "uniqid";

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

  // Determine if this should be the first (main) board for this user in the given class
  let shouldBeMain = false;
  if (classIdUsed) {
    try {
      const existingBoardsForClassAndAuthor =
        await context.query.ProposalBoard.findMany({
          where: {
            author: { id: { equals: sesh.itemId } },
            usedInClass: { id: { equals: classIdUsed } },
          },
          query: "id",
          take: 1,
        });

      // If there are no existing boards authored by this user for this class,
      // mark the new board as main.
      shouldBeMain = !existingBoardsForClassAndAuthor.length;
    } catch (error) {
      // On any failure, fall back to not setting isMain automatically.
      shouldBeMain = false;
    }
  }

  // get the original proposal board with additional relationships
  const template = await context.query.ProposalBoard.findOne({
    where: { id: id },
    query:
      "id publicId slug title description isTemplate settings resources { id } templateForClasses { id } sections { id publicId title position cards { id publicId type shareType title description settings position content comment resources { id } assignments { id title content placeholder settings public isTemplate tags { id } } studies { id } tasks { id } } }",
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
        isMain: shouldBeMain,
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
        // Class templates are identified by templateForClasses; do not set isTemplate
        // when this copy is for a class (classIdTemplate). isTemplate is for platform-wide templates only.
        isTemplate: classIdTemplate ? false : isTemplate,
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
                publicId: templateCard.publicId ?? uniqid(),
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
                settings: templateCard.settings
                  ? {
                      ...templateCard.settings,
                      status: "Not started",
                    }
                  : { status: "Not started" },
              },
            },
            "id"
          );

          // Handle assignments based on whether this is a student copy or teacher copy.
          // When a teacher copies a platform/admin template into a class template
          // (classIdTemplate is provided, template.templateForClasses is empty),
          // any new assignments should be associated with that class so they
          // immediately appear in the class assignment context.
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
              // Teacher copying from platform template: create new assignments.
              // If this copy is being used as a class template (classIdTemplate),
              // also associate the new assignments with that class.
              await Promise.all(
                templateCard.assignments.map(async (a: any) => {
                  await context.db.Assignment.createOne(
                    {
                      data: {
                        title: a.title,
                        content: a.content,
                        placeholder: a.placeholder,
                        settings: a.settings,
                        public: template.isTemplate ? false : a.public,
                        isTemplate: false,
                        templateSource: { connect: { id: a.id } },
                        // carry tags
                        tags:
                          a.tags?.length > 0
                            ? { connect: a.tags.map((t: any) => ({ id: t.id })) }
                            : undefined,
                        ...(classIdTemplate
                          ? {
                              classes: {
                                connect: [{ id: classIdTemplate }],
                              },
                            }
                          : {}),
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

  // If this copy is being used as a class template (classIdTemplate),
  // ensure that any resources linked on the template's cards are also
  // associated with that class via Resource.classes, so they are
  // immediately visible in the class context (similar to what
  // applyTemplateBoardChanges and the ProposalBoard hooks do).
  if (classIdTemplate && template.sections?.length) {
    const resourceIdsSet = new Set<string>();
    for (const section of template.sections || []) {
      for (const card of section.cards || []) {
        for (const resource of card.resources || []) {
          if (resource?.id) {
            resourceIdsSet.add(resource.id);
          }
        }
      }
    }

    if (resourceIdsSet.size > 0) {
      const resourceIds = Array.from(resourceIdsSet);
      await Promise.all(
        resourceIds.map((resourceId) =>
          context.db.Resource.updateOne({
            where: { id: resourceId },
            data: {
              classes: { connect: [{ id: classIdTemplate }] },
            },
          })
        )
      );
    }
  }

  return board;
}

export default copyProposalBoard;
