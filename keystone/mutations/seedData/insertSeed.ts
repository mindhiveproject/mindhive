// Shared helper that turns a FormSeed payload into a freshly-published
// FormDefinition + Cards + Fields in the database. Wipes any existing
// rows for the same (key, scope=global) tuple first — callers that want
// "only seed if missing" semantics must check absence before calling.
type AnyContext = any;

export async function insertSeed(
  seed: any,
  session: any,
  context: AnyContext,
  changelog = "Initial seed."
): Promise<string> {
  const existing = await context.query.FormDefinition.findMany({
    where: {
      key: { equals: seed.key },
      scope: { equals: "global" },
    },
    query: "id cards { id fields { id } }",
  });

  for (const def of existing) {
    for (const card of def.cards || []) {
      for (const f of card.fields || []) {
        await context.query.FormField.deleteOne({ where: { id: f.id } });
      }
      await context.query.FormCard.deleteOne({ where: { id: card.id } });
    }
    await context.query.FormDefinition.deleteOne({ where: { id: def.id } });
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
      changelog,
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
