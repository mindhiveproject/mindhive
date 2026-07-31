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

/**
 * Singular org the user can manage in Connect.
 * Prefers adminOfOrganizations[0]; falls back to a linked org only if they admin it.
 */
export function resolveManagedOrganization(user) {
  const fromAdmin = (user?.adminOfOrganizations || [])[0];
  if (fromAdmin?.id) return fromAdmin;
  const linked = resolveLinkedOrganization(user);
  if (!linked?.id || !user?.id) return null;
  const admins = linked.admins || [];
  if (admins.some((admin) => admin?.id === user.id)) return linked;
  if ((user.adminOfOrganizations || []).some((org) => org?.id === linked.id)) {
    return linked;
  }
  return null;
}

export const MANAGE_ORGANIZATION_HREF =
  "/dashboard/connect/manage-organization";

/** List URL, or detail with `?org=` when an id is provided. */
export function manageOrganizationHref(orgId) {
  if (!orgId) return MANAGE_ORGANIZATION_HREF;
  return {
    pathname: MANAGE_ORGANIZATION_HREF,
    query: { org: orgId },
  };
}

export function profileEditHref({ page, type }) {
  const query = { page };
  if (type) query.type = type;
  return { pathname: "/dashboard/profile/edit", query };
}
