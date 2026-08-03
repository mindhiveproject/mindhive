// Create or update a class-scoped opportunity FormDefinition for the
// teacher form wizard. Teachers never touch storage / key / surface /
// scope — those are baked in here. Updates edit the same row in place
// (including after publish).
import { canMutateFormDefinition } from "../access";
import { FIELD_TYPE_OPTIONS } from "../schemas/FormField";

const ALLOWED_FIELD_TYPES = new Set<string>(
  FIELD_TYPE_OPTIONS.map((o) => o.value)
);

type ClassFormFieldInput = {
  name?: string | null;
  fieldType: string;
  label: string;
  helperText?: string | null;
  placeholder?: string | null;
  isRequired?: boolean | null;
  options?: any;
  order?: number | null;
};

type SaveClassFormDefinitionInput = {
  classId: string;
  definitionId?: string | null;
  title: string;
  description?: string | null;
  fields: ClassFormFieldInput[];
  publish?: boolean | null;
};

function slugify(raw: string, fallback: string) {
  const slug = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return slug || fallback;
}

function uniqueFieldName(label: string, used: Set<string>, index: number) {
  const base = slugify(label, `question_${index + 1}`);
  let name = base;
  let n = 1;
  while (used.has(name)) {
    name = `${base}_${n++}`;
  }
  used.add(name);
  return name;
}

async function assertClassCreator(context: any, classId: string) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in to do this.");
  }
  const klass = await context.query.Class.findOne({
    where: { id: classId },
    query: "id creator { id }",
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
  if (!isAdmin && klass.creator?.id !== session.itemId) {
    throw new Error("Forbidden: only the class creator can manage class forms.");
  }
  return klass;
}

function normalizeFields(fields: ClassFormFieldInput[]) {
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error("Add at least one question before saving.");
  }
  const used = new Set<string>();
  return fields.map((f, index) => {
    const fieldType = String(f.fieldType || "").trim();
    if (!ALLOWED_FIELD_TYPES.has(fieldType)) {
      throw new Error(`Unsupported field type: ${fieldType}`);
    }
    const label = String(f.label || "").trim();
    if (!label) {
      throw new Error(`Question ${index + 1} needs a prompt.`);
    }
    if (
      (fieldType === "select" || fieldType === "multiselect") &&
      (!Array.isArray(f.options) || f.options.length === 0)
    ) {
      throw new Error(`"${label}" needs at least one choice.`);
    }
    const name =
      (f.name && slugify(f.name, "")) ||
      uniqueFieldName(label, used, index);
    if (!used.has(name)) used.add(name);
    return {
      name,
      fieldType,
      label,
      helperText: f.helperText || "",
      placeholder: f.placeholder || "",
      isRequired: !!f.isRequired,
      order: f.order ?? index,
      options:
        fieldType === "select" || fieldType === "multiselect"
          ? f.options
          : null,
      storage: "json_bucket",
      storageBucket: "content",
      storageColumn: "",
      storageEntity: "self",
    };
  });
}

async function replaceCardFields(
  sudo: any,
  cardId: string,
  fields: ReturnType<typeof normalizeFields>
) {
  const existing = await sudo.query.FormField.findMany({
    where: { card: { id: { equals: cardId } } },
    query: "id",
  });
  for (const row of existing) {
    await sudo.query.FormField.deleteOne({ where: { id: row.id } });
  }
  for (const f of fields) {
    await sudo.query.FormField.createOne({
      data: {
        card: { connect: { id: cardId } },
        name: f.name,
        fieldType: f.fieldType,
        label: f.label,
        helperText: f.helperText,
        placeholder: f.placeholder,
        isRequired: f.isRequired,
        order: f.order,
        options: f.options,
        storage: f.storage,
        storageBucket: f.storageBucket,
        storageColumn: f.storageColumn,
        storageEntity: f.storageEntity,
      },
      query: "id",
    });
  }
}

async function saveClassFormDefinition(
  _root: unknown,
  { input }: { input: SaveClassFormDefinitionInput },
  context: any
) {
  const { classId, definitionId, title, description, fields, publish } = input;
  if (!classId) throw new Error("classId is required.");
  if (!String(title || "").trim()) throw new Error("Title is required.");

  await assertClassCreator(context, classId);
  const normalizedFields = normalizeFields(fields || []);
  const sudo = context.sudo();
  const trimmedTitle = String(title).trim();
  const trimmedDescription = description ? String(description).trim() : "";

  let defId = definitionId || null;

  if (defId) {
    const existing = await context.query.FormDefinition.findOne({
      where: { id: defId },
      query: `
        id
        scope
        status
        class { id creator { id } }
        cards(orderBy: { order: asc }) { id }
      `,
    });
    if (!existing) throw new Error("Form definition not found.");
    if (
      existing.scope !== "class" ||
      existing.class?.id !== classId ||
      !canMutateFormDefinition(context.session, existing)
    ) {
      throw new Error("Forbidden: you cannot edit this form.");
    }

    await sudo.query.FormDefinition.updateOne({
      where: { id: defId },
      data: {
        title: trimmedTitle,
        description: trimmedDescription,
      },
    });

    let cardId = existing.cards?.[0]?.id;
    if (!cardId) {
      const card = await sudo.query.FormCard.createOne({
        data: {
          definition: { connect: { id: defId } },
          cardType: "fields",
          title: trimmedTitle,
          order: 0,
        },
        query: "id",
      });
      cardId = card.id;
    } else {
      await sudo.query.FormCard.updateOne({
        where: { id: cardId },
        data: { title: trimmedTitle },
      });
    }
    await replaceCardFields(sudo, cardId, normalizedFields);
  } else {
    const keyBase = `opportunity_class_${slugify(trimmedTitle, "form")}`;
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

    const created = await sudo.query.FormDefinition.createOne({
      data: {
        key,
        title: trimmedTitle,
        description: trimmedDescription,
        scope: "class",
        surface: "opportunity",
        status: "draft",
        version: 1,
        class: { connect: { id: classId } },
      },
      query: "id",
    });
    defId = created.id;

    const card = await sudo.query.FormCard.createOne({
      data: {
        definition: { connect: { id: defId } },
        cardType: "fields",
        title: trimmedTitle,
        order: 0,
      },
      query: "id",
    });
    await replaceCardFields(sudo, card.id, normalizedFields);
  }

  if (publish) {
    if (!defId) {
      throw new Error("Form definition id missing after save.");
    }
    // Reuse publishFormDefinition logic via dynamic import to keep
    // sibling-archive + validation behaviour consistent.
    const publishFormDefinition = (
      await import("./publishFormDefinition")
    ).default;
    return publishFormDefinition(_root, { id: defId }, context);
  }

  return sudo.db.FormDefinition.findOne({ where: { id: defId as string } });
}

export default saveClassFormDefinition;
