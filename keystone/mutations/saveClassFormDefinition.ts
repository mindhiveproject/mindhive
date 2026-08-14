// Create or update a class-scoped opportunity FormDefinition for the
// teacher form wizard. Teachers never touch storage / key / surface /
// scope — those are baked in here. Updates edit the same row in place
// (including after publish). Save as draft (publish=false) sets
// status="draft"; publish=true runs publishFormDefinition afterward.
import { canMutateFormDefinition } from "../access";
import { FIELD_TYPE_OPTIONS } from "../schemas/FormField";

const ALLOWED_FIELD_TYPES = new Set<string>(
  FIELD_TYPE_OPTIONS.map((o) => o.value)
);

/** Opportunity.videoFile — fixed mapping for the teacher intro-video question. */
export const INTRO_VIDEO_FIELD_NAME = "videoFile";
export const INTRO_VIDEO_VALIDATION = {
  maxFileSize: 500 * 1024 * 1024,
  allowedMimes: "video/mp4,video/webm",
};

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

type NormalizedClassField = {
  name: string;
  fieldType: string;
  label: string;
  helperText: string;
  placeholder: string;
  isRequired: boolean;
  order: number;
  options: any;
  storage: string;
  storageBucket: string;
  storageColumn: string;
  storageEntity: string;
  validation: typeof INTRO_VIDEO_VALIDATION | null;
};

export function slugify(raw: string, fallback: string) {
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

export function isIntroVideoFieldInput(field: {
  fieldType?: string | null;
  name?: string | null;
  storageColumn?: string | null;
}) {
  return (
    field?.fieldType === "file" ||
    field?.name === INTRO_VIDEO_FIELD_NAME ||
    field?.storageColumn === INTRO_VIDEO_FIELD_NAME
  );
}

/**
 * Source fields that already target Opportunity.videoFile (e.g. seeded
 * global form). Used when cloning so unrelated file uploads stay in JSON.
 */
export function isManagedIntroVideoSourceField(field: {
  name?: string | null;
  storageColumn?: string | null;
}) {
  return (
    field?.name === INTRO_VIDEO_FIELD_NAME ||
    field?.storageColumn === INTRO_VIDEO_FIELD_NAME
  );
}

/** Server-owned Opportunity.videoFile wiring — never taken from the client. */
export function introVideoFieldOverrides(): Pick<
  NormalizedClassField,
  | "name"
  | "fieldType"
  | "storage"
  | "storageBucket"
  | "storageColumn"
  | "storageEntity"
  | "validation"
  | "options"
> {
  return {
    name: INTRO_VIDEO_FIELD_NAME,
    fieldType: "file",
    storage: "column",
    storageBucket: "",
    storageColumn: INTRO_VIDEO_FIELD_NAME,
    storageEntity: "self",
    validation: INTRO_VIDEO_VALIDATION,
    options: null,
  };
}

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
        "Forbidden: only class creators or mentors can manage class forms."
      );
    }
  }
  return klass;
}

export function normalizeFields(
  fields: ClassFormFieldInput[],
  { allowIntroVideo = true }: { allowIntroVideo?: boolean } = {}
): NormalizedClassField[] {
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error("Add at least one question before saving.");
  }
  const used = new Set<string>();
  let introVideoCount = 0;
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

    if (allowIntroVideo && isIntroVideoFieldInput({ ...f, fieldType })) {
      introVideoCount += 1;
      if (introVideoCount > 1) {
        throw new Error(
          "Only one intro video upload question is allowed per form."
        );
      }
      if (used.has(INTRO_VIDEO_FIELD_NAME)) {
        throw new Error(
          "Only one intro video upload question is allowed per form."
        );
      }
      used.add(INTRO_VIDEO_FIELD_NAME);
      return {
        label,
        helperText: f.helperText || "",
        placeholder: f.placeholder || "",
        isRequired: !!f.isRequired,
        order: f.order ?? index,
        ...introVideoFieldOverrides(),
      };
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
      options: Array.isArray(f.options) ? f.options : null,
      storage: "json_bucket",
      storageBucket: "content",
      storageColumn: "",
      storageEntity: "self",
      validation: null,
    };
  });
}

export async function replaceCardFields(
  sudo: any,
  cardId: string,
  fields: NormalizedClassField[]
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
        validation: f.validation,
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

  await assertClassTeacherOrMentor(context, classId);
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
        class { id creator { id } mentors { id } }
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
        // Honor Save as draft: demote published (or other) rows unless
        // this save continues into publishFormDefinition below.
        ...(!publish ? { status: "draft" } : {}),
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
