import { OAuth2Client } from "google-auth-library";

const clientID =
  "1042393944588-od9nbqtdfefltmpq8kjnnhir0lbb14se.apps.googleusercontent.com";

async function googleSignup(
  root: any,
  {
    token,
    role,
    classCode,
  }: {
    token: string;
    role: string;
    classCode: string;
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
  // create a profile
  const profile = await context.db.Profile.createOne(
    {
      data: {
        username: name,
        email: email?.toLowerCase().trim(),
        password: token,
        permissions: role ? { connect: { name: role?.toUpperCase() } } : null,
        studentIn:
          role === "student" && classCode
            ? { connect: { code: classCode } }
            : null,
        mentorIn:
          role === "mentor" && classCode
            ? { connect: { code: classCode } }
            : null,
      },
    },
    "id username email"
  );
  return profile;
}

export default googleSignup;
