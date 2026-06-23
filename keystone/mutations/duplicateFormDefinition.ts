// Clone a FormDefinition along with its cards and fields. The clone is
// always a fresh draft (status="draft", version = source.version + 1)
// at the same scope as the source. Useful when an admin wants to fork
// a published form for editing without disturbing the live version.
//
// Permission: canManageForms or canManageUsers.
async function duplicateFormDefinition(
  root: any,
  { id }: { id: string },
  context: any
) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in to do this.");
  }

  // Permission gate
  const profile = await context.query.Profile.findOne({
    where: { id: session.itemId },
    query: "permissions { canManageUsers canManageForms }",
  });
  const canManage = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers || p.canManageForms
  );
  if (!canManage) {
    throw new Error(
      "Forbidden: you need canManageUsers or canManageForms to duplicate forms."
    );
  }

  // Load source with full nesting.
  const source = await context.query.FormDefinition.findOne({
    where: { id },
    query: `
      id
      key
      title
      description
      scope
      version
      organization { id }
      classNetwork { id }
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
    throw new Error(`FormDefinition ${id} not found.`);
  }

  // Create the new definition (draft, version + 1).
  const data: any = {
    key: source.key,
    title: `${source.title} (copy)`,
    description: source.description || "",
    scope: source.scope,
    status: "draft",
    version: (source.version || 0) + 1,
    changelog: `Duplicated from definition ${source.id} (v${source.version}).`,
  };
  if (source.organization?.id) {
    data.organization = { connect: { id: source.organization.id } };
  }
  if (source.classNetwork?.id) {
    data.classNetwork = { connect: { id: source.classNetwork.id } };
  }

  const newDef = await context.query.FormDefinition.createOne({
    data,
    query: "id",
  });

  // Recreate cards + their fields in source order.
  for (const card of source.cards || []) {
    const newCard = await context.query.FormCard.createOne({
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
      await context.query.FormField.createOne({
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
          storage: f.storage,
          storageColumn: f.storageColumn || "",
          storageBucket: f.storageBucket || "",
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

  return context.query.FormDefinition.findOne({
    where: { id: newDef.id },
    query: "id key title scope status version",
  });
}

export default duplicateFormDefinition;
