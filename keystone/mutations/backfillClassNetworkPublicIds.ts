// One-shot: stamp `publicId` on ClassNetwork rows that lack one so share
// and deep-link URLs can use the Profile/Guest-style public identifier.
//
// Admin-only. Dry-run by default so you can preview the plan; pass
// dryRun:false to apply. Uses context.db to bypass field-level update lock.
//
// Schema-push note: Keystone adds `publicId` as String @default("") AND a
// unique index in one step. If existing rows already have "" (or other
// duplicates), `keystone dev` / db push fails with UNIQUE constraint failed.
// In that case, stamp unique values in SQL first (e.g. SQLite:
//   UPDATE ClassNetwork SET publicId = <uniqid> WHERE publicId = '';
// ), then restart Keystone and accept the unique-index prompt. This GraphQL
// mutation is for environments where Keystone is already running.

type BackfillArgs = {
  limit?: number;
  dryRun?: boolean;
};

const uniqid = require("uniqid") as () => string;

export default async function backfillClassNetworkPublicIds(
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
  const record = (msg: string) => {
    log.push(msg);
  };

  // Keystone filter: missing publicId (null or empty).
  const networks = (await context.sudo().query.ClassNetwork.findMany({
    where: {
      OR: [{ publicId: { equals: null } }, { publicId: { equals: "" } }],
    },
    take: limit,
    query: "id title publicId",
  })) as Array<{ id: string; title?: string | null; publicId?: string | null }>;

  record(`Found ${networks.length} class networks missing publicId.`);

  let stamped = 0;

  for (const network of networks) {
    if (!network?.id) continue;
    if (network.publicId) continue;

    const publicId = uniqid();
    stamped += 1;
    record(
      `[network ${network.id}] "${network.title || ""}": stamp publicId=${publicId}`
    );
    if (!dryRun) {
      // context.db bypasses field access (update: false on publicId).
      await context.db.ClassNetwork.updateOne({
        where: { id: network.id },
        data: { publicId },
      });
    }
  }

  record(
    `SUMMARY: stamped=${stamped}, dryRun=${dryRun}, limit=${limit}.`
  );

  return log;
}
