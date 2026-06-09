import { useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import styled from "styled-components";
import { Icon } from "semantic-ui-react";

import { GET_PROFILE } from "../../../../Queries/User";
import {
  FIND_PROFILE_BY_EMAIL,
  PENDING_INVITES_FOR_ORG,
} from "../../../../Queries/Organization";
import {
  UPDATE_ORGANIZATION,
  CREATE_ORG_INVITE,
  REVOKE_ORG_INVITE,
} from "../../../../Mutations/Organization";
import IdentIcon from "../../../../Account/IdentIcon";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  .blockTitle {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #171717;
  }

  .blockHint {
    color: #5f6871;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
  }
`;

const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid #d3dae0;
  border-radius: 12px;
  background: #ffffff;

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .name {
    color: #171717;
    font-weight: 600;
    font-size: 14px;
  }

  .email {
    color: #5f6871;
    font-size: 12px;
  }

  .you {
    color: #336f8a;
    font-size: 11px;
    font-weight: 600;
  }
`;

const AddRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px;
  border: 1px dashed #d3dae0;
  border-radius: 12px;
  background: #f7f9f8;

  input {
    flex: 1 1 240px;
    padding: 8px 14px;
    border: 1px solid #d3dae0;
    border-radius: 10px;
    background: #ffffff;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    outline: none;

    &:focus {
      border-color: #336f8a;
    }
  }
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 100px;
  border: 1px solid ${({ $primary, $danger }) =>
    $primary ? "#336f8a" : $danger ? "#e8c4c4" : "#d3dae0"};
  background: ${({ $primary }) => ($primary ? "#336f8a" : "#ffffff")};
  color: ${({ $primary, $danger }) =>
    $primary ? "#ffffff" : $danger ? "#b3261e" : "#336f8a"};
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function displayName(profile) {
  if (!profile) return "Unknown";
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username
  );
}

