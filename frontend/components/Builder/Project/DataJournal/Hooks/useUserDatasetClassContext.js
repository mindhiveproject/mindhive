import { useMemo } from "react";
import { useQuery } from "@apollo/client";

import { GET_USER_CLASSES } from "../../../../Queries/User";

/**
 * @param {Array<{ id?: string | null, networks?: Array<{ classes?: Array<{ id?: string | null }> | null }> | null }> | null | undefined} classLists
 */
function deriveClassIdsFromMembership(classLists) {
  const direct = new Set();
  const network = new Set();

  for (const cl of classLists) {
    if (cl?.id) direct.add(cl.id);
    for (const net of cl?.networks || []) {
      for (const peer of net?.classes || []) {
        if (peer?.id) network.add(peer.id);
      }
    }
  }

  const peerNetworkClassIds = [...network].filter((id) => !direct.has(id));

  return {
    directClassIds: [...direct],
    networkClassIds: peerNetworkClassIds,
  };
}

/** Direct class ids and peer network class ids for dataset scope filters. */
export function useUserDatasetClassContext() {
  const { data, loading } = useQuery(GET_USER_CLASSES);

  return useMemo(() => {
    const user = data?.authenticatedItem;
    if (!user) {
      return { directClassIds: [], networkClassIds: [], loading };
    }

    const classLists = [
      ...(user.studentIn || []),
      ...(user.teacherIn || []),
      ...(user.mentorIn || []),
    ];

    const { directClassIds, networkClassIds } =
      deriveClassIdsFromMembership(classLists);

    return { directClassIds, networkClassIds, loading };
  }, [data, loading]);
}
