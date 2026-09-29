import { normalizeClassJoinRole, resolveClassToJoin } from "../lib/classJoin";

const ROLE_CONFIG = {
  student: { permission: "STUDENT", relation: "studentIn" },
  mentor: { permission: "MENTOR", relation: "mentorIn" },
} as const;

// Join a class by its code as a student or mentor. Profile.permissions,
// studentIn and mentorIn are admin-only in the generated API, so the grant
// happens here with sudo, limited to the role that matches the membership.
// Mentors must present the class's mentor invitation code.
async function joinClass(
  root: any,
  {
    classCode,
    role,
    invitationCode,
  }: { classCode: string; role: string; invitationCode?: string | null },
  context: any
): Promise<any> {
  const me = context.session?.itemId;
  if (!me) {
    throw new Error("You must be logged in to join a class.");
  }

  const joinRole = normalizeClassJoinRole(role);
  if (!joinRole) {
    throw new Error("Unsupported role.");
  }
  const config = ROLE_CONFIG[joinRole];

  const classId = await resolveClassToJoin(context, {
    classCode,
    role: joinRole,
    invitationCode,
  });

  // Profile.afterOperation syncs new mentors as round reviewers.
  const profile = await context.sudo().query.Profile.updateOne({
    where: { id: me },
    data: {
      permissions: { connect: [{ name: config.permission }] },
      [config.relation]: { connect: [{ id: classId }] },
    },
    query: "id",
  });

  return profile;
}

export default joinClass;
