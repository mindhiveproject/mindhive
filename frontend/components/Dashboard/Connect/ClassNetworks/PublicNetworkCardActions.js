import { useState } from "react";
import { useMutation } from "@apollo/client";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../DesignSystem/Button";
import {
  ACCEPT_NETWORK_INVITE,
  CANCEL_NETWORK_INVITE,
  DECLINE_NETWORK_INVITE,
  JOIN_OPEN_CLASS_NETWORK,
  LEAVE_CLASS_NETWORK,
  REQUEST_CLASS_NETWORK_MEMBERSHIP,
} from "../../../Mutations/ClassNetwork";
import {
  GET_NETWORK_INVITES,
  GET_PUBLIC_CLASS_NETWORKS,
} from "../../../Queries/ClassNetwork";
import { CURRENT_USER_QUERY } from "../../../Queries/User";
import { resolvePublicNetworkCardState } from "./utils";
import Chip from "../../../DesignSystem/Chip";

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const Feedback = styled.span`
  color: ${(props) => (props.$error ? "#871b16" : "#1d6b3a")};
  font-family: "Inter", sans-serif;
  font-size: 12px;
  line-height: 18px;
`;

export default function PublicNetworkCardActions({
  network,
  user,
  invites,
  invitesWhere,
}) {
  const { t } = useTranslation("connect");
  const [feedback, setFeedback] = useState(null);
  const { state, invite } = resolvePublicNetworkCardState({
    user,
    network,
    invites,
  });

  const inviteRefetchQueries = invitesWhere
    ? [{ query: GET_NETWORK_INVITES, variables: { where: invitesWhere } }]
    : [{ query: GET_NETWORK_INVITES }];

  const membershipRefetchQueries = [
    ...inviteRefetchQueries,
    { query: CURRENT_USER_QUERY },
    { query: GET_PUBLIC_CLASS_NETWORKS },
  ];

  const [requestMembership, { loading: requesting }] = useMutation(
    REQUEST_CLASS_NETWORK_MEMBERSHIP,
    { refetchQueries: inviteRefetchQueries, awaitRefetchQueries: true }
  );
  const [joinOpenNetwork, { loading: joining }] = useMutation(
    JOIN_OPEN_CLASS_NETWORK,
    { refetchQueries: membershipRefetchQueries, awaitRefetchQueries: true }
  );
  const [leaveNetwork, { loading: leaving }] = useMutation(
    LEAVE_CLASS_NETWORK,
    { refetchQueries: membershipRefetchQueries, awaitRefetchQueries: true }
  );
  const [acceptInvite, { loading: accepting }] = useMutation(
    ACCEPT_NETWORK_INVITE,
    { refetchQueries: membershipRefetchQueries, awaitRefetchQueries: true }
  );
  const [declineInvite, { loading: declining }] = useMutation(
    DECLINE_NETWORK_INVITE,
    { refetchQueries: inviteRefetchQueries, awaitRefetchQueries: true }
  );
  const [cancelInvite, { loading: cancelling }] = useMutation(
    CANCEL_NETWORK_INVITE,
    { refetchQueries: inviteRefetchQueries, awaitRefetchQueries: true }
  );

  const busy =
    requesting || joining || leaving || accepting || declining || cancelling;

  const runAction = async (action, errorDefault) => {
    setFeedback(null);
    try {
      await action();
    } catch (err) {
      setFeedback({
        kind: "error",
        text:
          err?.message ||
          t("classNetworks.invites.actionError", {}, {
            default: errorDefault,
          }),
      });
    }
  };

  if (state === "member") {
    return (
      <ActionsRow>
        <Chip 
          shape="square"
          label={t("classNetworks.invites.member", {}, { default: "Member" })}>
        </Chip>
        <DesignSystemButton
          variant="outline"
          type="button"
          disabled={busy || !network?.id}
          onClick={() => {
            const confirmed = window.confirm(
              t("classNetworks.invites.leaveConfirm", {}, {
                default:
                  "Leave this class network? You can request to join again later.",
              })
            );
            if (!confirmed) return;
            runAction(
              () => leaveNetwork({ variables: { networkId: network.id } }),
              "Failed to leave network."
            );
          }}
        >
          {leaving
            ? t("classNetworks.invites.leaving", {}, {
                default: "Leaving...",
              })
            : t("classNetworks.invites.leave", {}, {
                default: "Leave network",
              })}
        </DesignSystemButton>
        {feedback ? (
          <Feedback $error={feedback.kind === "error"}>{feedback.text}</Feedback>
        ) : null}
      </ActionsRow>
    );
  }

  if (state === "pendingRequest") {
    return (
      <ActionsRow>
        <Chip 
          shape="square"
          label={t("classNetworks.invites.pendingRequest", {}, { default: "Request pending" })}>
        </Chip>
        <DesignSystemButton
          variant="outline"
          type="button"
          disabled={busy || !invite?.id}
          onClick={() =>
            runAction(
              () => cancelInvite({ variables: { inviteId: invite.id } }),
              "Failed to cancel request."
            )
          }
        >
          {cancelling
            ? t("classNetworks.invites.cancelling", {}, {
                default: "Cancelling...",
              })
            : t("classNetworks.invites.cancelRequest", {}, {
                default: "Cancel request",
              })}
        </DesignSystemButton>
        {feedback ? (
          <Feedback $error={feedback.kind === "error"}>{feedback.text}</Feedback>
        ) : null}
      </ActionsRow>
    );
  }

  if (state === "rejectedRequest") {
    return (
      <ActionsRow>
        <Chip
          shape="square"
          label={t("classNetworks.invites.rejected", {}, { default: "Request declined" })}>
        </Chip>
        <DesignSystemButton
          variant="filled"
          type="button"
          disabled={busy || !network?.id}
          onClick={() =>
            runAction(
              () =>
                requestMembership({ variables: { networkId: network.id } }),
              "Failed to request membership."
            )
          }
        >
          {requesting
            ? t("classNetworks.invites.requesting", {}, {
                default: "Requesting...",
              })
            : t("classNetworks.invites.requestAgain", {}, {
                default: "Request again",
              })}
        </DesignSystemButton>
        {feedback ? (
          <Feedback $error={feedback.kind === "error"}>{feedback.text}</Feedback>
        ) : null}
      </ActionsRow>
    );
  }

  if (state === "incomingInvite") {
    return (
      <ActionsRow>
        <Chip
          shape="square"
          label={t("classNetworks.invites.incomingInvite", {}, { default: "You're invited" })}>
        </Chip>
        <DesignSystemButton
          variant="filled"
          type="button"
          disabled={busy || !invite?.id}
          onClick={() =>
            runAction(
              () => acceptInvite({ variables: { inviteId: invite.id } }),
              "Failed to accept invitation."
            )
          }
        >
          {accepting
            ? t("classNetworks.invites.accepting", {}, {
                default: "Accepting...",
              })
            : t("classNetworks.invites.accept", {}, { default: "Accept" })}
        </DesignSystemButton>
        <DesignSystemButton
          variant="outline"
          type="button"
          disabled={busy || !invite?.id}
          onClick={() =>
            runAction(
              () => declineInvite({ variables: { inviteId: invite.id } }),
              "Failed to decline invitation."
            )
          }
        >
          {declining
            ? t("classNetworks.invites.declining", {}, {
                default: "Declining...",
              })
            : t("classNetworks.invites.decline", {}, { default: "Decline" })}
        </DesignSystemButton>
        {feedback ? (
          <Feedback $error={feedback.kind === "error"}>{feedback.text}</Feedback>
        ) : null}
      </ActionsRow>
    );
  }

  if (state === "openJoin") {
    return (
      <ActionsRow>
        <DesignSystemButton
          variant="filled"
          type="button"
          disabled={busy || !network?.id}
          onClick={() =>
            runAction(
              () =>
                joinOpenNetwork({ variables: { networkId: network.id } }),
              "Failed to join network."
            )
          }
        >
          {joining
            ? t("classNetworks.invites.joining", {}, {
                default: "Joining...",
              })
            : t("classNetworks.invites.join", {}, {
                default: "Join network",
              })}
        </DesignSystemButton>
        {feedback ? (
          <Feedback $error={feedback.kind === "error"}>{feedback.text}</Feedback>
        ) : null}
      </ActionsRow>
    );
  }

  return (
    <ActionsRow>
      <DesignSystemButton
        variant="filled"
        type="button"
        disabled={busy || !network?.id}
        onClick={() =>
          runAction(
            () =>
              requestMembership({ variables: { networkId: network.id } }),
            "Failed to request membership."
          )
        }
      >
        {requesting
          ? t("classNetworks.invites.requesting", {}, {
              default: "Requesting...",
            })
          : t("classNetworks.invites.request", {}, {
              default: "Request to join",
            })}
      </DesignSystemButton>
      {feedback ? (
        <Feedback $error={feedback.kind === "error"}>{feedback.text}</Feedback>
      ) : null}
    </ActionsRow>
  );
}
