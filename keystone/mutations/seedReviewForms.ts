// One-off mutation that inserts (or, with force, replaces) the nine global
// Review FormDefinitions (3 stages × 3 curricula). Idempotent by default:
// if a global definition for a given key already exists, it is left
// unchanged unless force=true.
//
// Admin-only: requires canManageUsers OR canManageForms.
import { ALL_REVIEW_FORM_SEEDS } from "./seedData/reviewForms";

type AnyContext = any;

async function deleteDefinitionTree(def: any, context: AnyContext) {
  for (const card of def.cards || []) {
    for (const f of card.fields || []) {
      await context.query.FormField.deleteOne({ where: { id: f.id } });
    }
    await context.query.FormCard.deleteOne({ where: { id: card.id } });
  }
  await context.query.FormDefinition.deleteOne({ where: { id: def.id } });
}

async function insertReviewFormSeed(
  seed: any,
  session: any,
  context: AnyContext
): Promise<string> {
  const definition = await context.query.FormDefinition.createOne({
    data: {
      key: seed.key,
      title: seed.title,
      description: seed.description,
      scope: "global",
      status: "published",
      version: 1,
      publishedAt: new Date().toISOString(),
      publishedBy: { connect: { id: session.itemId } },
      changelog: "Initial seed — review forms.",
    },
    query: "id",
  });

  for (let i = 0; i < seed.cards.length; i += 1) {
    const cardSeed = seed.cards[i];
    const card = await context.query.FormCard.createOne({
      data: {
        definition: { connect: { id: definition.id } },
        cardType: cardSeed.cardType || "fields",
        title: cardSeed.title,
        description: cardSeed.description || "",
        visibleWhenStatus: cardSeed.visibleWhenStatus || null,
        roleVisibility: cardSeed.roleVisibility || null,
        order: i,
      },
      query: "id",
    });

    const fields = cardSeed.fields || [];
    for (let j = 0; j < fields.length; j += 1) {
      const f = fields[j];
      await context.query.FormField.createOne({
        data: {
          card: { connect: { id: card.id } },
          name: f.name,
          fieldType: f.fieldType,
          label: f.label,
          labelI18n: f.labelI18n || null,
          helperText: f.helperText || "",
          helperTextI18n: f.helperTextI18n || null,
          placeholder: f.placeholder || "",
          isRequired: !!f.isRequired,
          order: j,
          storage: f.storage,
          storageColumn: f.storageColumn || "",
          storageBucket: f.storageBucket || "",
          storageEntity: "self",
          options: f.options || null,
          validation: f.validation || null,
          defaultValue: f.defaultValue ?? null,
        },
        query: "id",
      });
    }
  }

  return definition.id;
}

async function seedReviewForms(
  root: any,
  { force }: { force?: boolean },
  context: AnyContext
) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in to run this mutation.");
  }

  const profile = await context.query.Profile.findOne({
    where: { id: session.itemId },
    query: "permissions { canManageUsers canManageForms }",
  });
  const canManage = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers || p.canManageForms
  );
  if (!canManage) {
    throw new Error(
      "Forbidden: you need canManageUsers or canManageForms to seed forms."
    );
  }

  const insertedIds: string[] = [];
  const keptIds: string[] = [];

  for (const seed of ALL_REVIEW_FORM_SEEDS) {
    const existing = await context.query.FormDefinition.findMany({
      where: {
        key: { equals: seed.key },
        scope: { equals: "global" },
      },
      query: "id status cards { id fields { id } }",
    });

    if (existing.length > 0 && !force) {
      const kept =
        existing.find((d: any) => d.status === "published") || existing[0];
      keptIds.push(kept.id);
      continue;
    }

    if (existing.length > 0 && force) {
      for (const def of existing) {
        await deleteDefinitionTree(def, context);
      }
    }

    const id = await insertReviewFormSeed(seed, session, context);
    insertedIds.push(id);
  }

  const allIds = [...insertedIds, ...keptIds];

  return context.query.FormDefinition.findMany({
    where: { id: { in: allIds } },
    query:
      "id key title scope status version publishedAt cards { id title order fields { id name fieldType order } }",
  });
}

export default seedReviewForms;
