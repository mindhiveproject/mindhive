import { permissions } from "../access";

type NetworkAdminArgs = {
  networkId: string;
  profileId?: string | null;
  email?: string | null;
};

const ADMIN_PERMISSION_NAMES = new Set(["ADMIN", "TEACHER"]);

function hasNetworkAuthority(session: any, network: any): boolean {
  if (permissions.canManageUsers({ session })) return true;

  const me = session?.itemId;
  if (!me) return false;
  if (network?.creator?.id === me) return true;
  return (network?.admins || []).some((admin: { id: string }) => admin.id === me);
}

function displayProfile(profile: any): string {
  return profile?.email || profile?.username || profile?.id || "profile";
}

async function getNetwork(context: any, networkId: string) {
  const network = await context.sudo().query.ClassNetwork.findOne({
    where: { id: networkId },
    query: `
      id
      creator { id }
      admins { id }
      memberProfiles { id }
    `,
  });

  if (!network) {
    throw new Error("Class network not found.");
  }
  return network;
}

async function getTargetProfile(context: any, args: NetworkAdminArgs) {
  if (!args.profileId && !args.email) {
    throw new Error("Provide either a profile ID or an email address.");
  }

  if (args.profileId) {
    const profile = await context.sudo().query.Profile.findOne({
      where: { id: args.profileId },
      query: "id username email permissions { name canManageUsers }",
    });
    if (!profile) {
      throw new Error("Profile not found.");
    }
    return profile;
  }

  const email = args.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("Provide a valid email address.");
  }

  const profiles = await context.sudo().query.Profile.findMany({
    where: { email: { equals: email } },
    take: 1,
    query: "id username email permissions { name canManageUsers }",
  });
  const profile = profiles?.[0];
  if (!profile) {
    throw new Error(`No MindHive account found for ${email}.`);
  }
  return profile;
}

function assertCanBeNetworkAdmin(profile: any) {
  const permissionsForProfile = profile?.permissions || [];
  const canAdminister = permissionsForProfile.some(
    (permission: { name?: string; canManageUsers?: boolean }) =>
      permission.canManageUsers || ADMIN_PERMISSION_NAMES.has(permission.name || "")
  );

  if (!canAdminister) {
    throw new Error(
      `${displayProfile(profile)} must have teacher or admin permissions before becoming a class-network admin.`
    );
  }
}

export async function addClassNetworkAdmin(
  _root: unknown,
  args: NetworkAdminArgs,
  context: any
) {
  if (!context.session?.itemId) {
    throw new Error("You must be signed in to manage class network admins.");
  }

  const network = await getNetwork(context, args.networkId);
  if (!hasNetworkAuthority(context.session, network)) {
    throw new Error("You are not allowed to manage admins for this class network.");
  }

  const profile = await getTargetProfile(context, args);
  assertCanBeNetworkAdmin(profile);

  const adminIds = new Set(
    (network.admins || []).map((admin: { id: string }) => admin.id)
  );
  const memberIds = new Set(
    (network.memberProfiles || []).map((member: { id: string }) => member.id)
  );

  const data: any = {};
  if (!adminIds.has(profile.id)) {
    data.admins = { connect: [{ id: profile.id }] };
  }
  if (!memberIds.has(profile.id)) {
    data.memberProfiles = { connect: [{ id: profile.id }] };
  }

  if (!Object.keys(data).length) {
    return context.sudo().query.ClassNetwork.findOne({
      where: { id: args.networkId },
      query: "id admins { id username firstName lastName email } memberProfiles { id }",
    });
  }

  return context.sudo().query.ClassNetwork.updateOne({
    where: { id: args.networkId },
    data,
    query: "id admins { id username firstName lastName email } memberProfiles { id }",
  });
}

export async function removeClassNetworkAdmin(
  _root: unknown,
  { networkId, profileId }: { networkId: string; profileId: string },
  context: any
) {
  if (!context.session?.itemId) {
    throw new Error("You must be signed in to manage class network admins.");
  }

  const network = await getNetwork(context, networkId);
  if (!hasNetworkAuthority(context.session, network)) {
    throw new Error("You are not allowed to manage admins for this class network.");
  }

  const adminIds = new Set(
    (network.admins || []).map((admin: { id: string }) => admin.id)
  );
  if (!adminIds.has(profileId)) {
    return context.sudo().query.ClassNetwork.findOne({
      where: { id: networkId },
      query: "id admins { id username firstName lastName email } memberProfiles { id }",
    });
  }

  const remainingAdminCount = adminIds.size - 1;
  const removingCreator = network.creator?.id === profileId;
  if (remainingAdminCount < 1 && removingCreator) {
    throw new Error("Add another class-network admin before removing the creator.");
  }
  if (remainingAdminCount < 1) {
    throw new Error("A class network must have at least one admin.");
  }

  return context.sudo().query.ClassNetwork.updateOne({
    where: { id: networkId },
    data: {
      admins: { disconnect: [{ id: profileId }] },
    },
    query: "id admins { id username firstName lastName email } memberProfiles { id }",
  });
}
