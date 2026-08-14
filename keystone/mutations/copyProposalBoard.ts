import uniqid from "uniqid";
import { provisionFormDefinitionForMilestone } from "./createTemplateMilestone";
import { syncClassTemplateBoards } from "./utils/classTemplateBoards";

const TEMPLATE_MILESTONES_QUERY =
  "templateMilestones { id key title description scope actionCardType reviewStage statusTarget logEventName position showInFeedbackCenter isActive formDefinition { id } canReview { id } }";

async function cloneTemplateMilestonesOntoBoard(
  context: any,
  sourceMilestones: any[] | null | undefined,
  newBoardId: string
): Promise<Map<string, string>> {
  const milestoneIdMap = new Map<string, string>();
  const owned = (sourceMilestones || []).filter(
    (m) => m?.id && (!m.scope || m.scope === "template")
  );
  if (!owned.length) return milestoneIdMap;

  const sudo = context.sudo();
  for (const source of owned) {
    const formDefinition = await provisionFormDefinitionForMilestone(
      context,
      sudo,
      {
        sourceFormDefinitionId: source.formDefinition?.id || null,
        milestoneKey: source.key,
        milestoneTitle: source.title || source.key,
        proposalBoardId: newBoardId,
      }
    );

    const permissionIds = (source.canReview || [])
      .map((p: { id?: string }) => p?.id)
      .filter(Boolean);

    const created = await sudo.db.Milestone.createOne(
      {
        data: {
          key: source.key,
          title: source.title,
          description: source.description || "",
          scope: "template",
          templateBoard: { connect: { id: newBoardId } },
          ...(source.actionCardType
            ? { actionCardType: source.actionCardType }
            : {}),
          reviewStage: source.reviewStage || source.key,
          statusTarget: source.statusTarget || "board",
          logEventName:
            source.logEventName ||
            `MILESTONE_SUBMITTED_${String(source.key || "").toUpperCase()}`,
          position: source.position ?? 0,
          showInFeedbackCenter: source.showInFeedbackCenter ?? true,
          isActive: source.isActive !== false,
          formDefinitionKeyPattern: formDefinition.key,
          formDefinition: { connect: { id: formDefinition.id } },
          clonedFrom: { connect: { id: source.id } },
          canReview: permissionIds.length
            ? { connect: permissionIds.map((id: string) => ({ id })) }
            : undefined,
        },
      },
      "id"
    );
    milestoneIdMap.set(source.id, String(created.id));
  }

  return milestoneIdMap;
}

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
      `id publicId slug title description isTemplate settings resources { id } templateForClasses { id } templatesForClass { id } ${TEMPLATE_MILESTONES_QUERY} sections { id publicId title position cards { id publicId type shareType title description settings position content comment resources { id } assignments { id title content placeholder settings public isTemplate tags { id } } studies { id } tasks { id } milestone { id } } }`,
  });

  let boardSettings = template.settings;
  if (classIdTemplate) {
    const mergedSettings =
      template.settings && typeof template.settings === "object"
        ? { ...template.settings }
        : {};
    const existingIds = Array.isArray(mergedSettings.visibleToStudentInClassIds)
      ? [...mergedSettings.visibleToStudentInClassIds]
      : [];
    if (!existingIds.includes(classIdTemplate)) {
      existingIds.push(classIdTemplate);
    }
    boardSettings = {
      ...mergedSettings,
      visibleToStudentInClassIds: existingIds,
    };
  }

  // make a full copy
  const argumentsToCopy = {
    title: title || template.title,
    description: template.description,
    settings: boardSettings,
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
        creator: {
          connect: {
            id: sesh.itemId,
          },
        },
        collaborators: collaborators
          ? {
              connect: collaborators.map((c) => ({ id: c })),
            }
          : null,
        templatesForClass: classIdTemplate
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

  if (classIdTemplate) {
    const classRecord = await context.query.Class.findOne({
      where: { id: classIdTemplate },
      query: "id templateProposal { id }",
    });
    if (!classRecord?.templateProposal?.id) {
      await context.db.Class.updateOne({
        where: { id: classIdTemplate },
        data: {
          templateProposal: { connect: { id: board.id } },
          classTemplateBoards: { connect: { id: board.id } },
        },
      });
    }
  }

  if (classIdTemplate) {
    await syncClassTemplateBoards(context, classIdTemplate);
  }

  // Independent copies (class-template copy, or a generic teacher copy with
  // no classIdUsed) get their own template-scope Milestone rows + forms.
  // Student/working boards (classIdUsed without classIdTemplate) keep sharing
  // the source template's milestone ids and resolve via clonedFrom.
  const isIndependentCopy = !!classIdTemplate || !classIdUsed;
  const milestoneIdMap = isIndependentCopy
    ? await cloneTemplateMilestonesOntoBoard(
        context,
        template.templateMilestones,
        board.id
      )
    : new Map<string, string>();

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
      // Milestone FK rules:
      // - Global milestones are always reused by id.
      // - Independent copies remap template-scope ids to the clones created above.
      // - Student boards keep the source template's milestone ids (resolve via clonedFrom).
      await Promise.all(
        templateSection.cards.map(async (card: any, i: number) => {
          const templateCard = section.cards[i];
          const sourceMilestoneId = templateCard.milestone?.id;
          const connectMilestoneId =
            (sourceMilestoneId && milestoneIdMap.get(sourceMilestoneId)) ||
            sourceMilestoneId;
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
                ...(connectMilestoneId
                  ? {
                      milestone: {
                        connect: { id: connectMilestoneId },
                      },
                    }
                  : {}),
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
            const isClassTemplate =
              (template.templateForClasses && template.templateForClasses.length > 0)
              || (template.templatesForClass && template.templatesForClass.length > 0);
            
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
