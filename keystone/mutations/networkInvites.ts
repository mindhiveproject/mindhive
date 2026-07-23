import { permissions } from "../access";

const ELIGIBLE_PERMISSION_NAMES = new Set([
  "TEACHER",
  "MENTOR",
  "SPONSOR",
  "SCIENTIST",
]);

// Internal reads may use context.query with nested fields. Mutation *returns*
// must use context.db: returning pre-serialized context.query rows makes
// GraphQL re-resolve relationships and fail with KS_PRISMA_ERROR
// ("Unknown arg `networkInvitesId`"). Same pattern as other custom mutations.
const INVITE_QUERY = `
  id
  direction
  status
  email
  token
  pendingKey
  classNetwork {
    id
    publicId
    title
    description
    isPublic
    settings
  }
  requestedBy {
    id
    username
    firstName
    lastName
    email
  }
  profile {
    id
    username
    firstName
    lastName
    email
  }
  reviewedBy {
    id
    username
    firstName
    lastName
    email
  }
`;

const NETWORK_QUERY = `
  id
  title
  description
  isPublic
  settings
  creator { id }
  admins { id }
  memberProfiles { id }
`;

async function returnInvite(context: any, inviteId: string) {
  return context.sudo().db.NetworkInvite.findOne({
    where: { id: inviteId },
  });
}

async function returnNetwork(context: any, networkId: string) {
  return context.sudo().db.ClassNetwork.findOne({
    where: { id: networkId },
  });
}

/**
 * Admin invite against an existing pending row:
 * - outbound invite → return as-is (idempotent)
 * - membership request → approve it and connect the profile as a member
 */
async function resolveExistingPendingOnAdminInvite(
  context: any,
  existing: any,
  networkId: string,
  adminId: string
) {
  if (existing.direction === "invite") {
    return returnInvite(context, existing.id);
  }

  const profileId = existing.profile?.id;
  if (!profileId) {
    throw new Error("Cannot approve a request without a target profile.");
  }

  await connectMember(context, networkId, profileId);
  return resolveInviteStatus(context, existing, "approved", adminId);
}

type InviteArgs = {
  networkId: string;
  profileId?: string | null;
  email?: string | null;
};

type InviteIdArgs = {
  inviteId: string;
};

type InviteOrTokenArgs = {
  inviteId?: string | null;
  token?: string | null;
};

export function hasNetworkAuthority(session: any, network: any): boolean {
  if (permissions.canManageUsers({ session })) return true;

  const me = session?.itemId;
  if (!me) return false;
  if (network?.creator?.id === me) return true;
  return (network?.admins || []).some(
    (admin: { id: string }) => admin.id === me
  );
}

export function getMembershipMode(settings: any): "open" | "approval" {
  return settings?.membershipMode === "open" ? "open" : "approval";
}

export function normalizeEmail(email?: string | null): string | null {
  if (!email || typeof email !== "string") return null;
  const normalized = email.toLowerCase().trim();
  return normalized || null;
}

function pendingKeyForProfile(networkId: string, profileId: string): string {
  return `${networkId}:profile:${profileId}`;
}

function pendingKeyForEmail(networkId: string, email: string): string {
  return `${networkId}:email:${email}`;
}

function assertSignedIn(context: any) {
  if (!context.session?.itemId) {
    throw new Error("You must be signed in.");
  }
}

function isEligibleProfile(profile: any): boolean {
  return (profile?.permissions || []).some((permission: { name?: string }) =>
    ELIGIBLE_PERMISSION_NAMES.has(permission.name || "")
  );
}

async function getEligibleSessionProfile(context: any) {
  assertSignedIn(context);
  const profile = await context.sudo().query.Profile.findOne({
    where: { id: context.session.itemId },
    query: "id username email permissions { name }",
  });
  if (!profile) {
    throw new Error("Profile not found.");
  }
  if (!isEligibleProfile(profile)) {
    throw new Error(
      "Only teachers, mentors, sponsors, and scientists can join class networks this way."
    );
  }
  return profile;
}

async function getNetwork(context: any, networkId: string) {
  const network = await context.sudo().query.ClassNetwork.findOne({
    where: { id: networkId },
    query: NETWORK_QUERY,
  });
  if (!network) {
    throw new Error("Class network not found.");
  }
  return network;
}

function assertPublicNetwork(network: any) {
  if (!network.isPublic) {
    throw new Error("Only public class networks support membership requests and invitations.");
  }
}

