// One-shot: remove the `clonedFrom` link from boards that are class templates.
//
// copyProposalBoard used to set clonedFrom on every copy, so a teacher's class
// template copied from an admin/platform board counted as one of that board's
// clones: applyTemplateBoardChanges overwrote it with the admin's edits, and
// the admin board's editor showed it under prototypeFor. Class templates are
// independent copies; only student boards should point at their template.
//
// Admin-only. Dry-run by default so you can preview the plan; pass
// dryRun:false to apply.

type BackfillArgs = {
  limit?: number;
  dryRun?: boolean;
};

type BoardRow = {
  id: string;
  title?: string | null;
  clonedFrom?: { id: string; title?: string | null } | null;
};

export default async function backfillDetachClassTemplateClones(
  _root: unknown,
  args: BackfillArgs,
  context: any
): Promise<string[]> {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in.");
  }
  const profile = await context.query.Profile.findOne({
    where: { id: session.itemId },
    query: "permissions { canManageUsers }",
  });
  const isAdmin = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers
  );
  if (!isAdmin) {
    throw new Error(
      "Forbidden: this backfill is admin-only (canManageUsers)."
    );
  }

  const limit = Math.min(Math.max(args?.limit ?? 500, 1), 5000);
  const dryRun = args?.dryRun ?? true;
  const log: string[] = [];

  const sudo = context.sudo();
  const boards = (await sudo.query.ProposalBoard.findMany({
    where: {
      clonedFrom: { id: { not: null } },
      OR: [
        { templatesForClass: { some: {} } },
        { templateForClasses: { some: {} } },
      ],
    },
    take: limit,
    query: "id title clonedFrom { id title }",
  })) as BoardRow[];

  log.push(
    `${dryRun ? "[dry run] " : ""}Found ${boards.length} class template(s) with a clonedFrom link.`
  );

  for (const board of boards) {
    log.push(
      `${dryRun ? "would detach" : "detached"} ${board.id} "${board.title ?? ""}" from ${board.clonedFrom?.id} "${board.clonedFrom?.title ?? ""}"`
    );
    if (!dryRun) {
      await sudo.db.ProposalBoard.updateOne({
        where: { id: board.id },
        data: { clonedFrom: { disconnect: true } },
      });
    }
  }

  return log;
}
