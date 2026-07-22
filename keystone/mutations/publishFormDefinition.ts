// Atomic publish for a FormDefinition. Sets the row to status="published"
// with publishedAt/publishedBy and an optional changelog entry; the
// resolver picks the highest-version published row at the most-specific
// scope, so leaving older published rows around would clutter results
// (and confuse the version-history view). Instead we auto-archive any
// other published rows that share the same (key, scope, organization,
// classNetwork) tuple — only one "live" version per scope at a time.
//
// Permission: canManageUsers OR canManageForms (organization scope), or
// the class creator for a project_board-scoped template form.
//
// Before flipping status, runs validateFormDefinition() — refuses to
// publish a definition with broken field wiring (typo'd storageColumn,
// missing options on a select, etc.). All errors surface together so
// the admin can fix them in one pass.
import { validateFormDefinition } from "./formValidation";
import { canMutateFormDefinition } from "../access";

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
  const isAdminOrFormManager = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers || p.canManageForms
  );

  const target = await context.query.FormDefinition.findOne({
    where: { id },
    query: `
      id
      key
      scope
      version
      status
      organization {
        id
        members { id }
      }
      classNetwork { id }
      proposalBoard {
        id
        templateForClasses { creator { id } }
        templatesForClass { creator { id } }
      }
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

  if (
    !isAdminOrFormManager &&
    !canMutateFormDefinition(context.session, target)
  ) {
    throw new Error(
      "Forbidden: you cannot publish this form definition."
    );
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
  // Keystone 6's DateTime scalar is finicky about ISO strings received
  // via context.query.updateOne — pass a Date object instead. It's
  // less ambiguous (no string-parsing round-trip) and matches how the
  // FormDefinition resolveInput hook stamps updatedAt.
  const now = new Date();
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

  // Find siblings sharing the same (key, scope, organization,
  // classNetwork, proposalBoard) tuple that are currently published,
  // and archive them. The list/where filter doesn't accept `null`
  // directly via the Keystone GraphQL API, so we fetch by
  // key+scope+status and filter the relationships in JS.
  const candidates = await context.query.FormDefinition.findMany({
    where: {
      key: { equals: target.key },
      scope: { equals: target.scope },
      status: { equals: "published" },
      id: { not: { equals: id } },
    },
    query: "id organization { id } classNetwork { id } proposalBoard { id }",
  });

  const targetOrgId = target.organization?.id || null;
  const targetNetId = target.classNetwork?.id || null;
  const targetBoardId = target.proposalBoard?.id || null;

  const toArchive = candidates.filter((c: any) => {
    const orgId = c.organization?.id || null;
    const netId = c.classNetwork?.id || null;
    const boardId = c.proposalBoard?.id || null;
    return (
      orgId === targetOrgId &&
      netId === targetNetId &&
      boardId === targetBoardId
    );
  });

  for (const c of toArchive) {
    await context.query.FormDefinition.updateOne({
      where: { id: c.id },
      data: { status: "archived" },
    });
  }

  // Use context.db (raw Prisma) not context.query. context.query hands
  // back pre-serialized values, which the DateTime scalar then re-parses
  // and rejects. context.db returns Date objects the scalar serializes
  // cleanly.
  return context.db.FormDefinition.findOne({ where: { id } });
}

export default publishFormDefinition;
