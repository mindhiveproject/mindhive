export function isNewOpportunityId(opportunityId) {
  return !opportunityId || opportunityId === "new";
}

export function dedupeNetworks(networks) {
  const seen = new Map();
  (networks || []).forEach((network) => {
    if (network?.id && !seen.has(network.id)) {
      seen.set(network.id, network);
    }
  });
  return Array.from(seen.values());
}

export function collectMemberClassNetworks(me) {
  if (!me) return [];
  const fromProfile = me.memberOfClassNetworks || [];
  const fromCreated = me.classNetworksCreated || [];
  const fromAdmin = me.adminOfClassNetworks || [];
  const fromOrgs = (me.organizations || []).flatMap(
    (org) => org.memberOfClassNetworks || [],
  );
  return dedupeNetworks([...fromProfile, ...fromCreated, ...fromAdmin, ...fromOrgs]);
}

export function buildClassNetworksMutationInput(selectedNetworkIds, isNew) {
  const networkConnect = (selectedNetworkIds || []).map((id) => ({ id }));
  if (isNew) {
    return networkConnect.length ? { connect: networkConnect } : null;
  }
  return { set: networkConnect };
}