function isMember(network: any, profileId: string): boolean {
  return (network.memberProfiles || []).some(
    (member: { id: string }) => member.id === profileId
  );
}

async function findPendingByKey(context: any, pendingKey: string) {
  const invites = await context.sudo().query.NetworkInvite.findMany({
    where: {
      pendingKey: { equals: pendingKey },
      status: { equals: "pending" },
    },
    take: 1,
    query: INVITE_QUERY,
  });
  return invites?.[0] || null;
}

async function getInviteById(context: any, inviteId: string) {
  const invite = await context.sudo().query.NetworkInvite.findOne({
    where: { id: inviteId },
    query: INVITE_QUERY,
  });
  if (!invite) {
    throw new Error("Network invite not found.");
  }
  return invite;
}

async function getInviteByToken(context: any, token: string) {
  const invites = await context.sudo().query.NetworkInvite.findMany({
    where: { token: { equals: token } },
    take: 1,
    query: INVITE_QUERY,
  });
  const invite = invites?.[0];
  if (!invite) {
    throw new Error("Network invite not found.");
  }
  return invite;
}

async function resolveInvite(context: any, args: InviteOrTokenArgs) {
  if (args.inviteId) {
    return getInviteById(context, args.inviteId);
  }
  if (args.token) {
    return getInviteByToken(context, args.token);
  }
  throw new Error("Provide either an invite ID or a token.");
}

async function connectMember(context: any, networkId: string, profileId: string) {
  const network = await getNetwork(context, networkId);
  if (isMember(network, profileId)) {
    return returnNetwork(context, networkId);
  }
  await context.sudo().query.ClassNetwork.updateOne({
    where: { id: networkId },
    data: {
      memberProfiles: { connect: [{ id: profileId }] },
    },
    query: "id",
  });
  return returnNetwork(context, networkId);
}

async function resolveInviteStatus(
  context: any,
  invite: any,
  status: "approved" | "rejected" | "cancelled",
  reviewerId?: string | null
) {
  if (invite.status !== "pending") {
    if (invite.status === status) {
      return returnInvite(context, invite.id);
    }
    throw new Error(`This network invite is already ${invite.status}.`);
  }

  const data: any = {
    status,
    pendingKey: null,
    resolvedAt: new Date(),
  };
  if (reviewerId) {
    data.reviewedBy = { connect: { id: reviewerId } };
  }

  await context.sudo().query.NetworkInvite.updateOne({
    where: { id: invite.id },
    data,
    query: "id",
  });
  return returnInvite(context, invite.id);
}

async function getTargetProfileForInvite(context: any, args: InviteArgs) {
  if (!args.profileId && !args.email) {
    throw new Error("Provide either a profile ID or an email address.");
  }

  if (args.profileId) {
    const profile = await context.sudo().query.Profile.findOne({
      where: { id: args.profileId },
      query: "id username email permissions { name }",
    });
    if (!profile) {
      throw new Error("Profile not found.");
    }
    return profile;
  }

  const email = normalizeEmail(args.email);
  if (!email) {
    throw new Error("Provide a valid email address.");
  }

  const profiles = await context.sudo().query.Profile.findMany({
    where: { email: { equals: email } },
    take: 1,
    query: "id username email permissions { name }",
  });
  return profiles?.[0] || null;
}

export async function requestClassNetworkMembership(
  _root: unknown,
  { networkId }: { networkId: string },
  context: any
) {
  const me = await getEligibleSessionProfile(context);
  const network = await getNetwork(context, networkId);
  assertPublicNetwork(network);

  if (getMembershipMode(network.settings) !== "approval") {
    throw new Error(
      "This class network is open. Use joinOpenClassNetwork instead of requesting membership."
    );
  }

  if (isMember(network, me.id)) {
    throw new Error("You are already a member of this class network.");
  }

  const pendingKey = pendingKeyForProfile(networkId, me.id);
  const existing = await findPendingByKey(context, pendingKey);
  if (existing) {
    return returnInvite(context, existing.id);
  }

  const created = await context.sudo().db.NetworkInvite.createOne({
    data: {
      direction: "request",
      status: "pending",
      pendingKey,
      classNetwork: { connect: { id: networkId } },
      requestedBy: { connect: { id: me.id } },
      profile: { connect: { id: me.id } },
      email: normalizeEmail(me.email) || undefined,
    },
  });
  return created;
}

