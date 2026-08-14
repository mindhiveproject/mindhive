// Copy a milestone's current review FormDefinition onto the template
// board (scope=project_board) so the teacher can edit it without
// mutating the global MindHive form. Idempotent: if this board already
// has a project_board row for the source key, that row is returned.
import { assertTemplateBoardTeacher } from "./resolveMilestonesForBoard";
import {
  copyFormCardsAndFields,
  FORM_DEFINITION_NESTED_QUERY,
} from "./createTemplateMilestone";

type ForkReviewFormForBoardArgs = {
  templateBoardId: string;
  milestoneId: string;
};

function boardScopeData(proposalBoardId: string) {
  return {
    scope: "project_board" as const,
    proposalBoard: { connect: { id: proposalBoardId } },
  };
}

async function forkReviewFormForBoard(
  _root: unknown,
  { templateBoardId, milestoneId }: ForkReviewFormForBoardArgs,
  context: any
) {
  if (!templateBoardId || !milestoneId) {
    throw new Error("templateBoardId and milestoneId are required.");
  }
  await assertTemplateBoardTeacher(context, templateBoardId);
  const sudo = context.sudo();
  const sessionId = context.session?.itemId;

  const milestone = await context.query.Milestone.findOne({
    where: { id: milestoneId },
    query: `
      id
      key
      title
      scope
      statusTarget
      actionCardType
      formDefinitionKeyPattern
      templateBoard { id }
      formDefinition {
        id
        key
        title
        description
        scope
        proposalBoard { id }
      }
    `,
  });
  if (!milestone) {
    throw new Error("Milestone not found.");
  }
  if (
    milestone.statusTarget === "study" ||
    milestone.actionCardType === "ACTION_COLLECTING_DATA"
  ) {
    throw new Error(
      "This milestone is linked to the study and does not have a review questionnaire."
    );
  }

  const sourceId = milestone.formDefinition?.id || null;
  const sourceKey = milestone.formDefinition?.key || null;

  if (
    milestone.formDefinition?.scope === "project_board" &&
    milestone.formDefinition?.proposalBoard?.id === templateBoardId
  ) {
    return sudo.db.FormDefinition.findOne({
      where: { id: String(milestone.formDefinition.id) },
    });
  }

  if (sourceKey) {
    const existingOnBoard = await sudo.query.FormDefinition.findMany({
      where: {
        key: { equals: sourceKey },
        scope: { equals: "project_board" },
        proposalBoard: { id: { equals: templateBoardId } },
        status: { in: ["draft", "published"] },
      },
      query: "id version",
      orderBy: [{ version: "desc" }],
      take: 1,
    });
    if (existingOnBoard[0]?.id) {
      await maybeConnectTemplateMilestone(
        sudo,
        milestone,
        templateBoardId,
        existingOnBoard[0].id
      );
      return sudo.db.FormDefinition.findOne({
        where: { id: String(existingOnBoard[0].id) },
      });
    }
  }

  let source = sourceId
    ? await sudo.query.FormDefinition.findOne({
        where: { id: sourceId },
        query: FORM_DEFINITION_NESTED_QUERY,
      })
    : null;

  if (!source && sourceKey) {
    const published = await sudo.query.FormDefinition.findMany({
      where: {
        key: { equals: sourceKey },
        status: { equals: "published" },
      },
      query: FORM_DEFINITION_NESTED_QUERY,
      orderBy: [{ version: "desc" }],
      take: 1,
    });
    source = published[0] || null;
  }

  const formKey = source?.key || sourceKey || `review_${milestone.key}`;
  const milestoneTitle = milestone.title || milestone.key || "Milestone";

  const definition = await sudo.db.FormDefinition.createOne(
    {
      data: {
        key: formKey,
        title: source?.title || `${milestoneTitle} review form`,
        description: source?.description || "",
        ...boardScopeData(templateBoardId),
        surface: "feedback",
        status: source ? "published" : "draft",
        version: 1,
        ...(source ? { publishedAt: new Date() } : {}),
        ...(sessionId ? { createdBy: { connect: { id: sessionId } } } : {}),
        ...(source && sessionId
          ? { publishedBy: { connect: { id: sessionId } } }
          : {}),
        changelog: source
          ? `Forked from form definition ${source.id} (${source.key}) for template board ${templateBoardId}.`
          : `Draft review form forked for milestone ${milestone.key}.`,
      },
    },
    "id"
  );

  if (source) {
    await copyFormCardsAndFields(sudo, source, definition.id);
  } else {
    await sudo.db.FormCard.createOne(
      {
        data: {
          definition: { connect: { id: definition.id } },
          cardType: "fields",
          title: "",
          order: 0,
        },
      },
      "id"
    );
  }

  await maybeConnectTemplateMilestone(
    sudo,
    milestone,
    templateBoardId,
    definition.id
  );

  return sudo.db.FormDefinition.findOne({
    where: { id: String(definition.id) },
  });
}

async function maybeConnectTemplateMilestone(
  sudo: any,
  milestone: {
    id: string;
    scope?: string | null;
    templateBoard?: { id?: string | null } | null;
  },
  templateBoardId: string,
  formDefinitionId: string
) {
  if (
    milestone.scope !== "template" ||
    milestone.templateBoard?.id !== templateBoardId
  ) {
    return;
  }
  await sudo.db.Milestone.updateOne({
    where: { id: String(milestone.id) },
    data: {
      formDefinition: { connect: { id: formDefinitionId } },
    },
  });
}

export default forkReviewFormForBoard;
