export function buildOrganizationInviteLink(token) {
  if (!token) return "";
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/signup/sponsor?invite=${encodeURIComponent(token)}`;
}

export function profileAvatarUrl(profile) {
  return (
    profile?.image?.keystoneImage?.url ||
    profile?.image?.image?.publicUrlTransformed ||
    null
  );
}

export function displayProfileName(profile, fallback = "Unknown") {
  if (!profile) return fallback;
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username ||
    fallback
  );
}

export function formatDateLabel(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "";
  }
}

export function isOrganizationAdmin(user, organization, organizationId) {
  if (!user?.id) return false;
  const orgId = organizationId || organization?.id;
  if (!orgId) return false;
  if ((organization?.admins || []).some((admin) => admin?.id === user.id)) {
    return true;
  }
  return (user.adminOfOrganizations || []).some((org) => org?.id === orgId);
}
