// One-off mutation that inserts (or, with force, replaces) the global
// Opportunity FormDefinition. Idempotent by default: if a global
// definition for key="opportunity" already exists, returns it unchanged.
//
// Pass force: true to delete the existing definition (and its cards /
// fields, which cascade via Keystone relationships) and recreate from
// the seed.
//
// Admin-only: requires canManageUsers OR canManageForms.
import { OPPORTUNITY_FORM_SEED } from "./seedData/opportunityFormSeed";

async function seedOpportunityForm(
  root: any,
  { force }: { force?: boolean },
  context: any
) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in to run this mutation.");
  }

  // Permission gate — mirror the FormDefinition access rules.
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

  // Existing global definition for this key (any status / version).
  const existing = await context.query.FormDefinition.findMany({
    where: {
      key: { equals: OPPORTUNITY_FORM_SEED.key },
      scope: { equals: "global" },
    },
    query: "id status version cards { id fields { id } }",
  });

  if (existing.length > 0 && !force) {
    return existing.find((d: any) => d.status === "published") || existing[0];
  }

  // Force-replace: cascade-delete the old fields → cards → definition(s).
  if (existing.length > 0 && force) {
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

  // Insert the new definition (published immediately so the renderer
  // can find it). createdBy is auto-assigned by the schema hook.
  const definition = await context.query.FormDefinition.createOne({
    data: {
      key: OPPORTUNITY_FORM_SEED.key,
      title: OPPORTUNITY_FORM_SEED.title,
      description: OPPORTUNITY_FORM_SEED.description,
      scope: "global",
      status: "published",
      version: 1,
      publishedAt: new Date(),
      publishedBy: { connect: { id: session.itemId } },
      changelog: "Initial seed from Editor.js — Phase 4.",
    },
    query: "id",
  });

  // Insert cards + their fields in declared order. Card / field `order`
  // columns get the seed array index so admin reorders later are easy.
  for (let i = 0; i < OPPORTUNITY_FORM_SEED.cards.length; i += 1) {
    const cardSeed = OPPORTUNITY_FORM_SEED.cards[i];
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
          storageEntity: "self",
          options: f.options || null,
          validation: f.validation || null,
          defaultValue: f.defaultValue ?? null,
        },
        query: "id",
      });
    }
  }

  // context.db returns Date objects the DateTime scalar can serialize;
  // context.query hands back pre-serialized ISO strings that fail.
  return context.db.FormDefinition.findOne({ where: { id: definition.id } });
}

export default seedOpportunityForm;
