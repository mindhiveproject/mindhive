import gql from "graphql-tag";

import { CURRENT_USER_QUERY } from "../components/Queries/User";
import {
  GET_NETWORK,
  GET_NETWORK_BY_PUBLIC_ID,
} from "../components/Queries/ClassNetwork";
import { classNetworkUrlRef } from "./classNetworkRef";

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
          publicId
        }
        organizations {
          id
          memberOfClassNetworks {
            id
            publicId
          }
        }
      }
    }
  }
`;

const JOIN_OPEN_CLASS_NETWORK = gql`
  mutation JOIN_OPEN_CLASS_NETWORK($networkId: ID!) {
    joinOpenClassNetwork(networkId: $networkId) {
      id
      publicId
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
        publicId
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
        publicId
      }
    }
  }
`;

export function isEligibleForClassNetworkInvite(user) {
  return !!user?.permissions?.some((p) => ELIGIBLE_PERMISSIONS.has(p?.name));
}

export function isAlreadyInClassNetwork(user, classNetworkRef) {
  if (!user || !classNetworkRef) return false;
  return (user?.memberOfClassNetworks || []).some(
    (network) =>
      network?.id === classNetworkRef || network?.publicId === classNetworkRef
  );
}

async function resolveClassNetworkByRef(apolloClient, classNetworkRef) {
  if (!classNetworkRef) return null;

  const { data: byPublicIdData } = await apolloClient.query({
    query: GET_NETWORK_BY_PUBLIC_ID,
    variables: { publicId: classNetworkRef },
    fetchPolicy: "network-only",
  });
  if (byPublicIdData?.classNetwork?.id) {
    return byPublicIdData.classNetwork;
  }

  try {
    const { data: byIdData } = await apolloClient.query({
      query: GET_NETWORK,
      variables: { id: classNetworkRef },
      fetchPolicy: "network-only",
    });
    return byIdData?.classNetwork || null;
  } catch {
    // Invalid GraphQL ID shape (e.g. leftover publicId that was deleted).
    return null;
  }
}

export async function joinClassNetwork({ apolloClient, classNetworkId, user }) {
  const network = await resolveClassNetworkByRef(apolloClient, classNetworkId);
  if (!network?.id || !network.isPublic) {
    throw new Error("Class network is unavailable for membership.");
  }

  const alreadyMember = isAlreadyInClassNetwork(user, network.id);
  if (alreadyMember) {
    return {
      joined: true,
      requested: false,
      alreadyMember: true,
      id: network.id,
      publicId: network.publicId,
    };
  }

  const isOpen = network?.settings?.membershipMode === "open";
  await apolloClient.mutate({
    mutation: isOpen
      ? JOIN_OPEN_CLASS_NETWORK
      : REQUEST_CLASS_NETWORK_MEMBERSHIP,
    variables: { networkId: network.id },
  });

  await apolloClient.refetchQueries({ include: [CURRENT_USER_QUERY] });

  return {
    joined: isOpen,
    requested: !isOpen,
    alreadyMember: false,
    id: network.id,
    publicId: network.publicId,
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
      query: { joinedNetwork: classNetworkUrlRef(invite.classNetwork) },
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

  const urlRef = classNetworkUrlRef(result) || classNetworkId;
  router.push({
    pathname: "/dashboard/connect",
    query: result.requested
      ? { requestedNetwork: urlRef }
      : { joinedNetwork: urlRef },
  });
  return { ok: true };
}
