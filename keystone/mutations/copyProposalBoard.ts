import uniqid from "uniqid";
import { provisionFormDefinitionForMilestone } from "./createTemplateMilestone";
import {
  isClassTemplateBoard,
  syncClassTemplateBoards,
} from "./utils/classTemplateBoards";
import { isAdmin } from "../access";

const { isFirstBoardInClass } = require("../lib/mainProject");
const { shouldReuseAssignments } = require("../lib/classAssignmentCopies");

// Copies run with limited parallelism. Creating every section, card and
// assignment at once (each insert also access-checks what it connects)
// exhausted the database connection pool on large boards: the copy failed
// after Prisma's 10s pool timeout, and every other request stalled meanwhile.
const CARD_CONCURRENCY = 4;

/** Runs fn over items with at most `limit` in flight; stops on first error. */
async function forEachLimited<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let next = 0;
  let failed = false;
  const worker = async () => {
    while (!failed && next < items.length) {
      const index = next++;
      try {
        await fn(items[index], index);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
}

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

  // Only class staff (or admins) may create a class template. Checked before
  // anything is written: the copy used to fail on the Class update further
  // down, after the new board had already been created.
  if (classIdTemplate && !isAdmin({ session: sesh })) {
    const me = String(sesh.itemId);
    const staffOfClass = await context.sudo().db.Class.count({
      where: {
        id: { equals: classIdTemplate },
        OR: [
          { creator: { id: { equals: me } } },
          { teachingTeam: { some: { id: { equals: me } } } },
          { mentors: { some: { id: { equals: me } } } },
        ],
      },
    });
    if (!staffOfClass) {
      throw new Error(
        "Forbidden: only the class's teachers and mentors can create its templates."
      );
    }
  }

  // The students' first board in the class starts as their main project.
  // Counted over the students on the new board, not its author: a teacher who
  // creates a board for a student is the author but not a member
  // (lib/mainProject.js).
  let shouldBeMain = false;
  if (classIdUsed) {
    try {
      shouldBeMain = await isFirstBoardInClass({
        prisma: context.prisma,
        classId: classIdUsed,
        memberIds: [String(sesh.itemId), ...(collaborators || [])],
      });
    } catch (error) {
      // On any failure, fall back to not setting isMain automatically.
      shouldBeMain = false;
    }
  }

  // get the original proposal board with additional relationships
  const template = await context.query.ProposalBoard.findOne({
    where: { id: id },
    query:
      `id publicId slug title description isTemplate settings resources { id } templateForClasses { id } templatesForClass { id } ${TEMPLATE_MILESTONES_QUERY} sections { id publicId title position cards { id publicId type shareType title description settings position content comment resources { id } studies { id } tasks { id } milestone { id } } }`,
  });

  // Whether the source is a class template depends on its class links, which
  // a caller outside those classes cannot read (they would come back empty
  // and a student's copy would duplicate assignments instead of reusing
  // them). Only the link ids are read, as sudo.
  if (template) {
    const links = await context.sudo().query.ProposalBoard.findOne({
      where: { id },
      query: "templateForClasses { id } templatesForClass { id }",
    });
    template.templateForClasses = links?.templateForClasses ?? [];
    template.templatesForClass = links?.templatesForClass ?? [];
  }

  // The template cards' assignments, read as the caller in one query: the
  // assignment access filter is expensive, and selecting `assignments` on each
  // card ran it once per card (48 times for a 48-card board). Same rows, same
  // access check, just batched.
  if (template?.sections?.length) {
    const linkedAssignments = await context.query.Assignment.findMany({
      where: {
        proposalCards: {
          some: { section: { board: { id: { equals: id } } } },
        },
      },
      query:
        "id title content placeholder settings public isTemplate tags { id } proposalCards { id }",
    });
    for (const section of template.sections) {
      for (const card of section.cards || []) {
        card.assignments = linkedAssignments
          .filter((a: any) => a.proposalCards?.some((pc: any) => pc.id === card.id))
          .map(({ proposalCards, ...a }: any) => a);
      }
    }
  }

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

  // Independent copies (class-template copy, or a generic teacher copy with
  // no classIdUsed) get their own template-scope Milestone rows + forms and
  // no clonedFrom link: clonedFrom is what applyTemplateBoardChanges
  // propagates along, and a teacher's board must not receive (or relay to its
  // students) edits made to the admin/platform board it was copied from.
  // Student/working boards (classIdUsed without classIdTemplate) keep
  // clonedFrom so they follow their class template, and keep sharing the
  // source template's milestone ids (resolved via clonedFrom).
  const isIndependentCopy = !!classIdTemplate || !classIdUsed;

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
        clonedFrom:
          id && !isIndependentCopy
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
    // The caller is class staff (checked above); the backfill only links
    // boards already tied to this class, so it runs as sudo like the
    // syncClassTemplateBoards mutation does.
    await syncClassTemplateBoards(context.sudo(), classIdTemplate);
  }

  const milestoneIdMap = isIndependentCopy
    ? await cloneTemplateMilestonesOntoBoard(
        context,
        template.templateMilestones,
        board.id
      )
    : new Map<string, string>();

  // Whether this copy reuses the source's assignment rows; see
  // shouldReuseAssignments (lib/classAssignmentCopies).
  const reuseAssignments = shouldReuseAssignments({
    classIdTemplate,
    sourceIsClassTemplate: isClassTemplateBoard(template),
  });
  // Source assignment id → its row and the new cards that link it.
  const assignmentCopies = new Map<string, { source: any; cardIds: string[] }>();

  // create new sections
  await forEachLimited(
    template.sections || [],
    1,
    async (section: any, i: number) => {
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
      await forEachLimited(
        templateSection.cards || [],
        CARD_CONCURRENCY,
        async (card: any, i: number) => {
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

          // Assignments: a student/working copy of a class template links the
          // template's own rows (the students answer the class's
          // assignments). Every other copy gets its own rows, created once
          // per source assignment after all cards exist (below); here we
          // only record which new cards link each source assignment.
          // The assignment writes run as sudo (approved by the project
          // owner, 2026-10-06). Every assignment id here came from `template`,
          // which was read as the caller, so it is one the caller may read.
          // Re-checking each id via connect ran the expensive assignment
          // access filter once per link and timed out copies of large boards.
          // sudo keeps the session, so author hooks still credit the caller.
          if (templateCard.assignments?.length > 0) {
            if (reuseAssignments) {
              await context.sudo().db.ProposalCard.updateOne({
                where: { id: newCard.id },
                data: {
                  assignments: {
                    connect: templateCard.assignments.map((a: any) => ({ id: a.id })),
                  },
                },
              });
            } else {
              for (const a of templateCard.assignments) {
                const entry = assignmentCopies.get(a.id) || {
                  source: a,
                  cardIds: [] as string[],
                };
                entry.cardIds.push(String(newCard.id));
                assignmentCopies.set(a.id, entry);
              }
            }
          }
        }
      );
    }
  );

  // One copy per source assignment, linked to every new card that had it (an
  // assignment linked on two cards stays one assignment). A copy made into a
  // class template (classIdTemplate) belongs to that class only and starts
  // unpublished: the class's staff decide when its students see it. Linking
  // from the Assignment side skips the ProposalCard hook; the new rows are
  // already connected to the class.
  await forEachLimited(
    [...assignmentCopies.values()],
    1,
    async ({ source: a, cardIds }) => {
      await context.sudo().db.Assignment.createOne(
        {
          data: {
            title: a.title,
            content: a.content,
            placeholder: a.placeholder,
            settings: a.settings,
            public: classIdTemplate || template.isTemplate ? false : a.public,
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
            proposalCards: { connect: cardIds.map((cardId) => ({ id: cardId })) },
          },
        },
        "id"
      );
    }
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
      await forEachLimited(resourceIds, CARD_CONCURRENCY, async (resourceId) => {
        await context.db.Resource.updateOne({
          where: { id: resourceId },
          data: {
            classes: { connect: [{ id: classIdTemplate }] },
          },
        });
      });
    }
  }

  return board;
}

export default copyProposalBoard;
