import Form from "./Form";
import useForm from "../../../lib/useForm";
import { useRouter } from "next/dist/client/router";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { useContext, useEffect } from "react";
import styled from "styled-components";
import { Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { SIGNUP_MUTATION, SIGNIN_MUTATION } from "../../Mutations/User";
import { CURRENT_USER_QUERY } from "../../Queries/User";
import { GET_INVITE_BY_TOKEN } from "../../Queries/Organization";
import { GET_NETWORK } from "../../Queries/ClassNetwork";
import {
  ACCEPT_ORG_INVITE,
  UPDATE_ORGANIZATION,
} from "../../Mutations/Organization";
import {
  acceptNetworkInviteAfterAuth,
  completeClassNetworkInviteAfterAuth,
  GET_NETWORK_INVITE_CONTEXT,
} from "../../../lib/joinClassNetwork";
import {
  ClassNetworkInviteBanner,
  ClassNetworkInviteErrorBanner,
} from "../ClassNetworkInviteBanner";

import { UserContext } from "../../Global/Authorized";
import StudentMain from "./Student/Main";

import StyledAuth from "../../styles/StyledAuth";

const InviteBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eef5f9 0%, #e3f4ec 100%);
  border: 1px solid #b6dec7;
  color: #1d6b3a;
  margin-bottom: 16px;

  .body {
    flex: 1;
    min-width: 0;
  }

  strong {
    display: block;
    font-size: 15px;
    margin-bottom: 4px;
    color: #1d6b3a;
  }

  span {
    font-size: 13px;
    color: #1d6b3a;
    line-height: 1.4;
  }
`;

export default function RoleSignup(query) {
  const { t } = useTranslation("common");
  const {
    role,
    redirectType,
    redirectTo,
    invite: inviteToken,
    classNetwork: classNetworkId,
    networkInvite: networkInviteToken,
  } = query;

  const user = useContext(UserContext);
  const router = useRouter();

  // save and edit the user information
  const { inputs, handleChange, handleMultipleUpdate, clearForm } = useForm({
    username: "",
    email: "",
    password: "",
    info: {},
  });

  // If the signup URL carries an invite token, look up the invite to display
  // the org context and pre-fill the email field.
  const { data: inviteData } = useQuery(GET_INVITE_BY_TOKEN, {
    variables: { token: inviteToken || "" },
    skip: !inviteToken,
    fetchPolicy: "cache-and-network",
  });
  const invite = inviteData?.organizationInvites?.[0];
  const isInvitePending = invite?.status === "pending";

  const { data: networkInviteData, loading: networkInviteLoading } = useQuery(
    GET_NETWORK_INVITE_CONTEXT,
    {
      variables: { token: networkInviteToken || "" },
      skip: !networkInviteToken,
      fetchPolicy: "cache-and-network",
    }
  );
  const networkInvite = networkInviteData?.networkInviteContext;
  const isNetworkInvitePending =
    networkInvite?.id && networkInvite?.status === "pending";
  const isNetworkInviteInvalid =
    !!networkInviteToken && !networkInviteLoading && !isNetworkInvitePending;

  const { data: networkData, loading: networkLoading } = useQuery(GET_NETWORK, {
    variables: { id: classNetworkId || "" },
    skip: !classNetworkId || role !== "sponsor",
    fetchPolicy: "cache-and-network",
  });
  const classNetwork = networkData?.classNetwork;
  const isClassNetworkValid = !!classNetwork?.id;
  const isClassNetworkInvalid =
    role === "sponsor" &&
    classNetworkId &&
    !networkLoading &&
    !isClassNetworkValid;

  // Pre-fill the email field once the invite resolves (only if user hasn't
  // started typing yet, so we never overwrite their input).
  useEffect(() => {
    const invitedEmail = isInvitePending ? invite?.email : networkInvite?.email;
    if (invitedEmail && !inputs?.email) {
      handleMultipleUpdate({ email: invitedEmail });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite?.id, networkInvite?.id]);

  const [signup, { data, loading, error }] = useMutation(SIGNUP_MUTATION);

  const [signin, { data: signinData, loading: signinLoading }] = useMutation(
    SIGNIN_MUTATION,
    {
      refetchQueries: [{ query: CURRENT_USER_QUERY }],
    }
  );

  const apolloClient = useApolloClient();
  const [acceptInvite] = useMutation(ACCEPT_ORG_INVITE);
  const [attachToOrg] = useMutation(UPDATE_ORGANIZATION);

  async function handleSubmit({ e, classCode }) {
    e.preventDefault();
    if (isClassNetworkInvalid || isNetworkInviteInvalid) return;
    // Normalize email to lowercase
    const normalizedEmail = inputs.email?.toLowerCase().trim();
    // Sponsor signup grants the SPONSOR permission. The user later picks
    // whether they're representing an Organization or signing up as an
    // Individual on /dashboard/profile/edit?page=type. For Connect role
    // gating, useConnectRole maps SPONSOR to mentor capabilities so sponsors
    // can create opportunities, see "My matched students", etc.
    await signup({
      variables: {
        input: {
          ...inputs,
          email: normalizedEmail,
          permissions: { connect: { name: role?.toUpperCase() } },
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
    });
    // log in user
    const login = await signin({
      variables: {
        email: normalizedEmail,
        password: inputs.password,
      },
    });

    const newProfileId = login?.data?.authenticateProfileWithPassword?.item?.id;

    // Token-based invite acceptance: if the signup URL carried a valid,
    // still-pending invite token, connect the brand-new user to that org and
    // mark the invite accepted. The token is the sole gating mechanism — no
    // email matching is required, so spoofing an invited email is no longer
    // enough on its own to join an organization.
    if (newProfileId && inviteToken) {
      try {
        const { data: tokenData } = await apolloClient.query({
          query: GET_INVITE_BY_TOKEN,
          variables: { token: inviteToken },
          fetchPolicy: "network-only",
        });
        const pendingInvite = tokenData?.organizationInvites?.[0];
        if (
          pendingInvite &&
          pendingInvite.status === "pending" &&
          pendingInvite.organization?.id
        ) {
          await attachToOrg({
            variables: {
              id: pendingInvite.organization.id,
              input: {
                members: { connect: [{ id: newProfileId }] },
              },
            },
          });
          await acceptInvite({
            variables: {
              id: pendingInvite.id,
              now: new Date().toISOString(),
            },
          });
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Token-based invite accept failed:", err);
      }
    }

    if (newProfileId && networkInviteToken && isNetworkInvitePending) {
      await acceptNetworkInviteAfterAuth({
        apolloClient,
        token: networkInviteToken,
        router,
      });
      return;
    }

    if (newProfileId && classNetworkId && isClassNetworkValid) {
      await completeClassNetworkInviteAfterAuth({
        apolloClient,
        classNetworkId,
        redirectType,
        redirectTo,
        router,
      });
      return;
    }

    if (!redirectType && newProfileId) {
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
  }

  // Banner shown above the form when the URL carries an invite token.
  const inviteBanner =
    isInvitePending && invite ? (
      <InviteBanner>
        <Icon name="building" size="large" style={{ marginTop: 2 }} />
        <div className="body">
          <strong>
            You&apos;ve been invited to join{" "}
            {invite.organization?.name || "an organization"}
          </strong>
          <span>
            {invite.invitedBy?.firstName || invite.invitedBy?.username
              ? `${
                  invite.invitedBy?.firstName || invite.invitedBy?.username
                } sent you this invite. `
              : ""}
            Sign up below and you&apos;ll be added to{" "}
            {invite.organization?.name || "the organization"} automatically.
          </span>
        </div>
      </InviteBanner>
    ) : null;

  const classNetworkBanner =
    role === "sponsor" && isClassNetworkValid ? (
      <InviteBanner>
        <Icon name="sitemap" size="large" style={{ marginTop: 2 }} />
        <div className="body">
          <strong>You&apos;re signing up to join {classNetwork.title}</strong>
          <span>
            {classNetwork.description
              ? classNetwork.description
              : "Once your account is created, you will be associated with this class network."}
          </span>
        </div>
      </InviteBanner>
    ) : null;

  const classNetworkError = isClassNetworkInvalid ? (
    <InviteBanner
      style={{
        background: "#fef2f2",
        borderColor: "#fecaca",
        color: "#991b1b",
      }}
    >
      <Icon
        name="warning sign"
        size="large"
        style={{ marginTop: 2, color: "#991b1b" }}
      />
      <div className="body">
        <strong style={{ color: "#991b1b" }}>Invalid class network link</strong>
        <span style={{ color: "#991b1b" }}>
          This signup link references a class network that could not be found.
          Please ask your teacher for a new link.
        </span>
      </div>
    </InviteBanner>
  ) : null;

  const networkInviteBanner = isNetworkInvitePending ? (
    <ClassNetworkInviteBanner network={networkInvite.classNetwork} invitation />
  ) : null;
  const networkInviteError = isNetworkInviteInvalid ? (
    <ClassNetworkInviteErrorBanner
      message={t(
        "auth.networkInvite.invalid",
        {},
        {
          default:
            "This network invitation is invalid or is no longer pending.",
        }
      )}
    />
  ) : null;

  if (role === "student" || role === "mentor") {
    return (
      <StyledAuth>
        {inviteBanner}
        {networkInviteBanner}
        {networkInviteError}
        <StudentMain
          user={user}
          query={query}
          role={role}
          profile={inputs}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          submitBtnName={"Create account"}
          loading={loading}
          error={error}
        />
      </StyledAuth>
    );
  }

  return (
    <StyledAuth>
      {inviteBanner}
      {classNetworkBanner}
      {classNetworkError}
      {networkInviteBanner}
      {networkInviteError}
      <h1>Sign up as a {role}</h1>
      <Form
        role={role}
        profile={inputs}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        submitBtnName={"Create account"}
        loading={loading}
        error={error}
        submitDisabled={isClassNetworkInvalid || isNetworkInviteInvalid}
      />
    </StyledAuth>
  );
}
