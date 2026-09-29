import { OAuth2Client } from "google-auth-library";
import { SELF_ASSIGNABLE_ROLES } from "./signupWithTurnstile";
import { normalizeClassJoinRole, resolveClassToJoin } from "../lib/classJoin";

const clientID =
  "1042393944588-od9nbqtdfefltmpq8kjnnhir0lbb14se.apps.googleusercontent.com";

async function googleSignup(
  root: any,
  {
    token,
    role,
    classCode,
    invitationCode,
  }: {
    token: string;
    role: string;
    classCode: string;
    invitationCode?: string;
  },
  context: KeystoneContext
): Promise<ProfileCreateInput> {
  const googleClient = new OAuth2Client(clientID);
  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: clientID, // Specify the CLIENT_ID of the app that accesses the backend
  });
  const payload = await ticket.getPayload();

  const { name, email } = payload;

  // Same role whitelist as signupWithTurnstile: the profile is created with
  // sudo, so an unchecked role would let any Google account claim ADMIN.
  const requestedRole = role?.toUpperCase();
  if (requestedRole && !SELF_ASSIGNABLE_ROLES.has(requestedRole)) {
    throw new Error("Invalid role.");
  }

  // Mentors joining a class need its mentor invitation code.
  const joinRole = normalizeClassJoinRole(role);
  const classId =
    joinRole && classCode
      ? await resolveClassToJoin(context, {
          classCode,
          role: joinRole,
          invitationCode,
        })
      : null;

  // create a profile
  // sudo: Profile.create is closed to anonymous callers (see Profile.ts).
  // The verified Google ID token above is what earns this.
  const profile = await context.sudo().db.Profile.createOne(
    {
      data: {
        username: name,
        email: email?.toLowerCase().trim(),
        password: token,
        permissions: requestedRole
          ? { connect: { name: requestedRole } }
          : null,
        studentIn:
          joinRole === "student" && classId
            ? { connect: { id: classId } }
            : null,
        mentorIn:
          joinRole === "mentor" && classId
            ? { connect: { id: classId } }
            : null,
      },
    },
    "id username email"
  );
  return profile;
}

export default googleSignup;