export async function joinOpenClassNetwork(
  _root: unknown,
  { networkId }: { networkId: string },
  context: any
) {
  const me = await getEligibleSessionProfile(context);
  const network = await getNetwork(context, networkId);
  assertPublicNetwork(network);

  if (getMembershipMode(network.settings) !== "open") {
    throw new Error(
      "This class network requires approval. Request membership instead of joining directly."
    );
  }

  if (isMember(network, me.id)) {
    return returnNetwork(context, networkId);
  }

  return connectMember(context, networkId, me.id);
}

export async function leaveClassNetwork(
  _root: unknown,
  { networkId }: { networkId: string },
  context: any
) {
  assertSignedIn(context);
  const profileId = context.session.itemId;
  const network = await getNetwork(context, networkId);

  if (!isMember(network, profileId)) {
    return returnNetwork(context, networkId);
  }

  await context.sudo().query.ClassNetwork.updateOne({
    where: { id: networkId },
    data: {
      memberProfiles: { disconnect: [{ id: profileId }] },
    },
    query: "id",
  });
  return returnNetwork(context, networkId);
}

export async function inviteProfileToClassNetwork(
  _root: unknown,
  args: InviteArgs,
  context: any
) {
  assertSignedIn(context);
  const network = await getNetwork(context, args.networkId);
  assertPublicNetwork(network);

  if (!hasNetworkAuthority(context.session, network)) {
    throw new Error("You are not allowed to invite members to this class network.");
  }

  const profile = await getTargetProfileForInvite(context, args);
  const email = normalizeEmail(profile?.email || args.email);

  if (profile) {
    if (!isEligibleProfile(profile)) {
      throw new Error(
        "Only teachers, mentors, sponsors, and scientists can be invited to class networks."
      );
    }
    if (isMember(network, profile.id)) {
      throw new Error("That profile is already a member of this class network.");
    }

    const pendingKey = pendingKeyForProfile(args.networkId, profile.id);
    const existing = await findPendingByKey(context, pendingKey);
    if (existing) {
      return resolveExistingPendingOnAdminInvite(
        context,
        existing,
        args.networkId,
        context.session.itemId
      );
    }

    return context.sudo().db.NetworkInvite.createOne({
      data: {
        direction: "invite",
        status: "pending",
        pendingKey,
        classNetwork: { connect: { id: args.networkId } },
        requestedBy: { connect: { id: context.session.itemId } },
        profile: { connect: { id: profile.id } },
        email: email || undefined,
      },
    });
  }

  if (!email) {
    throw new Error("Provide a valid email address.");
  }

  const pendingKey = pendingKeyForEmail(args.networkId, email);
  const existing = await findPendingByKey(context, pendingKey);
  if (existing) {
    return resolveExistingPendingOnAdminInvite(
      context,
      existing,
      args.networkId,
      context.session.itemId
    );
  }

  return context.sudo().db.NetworkInvite.createOne({
    data: {
      direction: "invite",
      status: "pending",
      pendingKey,
      classNetwork: { connect: { id: args.networkId } },
      requestedBy: { connect: { id: context.session.itemId } },
      email,
    },
  });
}

export async function approveNetworkInvite(
  _root: unknown,
  { inviteId }: InviteIdArgs,
  context: any
) {
  assertSignedIn(context);
  const invite = await getInviteById(context, inviteId);

  if (invite.direction !== "request") {
    throw new Error("Only membership requests can be approved by network admins.");
  }

  const network = await getNetwork(context, invite.classNetwork.id);
  if (!hasNetworkAuthority(context.session, network)) {
    throw new Error("You are not allowed to approve requests for this class network.");
  }

  if (!invite.profile?.id) {
    throw new Error("Cannot approve a request without a target profile.");
  }

  if (invite.status === "approved") {
    await connectMember(context, network.id, invite.profile.id);
    return returnInvite(context, invite.id);
  }

  if (invite.status !== "pending") {
    throw new Error(`This network invite is already ${invite.status}.`);
  }

  await connectMember(context, network.id, invite.profile.id);
  return resolveInviteStatus(
    context,
    invite,
    "approved",
    context.session.itemId
  );
}

export async function rejectNetworkInvite(
  _root: unknown,
  { inviteId }: InviteIdArgs,
  context: any
) {
  assertSignedIn(context);
  const invite = await getInviteById(context, inviteId);

  if (invite.direction !== "request") {
    throw new Error("Only membership requests can be rejected by network admins.");
  }

  const network = await getNetwork(context, invite.classNetwork.id);
  if (!hasNetworkAuthority(context.session, network)) {
    throw new Error("You are not allowed to reject requests for this class network.");
  }

  return resolveInviteStatus(
    context,
    invite,
    "rejected",
    context.session.itemId
  );
}

