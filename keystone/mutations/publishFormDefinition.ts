// Atomic publish for a FormDefinition. Sets the row to status="published"
// with publishedAt/publishedBy and an optional changelog entry; the
// resolver picks the highest-version published row at the most-specific
// scope, so leaving older published rows around would clutter results
// (and confuse the version-history view). Instead we auto-archive any
// other published rows that share the same (key, scope, organization,
// classNetwork) tuple — only one "live" version per scope at a time.
//
// Permission: canManageUsers OR canManageForms (the latter must also be
// a member of the scoped organization when scope=organization; that's
// enforced by the FormDefinition update rule via context.query).
//
// Before flipping status, runs validateFormDefinition() — refuses to
// publish a definition with broken field wiring (typo'd storageColumn,
// missing options on a select, etc.). All errors surface together so
// the admin can fix them in one pass.
import { validateFormDefinition } from "./formValidation";

async function publishFormDefinition(
  root: any,
  {
    id,
    changelog,
  }: { id: string; changelog?: string | null },
  context: any
) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in to do this.");
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
      "Forbidden: you need canManageUsers or canManageForms to publish forms."
    );
  }

  const target = await context.query.FormDefinition.findOne({
    where: { id },
    query: `
      id
      key
      scope
      version
      status
      organization { id }
      classNetwork { id }
      cards(orderBy: { order: asc }) {
        id
        title
        cardType
        fields(orderBy: { order: asc }) {
          id
          name
          fieldType
          storage
          storageColumn
          storageBucket
          storageEntity
          options
        }
      }
    `,
  });
  if (!target) {
    throw new Error(`FormDefinition ${id} not found.`);
  }

  // Validate field wiring before flipping status. A typo'd storageColumn
  // or missing options would silently render a broken form for every
  // user at the published scope — catch it here instead.
  const validationErrors = validateFormDefinition(target as any);
  if (validationErrors.length > 0) {
    throw new Error(
      "Can't publish — fix these issues first:\n• " +
        validationErrors.join("\n• ")
    );
  }

  // Promote this row.
  const now = new Date().toISOString();
  const updateInput: any = {
    status: "published",
    publishedAt: now,
    publishedBy: { connect: { id: session.itemId } },
  };
  if (typeof changelog === "string" && changelog.trim() !== "") {
    updateInput.changelog = changelog.trim();
  }
  await context.query.FormDefinition.updateOne({
    where: { id },
    data: updateInput,
  });

  // Find siblings sharing the same (key, scope, organization, classNetwork)
  // tuple that are currently published, and archive them. The list/where
  // filter doesn't accept `null` directly via the Keystone GraphQL API,
  // so we fetch by key+scope+status and filter the relationships in JS.
  const candidates = await context.query.FormDefinition.findMany({
    where: {
      key: { equals: target.key },
      scope: { equals: target.scope },
      status: { equals: "published" },
      id: { not: { equals: id } },
    },
    query: "id organization { id } classNetwork { id }",
  });

  const targetOrgId = target.organization?.id || null;
  const targetNetId = target.classNetwork?.id || null;

  const toArchive = candidates.filter((c: any) => {
    const orgId = c.organization?.id || null;
    const netId = c.classNetwork?.id || null;
    return orgId === targetOrgId && netId === targetNetId;
  });

  for (const c of toArchive) {
    await context.query.FormDefinition.updateOne({
      where: { id: c.id },
      data: { status: "archived" },
    });
  }

  return context.query.FormDefinition.findOne({
    where: { id },
    query:
      "id key title scope status version publishedAt changelog publishedBy { id username }",
  });
}

export default publishFormDefinition;
