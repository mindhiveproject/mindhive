// One-off seeder for the global Profile FormDefinitions. Phase 5 ships
// the individual variant; the organization variant lands in Phase 5b
// once the dual-write (Profile + Organization) story is sorted.
//
// Idempotent by default. Pass force: true to delete and recreate.
import { PROFILE_INDIVIDUAL_FORM_SEED } from "./seedData/profileIndividualFormSeed";
import { PROFILE_ORGANIZATION_FORM_SEED } from "./seedData/profileOrganizationFormSeed";

type AnyContext = any;

async function insertSeed(seed: any, session: any, context: AnyContext) {
  const existing = await context.query.FormDefinition.findMany({
    where: {
      key: { equals: seed.key },
      scope: { equals: "global" },
    },
    query: "id status cards { id fields { id } }",
  });

  if (existing.length > 0) {
    for (const def of existing) {
      for (const card of def.cards || []) {
        for (const f of card.fields || []) {
          await context.query.FormField.deleteOne({ where: { id: f.id } });
        }
        await context.query.FormCard.deleteOne({ where: { id: card.id } });
      }
      await context.query.FormDefinition.deleteOne({ where: { id: def.id } });
    }
  }

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
      changelog: "Initial seed — Phase 5.",
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
          helperText: f.helperText || "",
          placeholder: f.placeholder || "",
          isRequired: !!f.isRequired,
          order: j,
          storage: f.storage,
          storageColumn: f.storageColumn || "",
          storageBucket: f.storageBucket || "",
          storageEntity: f.storageEntity || "self",
          options: f.options || null,
          validation: f.validation || null,
          defaultValue: f.defaultValue ?? null,
          jsonArraySchema: f.jsonArraySchema || null,
        },
        query: "id",
      });
    }
  }

  return definition.id;
}

async function seedProfileForms(
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

  const seeds = [
    PROFILE_INDIVIDUAL_FORM_SEED,
    PROFILE_ORGANIZATION_FORM_SEED,
  ];
  const ids: string[] = [];
  for (const seed of seeds) {
    const id = await insertSeed(seed, session, context);
    ids.push(id);
  }

  return context.query.FormDefinition.findMany({
    where: { id: { in: ids } },
    query:
      "id key title scope status version publishedAt cards { id title order fields { id name fieldType order } }",
  });
}

export default seedProfileForms;
