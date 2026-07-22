import uniqid from "uniqid";
import {
  assertTemplateBoardTeacher,
  slugifyMilestoneKey,
} from "./resolveMilestonesForBoard";

async function resolvePermissionIds(
  context: any,
  names: string[]
): Promise<string[]> {
  if (!names.length) return [];
  const permissions = await context.query.Permission.findMany({
    where: { name: { in: names } },
    query: "id name",
  });
  const found = new Map(
    (permissions || []).map((p: { id: string; name: string }) => [p.name, p.id])
  );
  return names.filter((name) => found.has(name)).map((name) => found.get(name) as string);
}

async function resolveFormDefinitionIdFromKey(
  context: any,
  key?: string
): Promise<string | null> {
  if (!key) return null;
  const definitions = await context.query.FormDefinition.findMany({
    where: {
      key: { equals: key },
      status: { equals: "published" },
    },
    query: "id version",
    orderBy: [{ version: "desc" }],
    take: 1,
  });
  return definitions[0]?.id || null;
}

async function uniqueCopiedFormKey(context: any, milestoneKey: string) {
  const base = `review_${milestoneKey}`;
  let key = base;
  let suffix = 1;
  while (true) {
    const existing = await context.query.FormDefinition.findMany({
      where: { key: { equals: key } },
      query: "id",
      take: 1,
    });
    if (!existing.length) return key;
    key = `${base}_${suffix++}`;
  }
}

const FORM_DEFINITION_NESTED_QUERY = `
  id
  key
  title
  description
  cards(orderBy: { order: asc }) {
    id
    cardType
    title
    titleI18n
    description
    descriptionI18n
    visibleWhenStatus
    roleVisibility
    order
    fields(orderBy: { order: asc }) {
      id
      name
      fieldType
      label
      labelI18n
      helperText
      helperTextI18n
      placeholder
      placeholderI18n
      isRequired
      order
      storage
      storageColumn
      storageBucket
      storageEntity
      options
      validation
      defaultValue
      showWhen
      jsonArraySchema
      visibilityRoles
    }
  }
`;

async function copyFormCardsAndFields(
  sudo: any,
  source: { cards?: any[] },
  definitionId: string
) {
  let cardsCreated = 0;
  for (const card of source.cards || []) {
    const newCard = await sudo.db.FormCard.createOne(
      {
        data: {
          definition: { connect: { id: definitionId } },
          cardType: card.cardType || "fields",
          title: card.title || "",
          titleI18n: card.titleI18n || null,
          description: card.description || "",
          descriptionI18n: card.descriptionI18n || null,
          visibleWhenStatus: card.visibleWhenStatus || null,
          roleVisibility: card.roleVisibility || null,
          order: card.order ?? 0,
        },
      },
      "id"
    );
    cardsCreated += 1;

    for (const field of card.fields || []) {
      await sudo.db.FormField.createOne(
        {
          data: {
            card: { connect: { id: newCard.id } },
            name: field.name,
            fieldType: field.fieldType,
            label: field.label || "",
            labelI18n: field.labelI18n || null,
            helperText: field.helperText || "",
            helperTextI18n: field.helperTextI18n || null,
            placeholder: field.placeholder || "",
            placeholderI18n: field.placeholderI18n || null,
            isRequired: !!field.isRequired,
            order: field.order ?? 0,
            storage: field.storage,
            storageColumn: field.storageColumn || "",
            storageBucket: field.storageBucket || "",
            storageEntity: field.storageEntity || "self",
            options: field.options || null,
            validation: field.validation || null,
            defaultValue: field.defaultValue ?? null,
            showWhen: field.showWhen || null,
            jsonArraySchema: field.jsonArraySchema || null,
            visibilityRoles: field.visibilityRoles || null,
          },
        },
        "id"
      );
    }
  }

  if ((source.cards || []).length > 0 && cardsCreated === 0) {
    throw new Error("Failed to copy form cards from source definition.");
  }
}

async function provisionFormDefinitionForMilestone(
  context: any,
  sudo: any,
  {
    sourceFormDefinitionId,
    milestoneKey,
    milestoneTitle,
    proposalBoardId,
  }: {
    sourceFormDefinitionId: string | null;
    milestoneKey: string;
    milestoneTitle: string;
    proposalBoardId: string;
  }
): Promise<{ id: string; key: string }> {
  const sessionId = context.session?.itemId;
  const formKey = await uniqueCopiedFormKey(sudo, milestoneKey);

  // Every auto-provisioned form is scoped to the specific template
  // board that owns the milestone. This keeps per-board customisation
  // isolated (project_board > class_network > organization > global at
  // resolve time) instead of polluting the global namespace with N
  // uniquely-keyed forms.
  const boardScopeData = {
    scope: "project_board" as const,
    proposalBoard: { connect: { id: proposalBoardId } },
  };

  if (sourceFormDefinitionId) {
    const source = await sudo.query.FormDefinition.findOne({
      where: { id: sourceFormDefinitionId },
      query: FORM_DEFINITION_NESTED_QUERY,
    });
    if (!source) {
      throw new Error(
        `Source form definition ${sourceFormDefinitionId} not found.`
      );
    }

    const definition = await sudo.db.FormDefinition.createOne(
      {
        data: {
          key: formKey,
          title: `${milestoneTitle} review form`,
          description: source.description || "",
          ...boardScopeData,
          status: "published",
          version: 1,
          publishedAt: new Date(),
          ...(sessionId ? { createdBy: { connect: { id: sessionId } } } : {}),
          ...(sessionId ? { publishedBy: { connect: { id: sessionId } } } : {}),
          changelog: `Copied from form definition ${source.id} (${source.key}) for template milestone ${milestoneKey}.`,
        },
      },
      "id"
    );

    await copyFormCardsAndFields(sudo, source, definition.id);
    return { id: definition.id, key: formKey };
  }

  const definition = await sudo.db.FormDefinition.createOne(
    {
      data: {
        key: formKey,
        title: `${milestoneTitle} review form`,
        description: "",
        ...boardScopeData,
        status: "draft",
        version: 1,
        ...(sessionId ? { createdBy: { connect: { id: sessionId } } } : {}),
        changelog: `Draft form created for template milestone ${milestoneKey}.`,
      },
    },
    "id"
  );

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

  return { id: definition.id, key: formKey };
}

