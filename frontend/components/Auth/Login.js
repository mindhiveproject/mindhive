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
  acceptNetworkInviteAfterAuth,
  completeClassNetworkInviteAfterAuth,
  GET_NETWORK_INVITE_CONTEXT,
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
  networkInvite: networkInviteToken,
}) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const apolloClient = useApolloClient();
  const autoJoinStartedRef = useRef(false);
  const tokenAcceptStartedRef = useRef(false);

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

  const { data: tokenInviteData, loading: tokenInviteLoading } = useQuery(
    GET_NETWORK_INVITE_CONTEXT,
    {
      variables: { token: networkInviteToken || "" },
      skip: !networkInviteToken,
      fetchPolicy: "cache-and-network",
    }
  );
  const tokenInvite = tokenInviteData?.networkInviteContext;
  const isTokenInviteValid =
    tokenInvite?.id && tokenInvite?.status === "pending";
  const isTokenInviteInvalid =
    !!networkInviteToken && !tokenInviteLoading && !isTokenInviteValid;

  const [signin, { loading }] = useMutation(SIGNIN_MUTATION, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  useEffect(() => {
    if (
      networkInviteToken ||
      !classNetworkId ||
      userLoading ||
      networkLoading
    ) {
      return;
    }
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
          t(
            "auth.classNetworkInvite.wrongRole",
            {},
            {
              default:
                "Class-network membership is available to teachers, mentors, sponsors, and scientists.",
            }
          )
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

        const joinResult = await joinClassNetwork({
          apolloClient,
          classNetworkId,
          user: joinUser,
        });

        router.push({
          pathname: "/dashboard/connect",
          query: joinResult.requested
            ? { requestedNetwork: classNetworkId }
            : { joinedNetwork: classNetworkId },
        });
      } catch (joinErr) {
        setInviteErrorKind("joinFailed");
        setInviteError(
          t(
            "auth.classNetworkInvite.joinFailed",
            {},
            {
              default:
                "We could not add you to this class network. Please try again.",
            }
          )
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
    networkInviteToken,
    router,
    t,
    user,
    userLoading,
  ]);

  useEffect(() => {
    if (!networkInviteToken || tokenInviteLoading || userLoading) return;
    if (!user?.id || !isTokenInviteValid || tokenAcceptStartedRef.current) {
      return;
    }

    tokenAcceptStartedRef.current = true;
    setJoiningNetwork(true);
    acceptNetworkInviteAfterAuth({
      apolloClient,
      token: networkInviteToken,
      router,
    }).then((result) => {
      if (!result.ok) {
        setInviteErrorKind("joinFailed");
        setInviteError(
          t(
            "auth.networkInvite.acceptFailed",
            {},
            {
              default:
                "We could not accept this network invitation. Check that you are using the invited account.",
            }
          )
        );
        setJoiningNetwork(false);
        tokenAcceptStartedRef.current = false;
      }
    });
  }, [
    apolloClient,
    isTokenInviteValid,
    networkInviteToken,
    router,
    t,
    tokenInviteLoading,
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

      if (networkInviteToken && isTokenInviteValid) {
        const result = await acceptNetworkInviteAfterAuth({
          apolloClient,
          token: networkInviteToken,
          router,
        });
        if (!result.ok) {
          setInviteErrorKind("joinFailed");
          setInviteError(
            t(
              "auth.networkInvite.acceptFailed",
              {},
              {
                default:
                  "We could not accept this network invitation. Check that you are using the invited account.",
              }
            )
          );
        }
        return;
      }

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
            t(
              "auth.classNetworkInvite.wrongRole",
              {},
              {
                default:
                  "Class-network membership is available to teachers, mentors, sponsors, and scientists.",
              }
            )
          );
        } else if (!result.ok) {
          setInviteErrorKind("joinFailed");
          setInviteError(
            t(
              "auth.classNetworkInvite.joinFailed",
              {},
              {
                default:
                  "We could not add you to this class network. Please try again.",
              }
            )
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
    ? t(
        "auth.classNetworkInvite.invalidNetwork",
        {},
        {
          default: "This class network invite link is invalid or has expired.",
        }
      )
    : null;
  const invalidTokenInviteMessage = isTokenInviteInvalid
    ? t(
        "auth.networkInvite.invalid",
        {},
        {
          default:
            "This network invitation is invalid or is no longer pending.",
        }
      )
    : null;

  const showLoginForm = !user?.id && !joiningNetwork;

  return (
    <StyledAuth>
      {classNetworkId && isClassNetworkValid ? (
        <ClassNetworkInviteBanner network={classNetwork} />
      ) : null}
      {networkInviteToken && isTokenInviteValid ? (
        <ClassNetworkInviteBanner
          network={tokenInvite.classNetwork}
          invitation
        />
      ) : null}
      {invalidNetworkMessage ? (
        <ClassNetworkInviteErrorBanner message={invalidNetworkMessage} />
      ) : null}
      {invalidTokenInviteMessage ? (
        <ClassNetworkInviteErrorBanner message={invalidTokenInviteMessage} />
      ) : null}
      {inviteError ? (
        <ClassNetworkInviteErrorBanner message={inviteError} />
      ) : null}
      {inviteErrorKind === "wrongRole" && classNetworkId ? (
        <p style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href={`/signup/sponsor?classNetwork=${classNetworkId}`}>
            {t(
              "auth.classNetworkInvite.signUpAsSponsor",
              {},
              {
                default: "Sign up as a sponsor instead",
              }
            )}
          </Link>
        </p>
      ) : null}
      {joiningNetwork ? (
        <p>
          {t(
            "auth.classNetworkInvite.joining",
            {},
            {
              default: "Joining class network…",
            }
          )}
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
                disabled={isClassNetworkInvalid || isTokenInviteInvalid}
              />
            </label>

            <button
              type="submit"
              disabled={
                loading || isClassNetworkInvalid || isTokenInviteInvalid
              }
            >
              {t("auth.login")}
            </button>
          </fieldset>

          <LoginWithGoogle
            classNetwork={isClassNetworkValid ? classNetworkId : null}
            networkInvite={isTokenInviteValid ? networkInviteToken : null}
            redirectType={redirectType}
            redirectTo={redirectTo}
            onInviteError={(message, kind = "joinFailed") => {
              setInviteErrorKind(kind);
              setInviteError(message);
            }}
            disabled={isClassNetworkInvalid || isTokenInviteInvalid}
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
