/**
 * Prefer ClassNetwork.publicId in share/deep-link URLs.
 * Falls back to internal id during rollout before backfill completes.
 */
export function classNetworkUrlRef(network) {
  return network?.publicId || network?.id || "";
}

/** Dual-read: URL ref may be either publicId or internal id. */
export function matchesClassNetworkRef(network, ref) {
  if (!network || !ref) return false;
  return network.id === ref || network.publicId === ref;
}
