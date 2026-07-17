export function resolveProfileType(query, user) {
  return query?.type || user?.profileType || null;
}

/** First Organization linked via membership or creation (legacy migration). */
export function resolveLinkedOrganization(user) {
  const fromMembership = (user?.organizations || [])[0];
  if (fromMembership?.id) return fromMembership;
  const fromAdmin = (user?.adminOfOrganizations || [])[0];
  if (fromAdmin?.id) return fromAdmin;
  return (user?.organizationsCreated || [])[0] || null;
}

export function profileEditHref({ page, type }) {
  const query = { page };
  if (type) query.type = type;
  return { pathname: "/dashboard/profile/edit", query };
}
