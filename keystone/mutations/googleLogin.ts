import { OAuth2Client } from "google-auth-library";

const clientID =
  "1042393944588-od9nbqtdfefltmpq8kjnnhir0lbb14se.apps.googleusercontent.com";

async function googleLogin(
  root: any,
  {
    token,
  }: {
    token: string;
  },
  context: KeystoneContext
): Promise<ProfileUpdateInput> {
  const googleClient = new OAuth2Client(clientID);
  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: clientID, // Specify the CLIENT_ID of the app that accesses the backend
  });
  const payload = await ticket.getPayload();
  const { email } = payload;
  // update a profile with the new password
  const profile = await context.db.Profile.updateOne({
    where: { email: email?.toLowerCase().trim() },
    data: { password: token },
  });
  return profile;
}

export default googleLogin;
