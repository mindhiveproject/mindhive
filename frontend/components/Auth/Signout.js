import { useMutation } from "@apollo/client";
import Router from "next/router";
import { CURRENT_USER_QUERY } from "../Queries/User";
import { SIGN_OUT_MUTATION } from "../Mutations/User";
import Button from "../DesignSystem/Button";

/**
 * Signs the user out and returns them to the landing page.
 *
 * Exposed as a hook so callers can attach it to whatever element they already
 * render — the navigation, for example, needs a design system nav item rather
 * than the bare <button> the SignOut component provides.
 */
export function useSignout() {
  const [signout] = useMutation(SIGN_OUT_MUTATION, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  return async () => {
    await signout();
    Router.push({
      pathname: `/`,
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
