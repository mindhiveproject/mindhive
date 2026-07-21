import gql from "graphql-tag";

import { CURRENT_USER_QUERY } from "../components/Queries/User";

const ELIGIBLE_PERMISSIONS = new Set([
  "TEACHER",
  "MENTOR",
  "SPONSOR",
  "SCIENTIST",
]);

export const GET_JOIN_CLASS_NETWORK_CONTEXT = gql`
  query GET_JOIN_CLASS_NETWORK_CONTEXT {
    authenticatedItem {
      ... on Profile {
        id
        permissions {
          name
        }
        memberOfClassNetworks {
          id
        }
        organizations {
          id
          memberOfClassNetworks {
            id
          }
        }
      }
    }
  }
`;

const GET_CLASS_NETWORK_MEMBERSHIP_MODE = gql`
  query GET_CLASS_NETWORK_MEMBERSHIP_MODE($id: ID!) {
    classNetwork(where: { id: $id }) {
      id
      isPublic
      settings
    }
  }
`;

const JOIN_OPEN_CLASS_NETWORK = gql`
  mutation JOIN_OPEN_CLASS_NETWORK($networkId: ID!) {
    joinOpenClassNetwork(networkId: $networkId) {
      id
    }
  }
`;

const REQUEST_CLASS_NETWORK_MEMBERSHIP = gql`
  mutation REQUEST_CLASS_NETWORK_MEMBERSHIP($networkId: ID!) {
    requestClassNetworkMembership(networkId: $networkId) {
      id
      status
    }
  }
`;

export const GET_NETWORK_INVITE_CONTEXT = gql`
  query GET_NETWORK_INVITE_CONTEXT($token: String!) {
    networkInviteContext(token: $token) {
      id
      status
      email
      classNetwork {
        id
        title
        description
        isPublic
        settings
      }
    }
  }
`;

const ACCEPT_NETWORK_INVITE_BY_TOKEN = gql`
  mutation ACCEPT_NETWORK_INVITE_BY_TOKEN($token: String!) {
    acceptNetworkInvite(token: $token) {
      id
      status
      classNetwork {
        id
      }
    }
  }
`;

export function isEligibleForClassNetworkInvite(user) {
  return !!user?.permissions?.some((p) => ELIGIBLE_PERMISSIONS.has(p?.name));
}

export function isAlreadyInClassNetwork(user, classNetworkId) {
  if (!user || !classNetworkId) return false;
  return (user?.memberOfClassNetworks || []).some(
    (network) => network?.id === classNetworkId
  );
}

export async function joinClassNetwork({ apolloClient, classNetworkId, user }) {
  const alreadyMember = isAlreadyInClassNetwork(user, classNetworkId);
  if (alreadyMember) {
    return { joined: true, requested: false, alreadyMember: true };
  }

  const { data: networkData } = await apolloClient.query({
    query: GET_CLASS_NETWORK_MEMBERSHIP_MODE,
    variables: { id: classNetworkId },
    fetchPolicy: "network-only",
  });
  const network = networkData?.classNetwork;
  if (!network?.id || !network.isPublic) {
    throw new Error("Class network is unavailable for membership.");
  }

  const isOpen = network?.settings?.membershipMode === "open";
  await apolloClient.mutate({
    mutation: isOpen
      ? JOIN_OPEN_CLASS_NETWORK
      : REQUEST_CLASS_NETWORK_MEMBERSHIP,
    variables: { networkId: classNetworkId },
  });

  await apolloClient.refetchQueries({ include: [CURRENT_USER_QUERY] });

  return {
    joined: isOpen,
    requested: !isOpen,
    alreadyMember: false,
  };
}

export async function acceptNetworkInviteAfterAuth({
  apolloClient,
  token,
  router,
}) {
  if (!token) return { ok: false, error: "invalidInvite" };

  try {
    const { data } = await apolloClient.mutate({
      mutation: ACCEPT_NETWORK_INVITE_BY_TOKEN,
      variables: { token },
    });
    const invite = data?.acceptNetworkInvite;
    if (!invite?.id) return { ok: false, error: "invalidInvite" };

    await apolloClient.refetchQueries({ include: [CURRENT_USER_QUERY] });
    router.push({
      pathname: "/dashboard/connect",
      query: { joinedNetwork: invite.classNetwork?.id },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: "acceptFailed" };
  }
}

export async function completeClassNetworkInviteAfterAuth({
  apolloClient,
  classNetworkId,
  redirectType,
  redirectTo,
  router,
}) {
  if (!classNetworkId) {
    if (redirectType === "JoinStudyFlow" && redirectTo) {
      router.push({
        pathname: "/join/details",
        query: { id: redirectTo, guest: false },
      });
      return { ok: true };
    }
    router.push({ pathname: "/dashboard" });
    return { ok: true };
  }

  const { data } = await apolloClient.query({
    query: GET_JOIN_CLASS_NETWORK_CONTEXT,
    fetchPolicy: "network-only",
  });
  const user = data?.authenticatedItem;

  if (!user?.id) {
    return { ok: false, error: "notAuthenticated" };
  }

  if (!isEligibleForClassNetworkInvite(user)) {
    return { ok: false, error: "wrongRole" };
  }

  const result = await joinClassNetwork({
    apolloClient,
    classNetworkId,
    user,
  });

  router.push({
    pathname: "/dashboard/connect",
    query: result.requested
      ? { requestedNetwork: classNetworkId }
      : { joinedNetwork: classNetworkId },
  });
  return { ok: true };
}
