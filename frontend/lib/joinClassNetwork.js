import gql from "graphql-tag";

import { UPDATE_PROFILE } from "../components/Mutations/User";
import { UPDATE_ORGANIZATION } from "../components/Mutations/Organization";
import { CURRENT_USER_QUERY } from "../components/Queries/User";
import { collectMemberClassNetworks } from "./opportunityClassNetworks";

const ELIGIBLE_PERMISSIONS = new Set(["SPONSOR", "MENTOR"]);

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

export function isEligibleForClassNetworkInvite(user) {
  return !!user?.permissions?.some((p) => ELIGIBLE_PERMISSIONS.has(p?.name));
}

export function isAlreadyInClassNetwork(user, classNetworkId) {
  if (!user || !classNetworkId) return false;
  return collectMemberClassNetworks(user).some((n) => n.id === classNetworkId);
}

export async function joinClassNetwork({
  apolloClient,
  userId,
  classNetworkId,
  user,
}) {
  const alreadyMember = isAlreadyInClassNetwork(user, classNetworkId);
  let joined = false;

  const profileHasNetwork = (user?.memberOfClassNetworks || []).some(
    (network) => network.id === classNetworkId,
  );

  if (!profileHasNetwork) {
    await apolloClient.mutate({
      mutation: UPDATE_PROFILE,
      variables: {
        id: userId,
        input: {
          memberOfClassNetworks: { connect: [{ id: classNetworkId }] },
        },
      },
    });
    joined = true;
  }

  for (const org of user?.organizations || []) {
    const orgHasNetwork = (org.memberOfClassNetworks || []).some(
      (network) => network.id === classNetworkId,
    );
    if (!orgHasNetwork) {
      await apolloClient.mutate({
        mutation: UPDATE_ORGANIZATION,
        variables: {
          id: org.id,
          input: {
            memberOfClassNetworks: { connect: [{ id: classNetworkId }] },
          },
        },
      });
      joined = true;
    }
  }

  await apolloClient.refetchQueries({ include: [CURRENT_USER_QUERY] });

  return { joined: joined || alreadyMember, alreadyMember };
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

  await joinClassNetwork({
    apolloClient,
    userId: user.id,
    classNetworkId,
    user,
  });

  router.push({
    pathname: "/dashboard/connect",
    query: { joinedNetwork: classNetworkId },
  });
  return { ok: true };
}
