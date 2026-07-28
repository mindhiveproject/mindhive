// One-shot migration: existing FormDefinitions that were auto-created
// by createTemplateMilestone before the project_board scope existed
// were saved at scope=global. This backfill relocates them to
// scope=project_board with `proposalBoard` set, based on the milestone
// that owns them.
//
// Dry-run by default. Idempotent — safe to run more than once.
//
// Permission gate: canManageUsers OR canManageForms.
async function backfillProjectBoardFormScope(
  root: any,
  { dryRun = true }: { dryRun?: boolean },
  context: any
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
      "Forbidden: canManageUsers or canManageForms required."
    );
  }

  const changes: string[] = [];

  // Find template milestones whose linked FormDefinition is still at
  // scope=global (the legacy auto-provisioned rows). Skip milestones
  // whose form is already at scope=project_board.
  const milestones = await context.query.Milestone.findMany({
    where: {
      scope: { equals: "template" },
      templateBoard: {},
      formDefinition: {
        scope: { equals: "global" },
      },
    },
    query: `
      id
      key
      templateBoard { id title }
      formDefinition { id key scope }
    `,
  });

  for (const m of milestones) {
    const board = m.templateBoard;
    const form = m.formDefinition;
    if (!board?.id || !form?.id) continue;
    changes.push(
      `FormDefinition ${form.id} (${form.key}): scope global→project_board · proposalBoard=${board.id} (${board.title || "untitled"}) · owning milestone ${m.id} (${m.key})`
    );
    if (!dryRun) {
      await context.db.FormDefinition.updateOne({
        where: { id: form.id },
        data: {
          scope: "project_board",
          proposalBoard: { connect: { id: board.id } },
        },
      });
    }
  }

  return changes.length === 0
    ? [`No changes needed — no legacy global-scoped auto-provisioned forms found.`]
    : dryRun
      ? [`Dry run — pass dryRun:false to apply these ${changes.length} change(s):`, ...changes]
      : [`Applied ${changes.length} change(s):`, ...changes];
}

export default backfillProjectBoardFormScope;