export async function acceptNetworkInvite(
  _root: unknown,
  args: InviteOrTokenArgs,
  context: any
) {
  const me = await getEligibleSessionProfile(context);
  const invite = await resolveInvite(context, args);

  if (invite.direction !== "invite") {
    throw new Error("Only invitations can be accepted by the invitee.");
  }

  if (invite.status === "approved") {
    if (invite.profile?.id) {
      await connectMember(context, invite.classNetwork.id, invite.profile.id);
    }
    return returnInvite(context, invite.id);
  }

  if (invite.status !== "pending") {
    throw new Error(`This network invite is already ${invite.status}.`);
  }

  const inviteEmail = normalizeEmail(invite.email);
  const myEmail = normalizeEmail(me.email);
  const isTargetProfile = invite.profile?.id === me.id;
  const isEmailMatch = !invite.profile?.id && !!inviteEmail && inviteEmail === myEmail;

  if (!isTargetProfile && !isEmailMatch) {
    throw new Error("You are not the recipient of this invitation.");
  }

  if (isMember(await getNetwork(context, invite.classNetwork.id), me.id)) {
    return resolveInviteStatus(context, invite, "approved", me.id);
  }

  // Email-only invites bind to the accepting authenticated profile.
  if (!invite.profile?.id) {
    await context.sudo().query.NetworkInvite.updateOne({
      where: { id: invite.id },
      data: {
        profile: { connect: { id: me.id } },
      },
      query: "id",
    });
  }

  await connectMember(context, invite.classNetwork.id, me.id);
  return resolveInviteStatus(context, invite, "approved", me.id);
}

export async function declineNetworkInvite(
  _root: unknown,
  args: InviteOrTokenArgs,
  context: any
) {
  const me = await getEligibleSessionProfile(context);
  const invite = await resolveInvite(context, args);

  if (invite.direction !== "invite") {
    throw new Error("Only invitations can be declined by the invitee.");
  }

  const inviteEmail = normalizeEmail(invite.email);
  const myEmail = normalizeEmail(me.email);
  const isTargetProfile = invite.profile?.id === me.id;
  const isEmailMatch = !invite.profile?.id && !!inviteEmail && inviteEmail === myEmail;

  if (!isTargetProfile && !isEmailMatch) {
    throw new Error("You are not the recipient of this invitation.");
  }

  return resolveInviteStatus(context, invite, "rejected", me.id);
}

export async function cancelNetworkInvite(
  _root: unknown,
  { inviteId }: InviteIdArgs,
  context: any
) {
  assertSignedIn(context);
  const me = context.session.itemId;
  const invite = await getInviteById(context, inviteId);
  const network = await getNetwork(context, invite.classNetwork.id);

  if (invite.direction === "request") {
    if (invite.requestedBy?.id !== me) {
      throw new Error("Only the requester can cancel a membership request.");
    }
    return resolveInviteStatus(context, invite, "cancelled", me);
  }

  // Outbound invitation: network authority (or global admin) may cancel.
  if (!hasNetworkAuthority(context.session, network)) {
    throw new Error("You are not allowed to cancel this invitation.");
  }

  return resolveInviteStatus(context, invite, "cancelled", me);
}

export async function networkInviteContext(
  _root: unknown,
  { token }: { token: string },
  context: any
) {
  if (!token) {
    throw new Error("A token is required.");
  }

  const invites = await context.sudo().query.NetworkInvite.findMany({
    where: { token: { equals: token } },
    take: 1,
    query: `
      id
      status
      email
      classNetwork {
        id
        publicId
        title
        description
        isPublic
        settings
      }
    `,
  });

  const invite = invites?.[0];
  if (!invite) {
    throw new Error("Network invite not found.");
  }

  return {
    id: invite.id,
    status: invite.status,
    email: invite.email || null,
    classNetwork: invite.classNetwork
      ? {
          id: invite.classNetwork.id,
          publicId: invite.classNetwork.publicId || null,
          title: invite.classNetwork.title,
          description: invite.classNetwork.description,
          isPublic: invite.classNetwork.isPublic,
          settings: invite.classNetwork.settings,
        }
      : null,
  };
}
