// Shared checks for joining a class by code (joinClass, signupWithTurnstile,
// googleSignup). All callers write with sudo, so this is the gate.
//
// Students join with the class code alone: it is the code teachers hand out.
// Mentors are class staff, so they additionally need the mentor invitation
// code the teacher generates on the class Mentors tab
// (Class.settings.mentorInvitationCode).

export type ClassJoinRole = "student" | "mentor";

export function normalizeClassJoinRole(role?: string | null) {
  const lower = role?.toLowerCase();
  return lower === "student" || lower === "mentor"
    ? (lower as ClassJoinRole)
    : null;
}

/**
 * Returns the id of the class to join, or throws when the code is unknown or
 * a mentor's invitation code does not match.
 */
export async function resolveClassToJoin(
  context: any,
  {
    classCode,
    role,
    invitationCode,
  }: {
    classCode: string;
    role: ClassJoinRole;
    invitationCode?: string | null;
  }
): Promise<string> {
  const klass = await context.sudo().query.Class.findOne({
    where: { code: classCode },
    query: "id settings",
  });
  if (!klass) {
    throw new Error("Class not found.");
  }

  if (role === "mentor") {
    const expected = klass.settings?.mentorInvitationCode;
    if (!expected || !invitationCode || invitationCode !== expected) {
      throw new Error(
        "A valid mentor invitation link is required to join this class as a mentor."
      );
    }
  }

  return klass.id;
}
