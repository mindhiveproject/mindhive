import { useQuery } from "@apollo/client";

import {
  GET_NETWORK,
  GET_NETWORK_BY_PUBLIC_ID,
} from "../components/Queries/ClassNetwork";

/**
 * Dual-read ClassNetwork from a URL ref (publicId preferred, internal id fallback).
 * Used by login/signup share links during rollout.
 */
export function useClassNetworkByRef(ref, options = {}) {
  const skip = options.skip || !ref;
  const {
    data: byPublicIdData,
    loading: loadingPublicId,
    error: publicIdError,
  } = useQuery(GET_NETWORK_BY_PUBLIC_ID, {
    variables: { publicId: ref || "" },
    skip,
    fetchPolicy: options.fetchPolicy,
  });

  const byPublicId = byPublicIdData?.classNetwork;
  const tryInternalId = !skip && !loadingPublicId && !byPublicId;

  const {
    data: byIdData,
    loading: loadingId,
    error: idError,
  } = useQuery(GET_NETWORK, {
    variables: { id: ref || "" },
    skip: !tryInternalId,
    fetchPolicy: options.fetchPolicy,
  });

  const classNetwork = byPublicId || byIdData?.classNetwork || null;
  const loading = loadingPublicId || (tryInternalId && loadingId);
  const error = publicIdError || idError || null;

  return { classNetwork, loading, error };
}
