// Clone a published global opportunity FormDefinition into a
// class-scoped draft the teacher or mentor can edit. Permission: class
// creator or mentor (or canManageUsers). Does not require canManageForms.
import uniqid from "uniqid";
import {
  INTRO_VIDEO_FIELD_NAME,
  introVideoFieldOverrides,
  isManagedIntroVideoSourceField,
} from "./saveClassFormDefinition";

async function assertClassTeacherOrMentor(context: any, classId: string) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in to do this.");
  }
  const klass = await context.query.Class.findOne({
    where: { id: classId },
    query: "id creator { id } mentors { id }",
  });
  if (!klass) {
    throw new Error("Class not found.");
  }
  const profile = await context.query.Profile.findOne({
    where: { id: session.itemId },
    query: "permissions { canManageUsers }",
  });
  const isAdmin = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers
  );
  if (!isAdmin) {
    const authorizedIds = [
      klass.creator?.id,
      ...(klass.mentors || []).map((m: any) => m?.id),
    ].filter(Boolean);
    if (!authorizedIds.includes(session.itemId)) {
      throw new Error(
        "Forbidden: only class creators or mentors can clone forms for this class."
      );
    }
  }
  return klass;
}

function slugify(raw: string, fallback: string) {
  const slug = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return slug || fallback;
}

async function cloneFormDefinitionForClass(
  _root: unknown,
  { sourceId, classId }: { sourceId: string; classId: string },
  context: any
) {
  if (!sourceId || !classId) {
    throw new Error("sourceId and classId are required.");
  }
  await assertClassTeacherOrMentor(context, classId);
  const sudo = context.sudo();

  const source = await context.query.FormDefinition.findOne({
    where: { id: sourceId },
    query: `
      id
      key
      title
      description
      scope
      status
      surface
      version
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
  if (!source) {
    throw new Error(`FormDefinition ${sourceId} not found.`);
  }
  if (source.status !== "published" || source.scope !== "global") {
    throw new Error(
      "Only published global forms can be cloned into a class."
    );
  }
  if (source.surface && source.surface !== "opportunity") {
    throw new Error("Only opportunity-surface forms can be cloned here.");
  }

  const title = `${source.title} (copy)`;
  const keyBase = `opportunity_class_${slugify(source.title, "form")}_${uniqid().slice(-6)}`;
  let key = keyBase;
  let suffix = 1;
  while (true) {
    const dup = await sudo.query.FormDefinition.findMany({
      where: {
        key: { equals: key },
        scope: { equals: "class" },
        class: { id: { equals: classId } },
      },
      query: "id",
      take: 1,
    });
    if (!dup.length) break;
    key = `${keyBase}_${suffix++}`;
  }

  const newDef = await sudo.query.FormDefinition.createOne({
    data: {
      key,
      title,
      description: source.description || "",
      scope: "class",
      surface: "opportunity",
      status: "draft",
      version: 1,
      class: { connect: { id: classId } },
      changelog: `Cloned from public form ${source.id} for class ${classId}.`,
    },
    query: "id",
  });

  let introVideoCloned = false;
  for (const card of source.cards || []) {
    const newCard = await sudo.query.FormCard.createOne({
      data: {
        definition: { connect: { id: newDef.id } },
        cardType: card.cardType || "fields",
        title: card.title || "",
        titleI18n: card.titleI18n || null,
        description: card.description || "",
        descriptionI18n: card.descriptionI18n || null,
        visibleWhenStatus: card.visibleWhenStatus || null,
        roleVisibility: card.roleVisibility || null,
        order: card.order ?? 0,
      },
      query: "id",
    });

    for (const f of card.fields || []) {
      // Preserve the managed Opportunity.videoFile mapping when cloning
      // the seeded intro-video field. Skip duplicates so class forms keep
      // a single videoFile question.
      if (isManagedIntroVideoSourceField(f)) {
        if (introVideoCloned) continue;
        introVideoCloned = true;
        const videoOverrides = introVideoFieldOverrides();
        await sudo.query.FormField.createOne({
          data: {
            card: { connect: { id: newCard.id } },
            label: f.label || "",
            labelI18n: f.labelI18n || null,
            helperText: f.helperText || "",
            helperTextI18n: f.helperTextI18n || null,
            placeholder: f.placeholder || "",
            placeholderI18n: f.placeholderI18n || null,
            isRequired: !!f.isRequired,
            order: f.order ?? 0,
            defaultValue: f.defaultValue ?? null,
            showWhen: f.showWhen || null,
            jsonArraySchema: f.jsonArraySchema || null,
            visibilityRoles: f.visibilityRoles || null,
            ...videoOverrides,
            name: INTRO_VIDEO_FIELD_NAME,
          },
          query: "id",
        });
        continue;
      }

      await sudo.query.FormField.createOne({
        data: {
          card: { connect: { id: newCard.id } },
          name: f.name,
          fieldType: f.fieldType,
          label: f.label || "",
          labelI18n: f.labelI18n || null,
          helperText: f.helperText || "",
          helperTextI18n: f.helperTextI18n || null,
          placeholder: f.placeholder || "",
          placeholderI18n: f.placeholderI18n || null,
          isRequired: !!f.isRequired,
          order: f.order ?? 0,
          // Teacher class forms always land in the content json bucket
          // so custom opportunity follow-ups don't need column wiring.
          storage: "json_bucket",
          storageColumn: "",
          storageBucket: "content",
          storageEntity: f.storageEntity || "self",
          options: f.options || null,
          validation: f.validation || null,
          defaultValue: f.defaultValue ?? null,
          showWhen: f.showWhen || null,
          jsonArraySchema: f.jsonArraySchema || null,
          visibilityRoles: f.visibilityRoles || null,
        },
        query: "id",
      });
    }
  }

  return sudo.db.FormDefinition.findOne({ where: { id: newDef.id } });
}

export default cloneFormDefinitionForClass;