type CreateTemplateMilestoneInput = {
  templateBoardId: string;
  title: string;
  description?: string;
  formDefinitionId?: string;
  sourceFormDefinitionKey?: string;
  clonedFromMilestoneId?: string;
  canReviewPermissionIds?: string[];
  canReviewPermissionNames?: string[];
  showInFeedbackCenter?: boolean;
  statusTarget?: "board" | "study";
  sectionId?: string;
};

async function createTemplateMilestone(
  _root: unknown,
  { input }: { input: CreateTemplateMilestoneInput },
  context: any
) {
  await assertTemplateBoardTeacher(context, input.templateBoardId);
  const sudo = context.sudo();

  const existingTemplate = await context.query.Milestone.findMany({
    where: {
      scope: { equals: "template" },
      templateBoard: { id: { equals: input.templateBoardId } },
    },
    query: "id position",
    orderBy: [{ position: "desc" }],
    take: 1,
  });
  const nextPosition = (existingTemplate[0]?.position ?? -1) + 1;

  const keyBase = slugifyMilestoneKey(input.title, `milestone_${uniqid()}`);
  let key = keyBase;
  let suffix = 1;
  while (true) {
    const dup = await context.query.Milestone.findMany({
      where: {
        key: { equals: key },
        scope: { equals: "template" },
        templateBoard: { id: { equals: input.templateBoardId } },
      },
      query: "id",
      take: 1,
    });
    if (!dup.length) break;
    key = `${keyBase}_${suffix++}`;
  }

  const permissionIds =
    input.canReviewPermissionIds?.length
      ? input.canReviewPermissionIds
      : await resolvePermissionIds(
          context,
          input.canReviewPermissionNames || ["MENTOR", "TEACHER", "SCIENTIST"]
        );

  const sourceMilestone = input.clonedFromMilestoneId
    ? await context.query.Milestone.findOne({
        where: { id: input.clonedFromMilestoneId },
        query: "id formDefinition { id }",
      })
    : null;
  if (input.clonedFromMilestoneId && !sourceMilestone) {
    throw new Error("Source milestone not found.");
  }
  const sourceFormDefinitionId =
    input.formDefinitionId ||
    sourceMilestone?.formDefinition?.id ||
    (await resolveFormDefinitionIdFromKey(
      context,
      input.sourceFormDefinitionKey
    ));
  const formDefinition = await provisionFormDefinitionForMilestone(
    context,
    sudo,
    {
      sourceFormDefinitionId,
      milestoneKey: key,
      milestoneTitle: input.title,
      proposalBoardId: input.templateBoardId,
    }
  );

  const milestone = await sudo.db.Milestone.createOne(
    {
      data: {
        key,
        title: input.title,
        description: input.description || "",
        scope: "template",
        templateBoard: { connect: { id: input.templateBoardId } },
        reviewStage: key,
        statusTarget: input.statusTarget || "board",
        logEventName: `MILESTONE_SUBMITTED_${key.toUpperCase()}`,
        position: nextPosition,
        showInFeedbackCenter: input.showInFeedbackCenter ?? true,
        formDefinitionKeyPattern: formDefinition.key,
        formDefinition: { connect: { id: formDefinition.id } },
        ...(input.clonedFromMilestoneId
          ? {
              clonedFrom: { connect: { id: input.clonedFromMilestoneId } },
            }
          : {}),
        canReview: permissionIds.length
          ? { connect: permissionIds.map((id: string) => ({ id })) }
          : undefined,
      },
    },
    "id"
  );

  let sectionId = input.sectionId;
  if (!sectionId) {
    const sections = await context.query.ProposalSection.findMany({
      where: { board: { id: { equals: input.templateBoardId } } },
      query: "id position",
      orderBy: [{ position: "desc" }],
      take: 1,
    });
    sectionId = sections[0]?.id;
    if (!sectionId) {
      const section = await context.db.ProposalSection.createOne(
        {
          data: {
            title: "Review Steps",
            board: { connect: { id: input.templateBoardId } },
            position: 0,
          },
        },
        "id"
      );
      sectionId = section.id;
    }
  }

  const cards = await context.query.ProposalCard.findMany({
    where: { section: { id: { equals: sectionId } } },
    query: "id position",
    orderBy: [{ position: "desc" }],
    take: 1,
  });
  const cardPosition = (cards[0]?.position ?? 0) + 1;

  await context.db.ProposalCard.createOne(
    {
      data: {
        title: input.title,
        publicId: uniqid.time(),
        description: input.description || "",
        type: "ACTION",
        position: cardPosition,
        section: { connect: { id: sectionId } },
        milestone: { connect: { id: milestone.id } },
        settings: { status: "Not started" },
      },
    },
    "id"
  );

  // Use context.db (raw Prisma) not context.query. context.query hands
  // back pre-serialized values which cause the framework to re-resolve
  // relationship fields (like formDefinition) and hit "Prisma error"
  // when reconciling. context.db returns raw rows; GraphQL resolves
  // sub-selections cleanly via the auto-generated field resolvers.
  return context.db.Milestone.findOne({
    where: { id: String(milestone.id) },
  });
}

export default createTemplateMilestone;
