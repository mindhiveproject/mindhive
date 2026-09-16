// Grants `canManageTickets` to the permission rows that should triage tickets.
//
// The flag ships defaulting to false so no existing role gains anything on
// deploy. This turns it on for ADMIN, reproducibly, so dev / staging /
// production end up in the same state without anyone remembering to tick a box
// in the Admin UI three times.
//
// Dry-run by default. Pass dryRun: false to write. Idempotent.
//
// Permission gate: canManageUsers — granting a right has to be gated on
// something stronger than the right being granted.

/** Rows that should be able to file and triage. Add to this list and re-run. */
const ROLES_THAT_TRIAGE = ["ADMIN"];

async function backfillTicketPermissions(
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
    query: "permissions { canManageUsers }",
  });
  const canManage = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers
  );
  if (!canManage) {
    throw new Error("Forbidden: canManageUsers required.");
  }

  const rows = await context.query.Permission.findMany({
    query: "id name canManageTickets",
  });

  const changes: string[] = [];
  const missing = ROLES_THAT_TRIAGE.filter(
    (name) => !rows.some((row: any) => row.name === name)
  );
  for (const name of missing) {
    changes.push(`WARNING no Permission row named "${name}" — nothing to grant`);
  }

  for (const row of rows) {
    const shouldHave = ROLES_THAT_TRIAGE.includes(row.name);
    if (!shouldHave || row.canManageTickets) continue;
    changes.push(`grant canManageTickets to "${row.name}" (${row.id})`);
    if (!dryRun) {
      await context.sudo().query.Permission.updateOne({
        where: { id: row.id },
        data: { canManageTickets: true },
      });
    }
  }

  // Report who ends up holding it, so the caller can see the blast radius
  // rather than trusting the intent. Anyone with this flag can read every
  // ticket screenshot.
  const after = dryRun
    ? rows.filter((r: any) => r.canManageTickets || ROLES_THAT_TRIAGE.includes(r.name))
    : await context
        .sudo()
        .query.Permission.findMany({
          where: { canManageTickets: { equals: true } },
          query: "name",
        });

  return {
    dryRun,
    changes,
    holders: after.map((r: any) => r.name).sort(),
  };
}

export default backfillTicketPermissions;
