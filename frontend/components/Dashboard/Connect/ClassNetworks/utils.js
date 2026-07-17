import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

export const ROUND_STATUS_DEFAULTS = {
  draft: "Draft",
  preferences_open: "Preferences open",
  preferences_closed: "Preferences closed",
  matching: "Matching",
  published: "Published",
  archived: "Archived",
};

export function displayProfileName(profile) {
  return (
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
    profile?.username ||
    profile?.email ||
    ""
  );
}

export function formatCount(
  t,
  count,
  singleKey,
  pluralKey,
  singleDefault,
  pluralDefault
) {
  return count === 1
    ? t(singleKey, { count }, { default: singleDefault })
    : t(pluralKey, { count }, { default: pluralDefault });
}

export function countUniqueStudents(network) {
  const ids = new Set();
  (network?.classes || []).forEach((cls) => {
    (cls?.students || []).forEach((student) => {
      if (student?.id) ids.add(student.id);
    });
  });
  return ids.size;
}

export function countProfileOwnedClasses(network, profileId) {
  if (!profileId) return 0;
  return (network?.classes || []).filter(
    (cls) => cls?.creator?.id === profileId
  ).length;
}

export function countProfileOwnedOpportunities(network, profileId) {
  if (!profileId) return 0;
  return (network?.opportunities || []).filter(
    (opportunity) => opportunity?.mentor?.id === profileId
  ).length;
}

export function findUserClassInNetwork(user, network) {
  if (!user?.id || !network) return null;
  const teacherIds = new Set(
    (user?.teacherIn || []).map((cls) => cls?.id).filter(Boolean)
  );
  const mentorIds = new Set(
    (user?.mentorIn || []).map((cls) => cls?.id).filter(Boolean)
  );
  const linkedClasses = network?.classes || [];

  const asTeacher = linkedClasses.find(
    (cls) =>
      cls?.creator?.id === user.id || (cls?.id && teacherIds.has(cls.id))
  );
  if (asTeacher) return asTeacher;

  return (
    linkedClasses.find(
      (cls) =>
        (cls?.id && mentorIds.has(cls.id)) ||
        (cls?.mentors || []).some((mentor) => mentor?.id === user.id)
    ) || null
  );
}

export function roundStatusLabel(t, status) {
  if (!status) return "";
  return t(`classNetworks.roundStatus.${status}`, {}, {
    default: ROUND_STATUS_DEFAULTS[status] || status,
  });
}

const EmailButton = styled.button`
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  margin: 0;
  padding: 2px 0;
  border: none;
  background: transparent;
  color: #336f8a;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  line-height: 18px;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: #1f4f63;
  }

  &:focus-visible {
    outline: 2px solid #336f8a;
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

export function CopyableEmail({ email }) {
  const { t } = useTranslation("connect");
  const [copied, setCopied] = useState(false);

  if (!email) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <EmailButton
      type="button"
      onClick={handleCopy}
      aria-label={t(
        "classNetworks.copyEmailAria",
        { email },
        { default: "Copy {{email}} to clipboard" }
      )}
    >
      {copied
        ? t("classNetworks.emailCopied", {}, {
            default: "Copied to clipboard",
          })
        : email}
    </EmailButton>
  );
}

export function buildManageNetworksQueryVariables(
  isAdmin,
  adminClassNetworkIds
) {
  return isAdmin
    ? {}
    : {
        where: {
          id: { in: adminClassNetworkIds },
        },
      };
}

/** Effective mode: open only when explicitly set; otherwise approval. */
export function getEffectiveMembershipMode(settings) {
  return settings?.membershipMode === "open" ? "open" : "approval";
}

export function isUserNetworkMember(user, networkId) {
  if (!user?.id || !networkId) return false;
  return (user?.memberOfClassNetworks || []).some(
    (network) => network?.id === networkId
  );
}

export function buildMyNetworkInvitesWhere(user, networkIds) {
  if (!user?.id) return null;
  const participantOr = [
    { requestedBy: { id: { equals: user.id } } },
    { profile: { id: { equals: user.id } } },
  ];
  const email = user?.email?.trim()?.toLowerCase();
  if (email) {
    participantOr.push({ email: { equals: email } });
  }

  const and = [
    { status: { in: ["pending", "rejected"] } },
    { OR: participantOr },
  ];
  if (Array.isArray(networkIds) && networkIds.length > 0) {
    and.unshift({ classNetwork: { id: { in: networkIds } } });
  }
  return { AND: and };
}

export function buildPendingNetworkInvitesWhere(networkId) {
  if (!networkId) return null;
  return {
    classNetwork: { id: { equals: networkId } },
    status: { equals: "pending" },
  };
}

export function buildPendingNetworkInvitesWhereForNetworks(networkIds) {
  const ids = (networkIds || []).filter(Boolean);
  if (ids.length === 0) return null;
  return {
    classNetwork: { id: { in: ids } },
    status: { equals: "pending" },
  };
}

export function buildNetworkInviteManualLink(token) {
  if (!token) return "";
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/login?networkInvite=${encodeURIComponent(token)}`;
}

function inviteTimestamp(invite) {
  const raw = invite?.resolvedAt || invite?.createdAt;
  const time = raw ? Date.parse(raw) : 0;
  return Number.isFinite(time) ? time : 0;
}

function isInviteTargetingUser(invite, user) {
  if (!invite || !user?.id) return false;
  if (invite.profile?.id === user.id) return true;
  const inviteEmail = invite.email?.trim()?.toLowerCase();
  const userEmail = user.email?.trim()?.toLowerCase();
  return !!(inviteEmail && userEmail && inviteEmail === userEmail);
}

/**
 * Resolve public-card membership/invite UI state for one network.
 * Returns { state, invite } where state is one of:
 * member | incomingInvite | pendingRequest | rejectedRequest | openJoin | canRequest
 */
export function resolvePublicNetworkCardState({ user, network, invites }) {
  if (!network?.id || !user?.id) {
    return { state: "canRequest", invite: null };
  }

  if (isUserNetworkMember(user, network.id)) {
    return { state: "member", invite: null };
  }

  const forNetwork = (invites || []).filter(
    (invite) => invite?.classNetwork?.id === network.id
  );

  const incomingInvite = forNetwork.find(
    (invite) =>
      invite.status === "pending" &&
      invite.direction === "invite" &&
      isInviteTargetingUser(invite, user)
  );
  if (incomingInvite) {
    return { state: "incomingInvite", invite: incomingInvite };
  }

  const pendingRequest = forNetwork.find(
    (invite) =>
      invite.status === "pending" &&
      invite.direction === "request" &&
      invite.requestedBy?.id === user.id
  );
  if (pendingRequest) {
    return { state: "pendingRequest", invite: pendingRequest };
  }

  const rejectedRequest = forNetwork
    .filter(
      (invite) =>
        invite.status === "rejected" &&
        invite.direction === "request" &&
        invite.requestedBy?.id === user.id
    )
    .sort((a, b) => inviteTimestamp(b) - inviteTimestamp(a))[0];
  if (rejectedRequest) {
    return { state: "rejectedRequest", invite: rejectedRequest };
  }

  if (getEffectiveMembershipMode(network.settings) === "open") {
    return { state: "openJoin", invite: null };
  }

  return { state: "canRequest", invite: null };
}
