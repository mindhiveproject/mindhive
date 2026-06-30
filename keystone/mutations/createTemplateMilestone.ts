import uniqid from "uniqid";
import {
  assertTemplateBoardTeacher,
  slugifyMilestoneKey,
  MILESTONE_QUERY,
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

async function copyFormDefinitionForMilestone(
  context: any,
  sourceFormDefinitionId: string | null,
  milestoneKey: string,
  milestoneTitle: string
): Promise<{ id: string; key: string } | null> {
  if (!sourceFormDefinitionId) return null;

  const source = await context.query.FormDefinition.findOne({
    where: { id: sourceFormDefinitionId },
    query: `
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
    `,
  });
  if (!source) return null;

  const copiedKey = await uniqueCopiedFormKey(context, milestoneKey);
  const sessionId = context.session?.itemId;
  const definition = await context.db.FormDefinition.createOne(
    {
      data: {
        key: copiedKey,
        title: `${milestoneTitle} review form`,
        description: source.description || "",
        scope: "global",
        status: "published",
        version: 1,
        publishedAt: new Date().toISOString(),
        ...(sessionId ? { createdBy: { connect: { id: sessionId } } } : {}),
        ...(sessionId ? { publishedBy: { connect: { id: sessionId } } } : {}),
        changelog: `Copied from form definition ${source.id} (${source.key}) for template milestone ${milestoneKey}.`,
      },
    },
    "id"
  );

  for (const card of source.cards || []) {
    const newCard = await context.db.FormCard.createOne(
      {
        data: {
          definition: { connect: { id: definition.id } },
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

    for (const field of card.fields || []) {
      await context.db.FormField.createOne(
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

  return { id: definition.id, key: copiedKey };
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
  const copiedFormDefinition = await copyFormDefinitionForMilestone(
    context,
    sourceFormDefinitionId,
    key,
    input.title
  );

  const milestone = await context.db.Milestone.createOne(
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
        formDefinitionKeyPattern:
          copiedFormDefinition?.key || "review_{{key}}_{{curriculumType}}",
        formDefinition: copiedFormDefinition?.id
          ? { connect: { id: copiedFormDefinition.id } }
          : undefined,
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

  return context.query.Milestone.findOne({
    where: { id: milestone.id },
    query: MILESTONE_QUERY,
  });
}

export default createTemplateMilestone;