export default function Members({ user, organization }) {
  const [emailDraft, setEmailDraft] = useState("");
  const [feedback, setFeedback] = useState(null);

  const [findProfile, { loading: lookingUp }] = useLazyQuery(
    FIND_PROFILE_BY_EMAIL,
    { fetchPolicy: "network-only" },
  );

  const [updateOrganization, { loading: updating }] = useMutation(
    UPDATE_ORGANIZATION,
    { refetchQueries: [{ query: GET_PROFILE }] },
  );

  const [createInvite, { loading: inviting }] = useMutation(
    CREATE_ORG_INVITE,
    {
      refetchQueries: organization?.id
        ? [
            {
              query: PENDING_INVITES_FOR_ORG,
              variables: { organizationId: organization.id },
            },
          ]
        : [],
    },
  );
  const [revokeInvite] = useMutation(REVOKE_ORG_INVITE, {
    refetchQueries: organization?.id
      ? [
          {
            query: PENDING_INVITES_FOR_ORG,
            variables: { organizationId: organization.id },
          },
        ]
      : [],
  });

  const { data: invitesData } = useQuery(PENDING_INVITES_FOR_ORG, {
    variables: { organizationId: organization?.id },
    skip: !organization?.id,
    fetchPolicy: "cache-and-network",
  });
  const pendingInvites = invitesData?.organizationInvites || [];

  if (!organization?.id) {
    return (
      <div className="profileBlock">
        <Shell>
          <h3 className="blockTitle">Members</h3>
          <p className="blockHint">
            Save your organization details above first — then come back here to
            invite teammates.
          </p>
        </Shell>
      </div>
    );
  }

  const members = organization?.members || [];
  const currentUserId = user?.id;
  const isOnlyMember = members.length <= 1;

  const handleAdd = async (e) => {
    e?.preventDefault();
    setFeedback(null);
    const email = emailDraft.trim().toLowerCase();
    if (!email) return;

    const { data } = await findProfile({ variables: { email } });
    const found = data?.profiles?.[0];

    // Case 1 — user already exists. Attach directly.
    if (found) {
      if (members.some((m) => m.id === found.id)) {
        setFeedback({ type: "info", text: `${email} is already a member.` });
        return;
      }
      await updateOrganization({
        variables: {
          id: organization.id,
          input: { members: { connect: [{ id: found.id }] } },
        },
      });
      setEmailDraft("");
      setFeedback({
        type: "success",
        text: `Added ${displayName(found)} to ${organization.name}.`,
      });
      return;
    }

    // Case 2 — user doesn't exist yet. Bail out if we already have a pending
    // invite for this email so we don't spam.
    if (pendingInvites.some((inv) => inv.email === email)) {
      setFeedback({
        type: "info",
        text: `An invite to ${email} is already pending.`,
      });
      return;
    }

    // Case 3 — create an invite. Postmark email goes out via the schema
    // afterOperation hook. The invitee is auto-attached after they sign up
    // with the matching email.
    await createInvite({
      variables: {
        input: {
          email,
          organization: { connect: { id: organization.id } },
        },
      },
    });
    setEmailDraft("");
    setFeedback({
      type: "success",
      text: `Invite sent to ${email}. They'll be added automatically when they sign up.`,
    });
  };

  const handleRevokeInvite = async (inviteId, email) => {
    if (!window.confirm(`Cancel the pending invite to ${email}?`)) return;
    await revokeInvite({ variables: { id: inviteId } });
    setFeedback(null);
  };

  const handleRemove = async (memberId) => {
    if (memberId === currentUserId && isOnlyMember) {
      // Already filtered in the UI, but defensive: org would be orphaned
      return;
    }
    if (
      !window.confirm(
        memberId === currentUserId
          ? "Leave this organization?"
          : "Remove this member from the organization?",
      )
    ) {
      return;
    }
    await updateOrganization({
      variables: {
        id: organization.id,
        input: { members: { disconnect: [{ id: memberId }] } },
      },
    });
    setFeedback(null);
  };

  return (
    <div className="profileBlock">
      <Shell>
        <div>
          <h3 className="blockTitle">Members</h3>
          <p className="blockHint">
            Anyone listed here can edit the organization profile and post
            opportunities on its behalf. Add a teammate by their MindHive
            email; if they don&apos;t have an account yet, ask them to sign up
            first.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((member) => {
            const isYou = member.id === currentUserId;
            const profileImageUrl =
              member.image?.keystoneImage?.url ||
              member.image?.image?.publicUrlTransformed ||
              null;
            return (
              <MemberRow key={member.id}>
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={displayName(member)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      objectFit: "cover",
                      flex: "none",
                    }}
                  />
                ) : (
                  <div style={{ flex: "none" }}>
                    <IdentIcon size="36" value={member.username} />
                  </div>
                )}
                <div className="info">
                  <span className="name">{displayName(member)}</span>
                  {member.email && (
                    <span className="email">{member.email}</span>
                  )}
                </div>
                {isYou && <span className="you">You</span>}
                {!(isYou && isOnlyMember) && (
                  <Btn
                    type="button"
                    $danger
                    onClick={() => handleRemove(member.id)}
                  >
                    {isYou ? "Leave" : "Remove"}
                  </Btn>
                )}
              </MemberRow>
            );
          })}
        </div>

        {pendingInvites.length > 0 && (
          <div>
            <h3 className="blockTitle" style={{ fontSize: 14, marginBottom: 8 }}>
              Pending invites
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {pendingInvites.map((inv) => (
                <MemberRow key={inv.id}>
                  <div style={{ flex: "none" }}>
                    <Icon name="envelope outline" size="large" />
                  </div>
                  <div className="info">
                    <span className="name">{inv.email}</span>
                    <span className="email">
                      Invited{" "}
                      {inv.createdAt
                        ? new Date(inv.createdAt).toLocaleDateString()
                        : ""}{" "}
                      · waiting for signup
                    </span>
                  </div>
                  <Btn
                    type="button"
                    $danger
                    onClick={() => handleRevokeInvite(inv.id, inv.email)}
                  >
                    Cancel invite
                  </Btn>
                </MemberRow>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleAdd}>
          <AddRow>
            <input
              type="email"
              placeholder="teammate@example.com"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              autoComplete="off"
            />
            <Btn
              type="submit"
              $primary
              disabled={lookingUp || updating || inviting}
            >
              {lookingUp
                ? "Looking up…"
                : updating
                ? "Adding…"
                : inviting
                ? "Sending invite…"
                : "Add or invite"}
            </Btn>
          </AddRow>
          <span
            className="blockHint"
            style={{ fontSize: 12, marginTop: -4, display: "block" }}
          >
            If they already have a MindHive account we&apos;ll add them now;
            otherwise we&apos;ll email them an invite to sign up.
          </span>
        </form>

        {feedback && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background:
                feedback.type === "error"
                  ? "#fdf1f1"
                  : feedback.type === "success"
                  ? "#e3f4ec"
                  : "#fdf6e3",
              color:
                feedback.type === "error"
                  ? "#b3261e"
                  : feedback.type === "success"
                  ? "#1d6b3a"
                  : "#7a5b00",
              fontSize: 13,
            }}
          >
            <Icon
              name={
                feedback.type === "error"
                  ? "warning circle"
                  : feedback.type === "success"
                  ? "check circle"
                  : "info circle"
              }
            />{" "}
            {feedback.text}
          </div>
        )}
      </Shell>
    </div>
  );
}
