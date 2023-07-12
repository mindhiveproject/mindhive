import { useMutation } from "@apollo/client";
import Router from "next/router";
import { CURRENT_USER_QUERY } from "../Queries/User";
import { SIGN_OUT_MUTATION } from "../Mutations/User";

export default function SignOut({ children }) {
  const signMeOut = async () => {
    await signout();
    Router.push({
      pathname: `/`,
    });
  };
  const [signout] = useMutation(SIGN_OUT_MUTATION, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });
  return <button onClick={signMeOut}>{children}</button>;
}
