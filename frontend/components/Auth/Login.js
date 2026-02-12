import { useMutation } from "@apollo/client";
import { useRouter } from "next/dist/client/router";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { StyledForm } from "../styles/StyledForm";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";
import Link from "next/link";

import { SIGNIN_MUTATION } from "../Mutations/User";
import { CURRENT_USER_QUERY } from "../Queries/User";
import LoginWithGoogle from "./GoogleLogin";
import StyledAuth from "../styles/StyledAuth";

export default function Login({ redirectType, redirectTo }) {
  const { t } = useTranslation("common");

  const [error, setError] = useState(null);

  const router = useRouter();
  const { inputs, handleChange } = useForm({
    email: "",
    password: "",
  });

  const [signin, { data, loading }] = useMutation(SIGNIN_MUTATION, {
    variables: inputs,
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  async function handleSubmit(e) {
    e.preventDefault();
    // send the email and password to graphql api
    // Normalize email to lowercase
    const normalizedInputs = {
      ...inputs,
      email: inputs.email?.toLowerCase().trim(),
    };
    try {
      const res = await signin({
        variables: normalizedInputs,
      });
      // if error
      if (
        res?.data?.authenticateProfileWithPassword?.__typename ===
        "ProfileAuthenticationWithPasswordFailure"
      ) {
        setError({ message: "Authentication failed." });
      }

      // if login is ok, redirect to the account page
      if (
        !redirectType &&
        res?.data?.authenticateProfileWithPassword?.item?.id
      ) {
        router.push({
          pathname: "/dashboard",
        });
      }

      if (redirectType === "JoinStudyFlow" && redirectTo) {
        router.push({
          pathname: "/join/details",
          query: { id: redirectTo, guest: false },
        });
      }
    } catch (error) {
      setError({ message: "Authentication failed." });
    }
  }

  return (
    <StyledAuth>
      <StyledForm method="POST" onSubmit={handleSubmit}>
        <h1>{t("auth.login")}</h1>
        <DisplayError error={error} />
        <fieldset>
          <label htmlFor="email">
            {t("auth.email")}
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={inputs.email}
              onChange={handleChange}
            />
          </label>

          <label htmlFor="password">
            {t("auth.password")}
            <input
              type="password"
              name="password"
              autoComplete="password"
              value={inputs.password}
              onChange={handleChange}
            />
          </label>

          <button type="submit">{t("auth.login")}</button>
        </fieldset>

        <LoginWithGoogle />
        <div className="forgotLink">
          <span>
            <Link href="/login/requestreset">{t("auth.forgotPassword")}</Link>
          </span>
        </div>
      </StyledForm>
    </StyledAuth>
  );
}
