export function resolveProfileType(query, user) {
  return query?.type || user?.profileType || null;
}

export function profileEditHref({ page, type }) {
  const query = { page };
  if (type) query.type = type;
  return { pathname: "/dashboard/profile/edit", query };
}
