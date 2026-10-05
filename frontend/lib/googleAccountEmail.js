// Email of the Google account from a react-google-login success response.
//
// Google login/signup sign in with this email right after the googleLogin /
// googleSignup mutation. Those mutations can't return it: Profile.email is a
// private field and the caller has no session yet, so it resolves to null.
// Using Google's email is safe — the sign-in that follows only succeeds if it
// belongs to the account whose token the backend just verified.
export function googleAccountEmail(response) {
  const fromProfile = response?.profileObj?.email;
  if (fromProfile) return fromProfile.toLowerCase().trim();
  try {
    // Fallback: the email claim inside the ID token (a JWT).
    const payload = response.tokenId.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json)?.email?.toLowerCase().trim();
  } catch {
    return undefined;
  }
}
