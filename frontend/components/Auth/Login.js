import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/dist/client/router";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import { StyledForm } from "../styles/StyledForm";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";
import { SIGNIN_MUTATION } from "../Mutations/User";
import { CURRENT_USER_QUERY } from "../Queries/User";
import { GET_NETWORK } from "../Queries/ClassNetwork";
import {
  completeClassNetworkInviteAfterAuth,
  GET_JOIN_CLASS_NETWORK_CONTEXT,
  isEligibleForClassNetworkInvite,
  joinClassNetwork,
} from "../../lib/joinClassNetwork";
import LoginWithGoogle from "./GoogleLogin";
import StyledAuth from "../styles/StyledAuth";
import {
  ClassNetworkInviteBanner,
  ClassNetworkInviteErrorBanner,
} from "./ClassNetworkInviteBanner";
import { endpoint, prodEndpoint } from "../../config";

const backendBase =
  process.env.NODE_ENV === "development"
    ? endpoint.replace("/api/graphql", "")
    : prodEndpoint.replace("/api/graphql", "");

export default function Login({
  redirectType,
  redirectTo,
  classNetwork: classNetworkId,
}) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const apolloClient = useApolloClient();
  const autoJoinStartedRef = useRef(false);

  const [error, setError] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [inviteErrorKind, setInviteErrorKind] = useState(null);
  const [joiningNetwork, setJoiningNetwork] = useState(false);

  const { inputs, handleChange } = useForm({
    email: "",
    password: "",
  });

  const { data: userData, loading: userLoading } = useQuery(CURRENT_USER_QUERY);
  const user = userData?.authenticatedItem;

  const { data: networkData, loading: networkLoading } = useQuery(GET_NETWORK, {
    variables: { id: classNetworkId || "" },
    skip: !classNetworkId,
  });
  const classNetwork = networkData?.classNetwork;
  const isClassNetworkValid = !!classNetwork?.id;
  const isClassNetworkInvalid =
    !!classNetworkId && !networkLoading && !isClassNetworkValid;

  const [signin, { loading }] = useMutation(SIGNIN_MUTATION, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  useEffect(() => {
    if (!classNetworkId || userLoading || networkLoading) return;
    if (!user?.id) return;
    if (isClassNetworkInvalid) return;
    if (!isClassNetworkValid) return;
    if (autoJoinStartedRef.current) return;

    autoJoinStartedRef.current = true;
    setJoiningNetwork(true);

    const runAutoJoin = async () => {
      if (!isEligibleForClassNetworkInvite(user)) {
        setInviteErrorKind("wrongRole");
        setInviteError(
          t("auth.classNetworkInvite.wrongRole", {}, {
            default:
              "This invite is for sponsors. Sign up as a sponsor or use a sponsor account to join.",
          }),
        );
        setJoiningNetwork(false);
        return;
      }

      try {
        const { data: contextData } = await apolloClient.query({
          query: GET_JOIN_CLASS_NETWORK_CONTEXT,
          fetchPolicy: "network-only",
        });
        const joinUser = contextData?.authenticatedItem;
        if (!joinUser?.id) {
          setJoiningNetwork(false);
          return;
        }

        await joinClassNetwork({
          apolloClient,
          userId: joinUser.id,
          classNetworkId,
          user: joinUser,
        });

        router.push({
          pathname: "/dashboard/connect",
          query: { joinedNetwork: classNetworkId },
        });
      } catch (joinErr) {
        setInviteErrorKind("joinFailed");
        setInviteError(
          t("auth.classNetworkInvite.joinFailed", {}, {
            default:
              "We could not add you to this class network. Please try again.",
          }),
        );
        setJoiningNetwork(false);
        autoJoinStartedRef.current = false;
      }
    };

    runAutoJoin();
  }, [
    apolloClient,
    classNetworkId,
    isClassNetworkInvalid,
    isClassNetworkValid,
    networkLoading,
    router,
    t,
    user,
    userLoading,
  ]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setInviteError(null);
    setInviteErrorKind(null);

    try {
      await fetch(`${backendBase}/api/clear-legacy-session`, {
        credentials: "include",
      });
    } catch (_) {
      // non-critical
    }

    const normalizedInputs = {
      ...inputs,
      email: inputs.email?.toLowerCase().trim(),
    };

    try {
      const res = await signin({
        variables: normalizedInputs,
      });

      if (
        res?.data?.authenticateProfileWithPassword?.__typename ===
        "ProfileAuthenticationWithPasswordFailure"
      ) {
        setError({ message: "Authentication failed." });
        return;
      }

      const profileId = res?.data?.authenticateProfileWithPassword?.item?.id;
      if (!profileId) return;

      if (classNetworkId && isClassNetworkValid) {
        const result = await completeClassNetworkInviteAfterAuth({
          apolloClient,
          classNetworkId,
          redirectType,
          redirectTo,
          router,
        });
        if (!result.ok && result.error === "wrongRole") {
          setInviteErrorKind("wrongRole");
          setInviteError(
            t("auth.classNetworkInvite.wrongRole", {}, {
              default:
                "This invite is for sponsors. Sign up as a sponsor or use a sponsor account to join.",
            }),
          );
        } else if (!result.ok) {
          setInviteErrorKind("joinFailed");
          setInviteError(
            t("auth.classNetworkInvite.joinFailed", {}, {
              default:
                "We could not add you to this class network. Please try again.",
            }),
          );
        }
        return;
      }

      if (redirectType === "JoinStudyFlow" && redirectTo) {
        router.push({
          pathname: "/join/details",
          query: { id: redirectTo, guest: false },
        });
        return;
      }

      router.push({ pathname: "/dashboard" });
    } catch (submitError) {
      setError({ message: "Authentication failed." });
    }
  }

  const invalidNetworkMessage = isClassNetworkInvalid
    ? t("auth.classNetworkInvite.invalidNetwork", {}, {
        default: "This class network invite link is invalid or has expired.",
      })
    : null;

  const showLoginForm = !user?.id && !joiningNetwork;

  return (
    <StyledAuth>
      {classNetworkId && isClassNetworkValid ? (
        <ClassNetworkInviteBanner network={classNetwork} />
      ) : null}
      {invalidNetworkMessage ? (
        <ClassNetworkInviteErrorBanner message={invalidNetworkMessage} />
      ) : null}
      {inviteError ? (
        <ClassNetworkInviteErrorBanner message={inviteError} />
      ) : null}
      {inviteErrorKind === "wrongRole" && classNetworkId ? (
        <p style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href={`/signup/sponsor?classNetwork=${classNetworkId}`}>
            {t("auth.classNetworkInvite.signUpAsSponsor", {}, {
              default: "Sign up as a sponsor instead",
            })}
          </Link>
        </p>
      ) : null}
      {joiningNetwork ? (
        <p>
          {t("auth.classNetworkInvite.joining", {}, {
            default: "Joining class network…",
          })}
        </p>
      ) : null}
      {showLoginForm ? (
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
                autoComplete="current-password"
                value={inputs.password}
                onChange={handleChange}
                disabled={isClassNetworkInvalid}
              />
            </label>

            <button type="submit" disabled={loading || isClassNetworkInvalid}>
              {t("auth.login")}
            </button>
          </fieldset>

          <LoginWithGoogle
            classNetwork={isClassNetworkValid ? classNetworkId : null}
            redirectType={redirectType}
            redirectTo={redirectTo}
            onInviteError={(message, kind = "joinFailed") => {
              setInviteErrorKind(kind);
              setInviteError(message);
            }}
            disabled={isClassNetworkInvalid}
          />
          <div className="forgotLink">
            <span>
              <Link href="/login/requestreset">{t("auth.forgotPassword")}</Link>
            </span>
          </div>
        </StyledForm>
      ) : null}
    </StyledAuth>
  );
}
