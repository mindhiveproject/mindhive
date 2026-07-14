import { permissions } from "../access";

type BackfillArgs = {
  limit?: number;
  dryRun?: boolean;
};

export default async function backfillClassNetworkAdmins(
  _root: unknown,
  args: BackfillArgs,
  context: any
): Promise<number> {
  if (!context.session?.itemId) {
    throw new Error("You must be signed in to backfill class network admins.");
  }
  if (!permissions.canManageUsers({ session: context.session })) {
    throw new Error("Forbidden: you need user-management permission.");
  }

  const limit = Math.min(Math.max(args?.limit ?? 200, 1), 1000);
  const dryRun = args?.dryRun ?? false;

  const networks = await context.sudo().query.ClassNetwork.findMany({
    take: limit,
    query: `
      id
      creator { id }
      admins { id }
      memberProfiles { id }
    `,
  });

  let updated = 0;

  for (const network of networks || []) {
    const creatorId = network?.creator?.id;
    if (!creatorId) continue;

    const adminIds = new Set(
      (network.admins || []).map((admin: { id: string }) => admin.id)
    );
    const memberIds = new Set(
      (network.memberProfiles || []).map((member: { id: string }) => member.id)
    );
    if (adminIds.has(creatorId) && memberIds.has(creatorId)) continue;

    if (!dryRun) {
      const data: any = {};
      if (!adminIds.has(creatorId)) {
        data.admins = { connect: [{ id: creatorId }] };
      }
      if (!memberIds.has(creatorId)) {
        data.memberProfiles = { connect: [{ id: creatorId }] };
      }
      await context.sudo().query.ClassNetwork.updateOne({
        where: { id: network.id },
        data,
      });
    }
    updated += 1;
  }

  return updated;
}
