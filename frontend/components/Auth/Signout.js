import { useMutation } from "@apollo/client";
import Router from "next/router";
import { CURRENT_USER_QUERY } from "../Queries/User";
import { SIGN_OUT_MUTATION } from "../Mutations/User";
import Button from "../DesignSystem/Button";

/**
 * Signs the user out and returns them to the login page.
 *
 * Exposed as a hook so callers can attach it to whatever element they already
 * render — the navigation, for example, needs a design system nav item rather
 * than the bare <button> the SignOut component provides.
 *
 * awaitRefetchQueries matters here: without it, `signout()` resolves before
 * the client knows the session is gone, so a redirect to `/` would still see
 * a truthy user for a beat and get bounced straight back into the dashboard.
 * Waiting for the refetch makes "signed out" and "navigate" happen in order,
 * and landing on `/login` (rather than `/`, which itself redirects signed-in
 * visitors to `/dashboard`) confirms the logout instead of racing it.
 */
export function useSignout() {
  const [signout] = useMutation(SIGN_OUT_MUTATION, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
    awaitRefetchQueries: true,
  });

  return async () => {
    await signout();
    Router.push({
      pathname: `/login`,
    });
  };
}

export default function SignOut({ children }) {
  const signMeOut = useSignout();
  return (
    <Button type="button" variant="outline" onClick={signMeOut}>
      {children}
    </Button>
  );
}
