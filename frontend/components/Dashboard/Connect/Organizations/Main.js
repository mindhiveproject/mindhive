import RoleGuard from "../RoleGuard";
import OrganizationsList from "./List";
import OrganizationDetail from "./Detail";

export default function OrganizationsMain({ query, user }) {
  const { org } = query;

  return (
    <RoleGuard allow={["student", "mentor", "teacher"]}>
      {org ? (
        <OrganizationDetail query={query} user={user} organizationId={org} />
      ) : (
        <OrganizationsList query={query} user={user} />
      )}
    </RoleGuard>
  );
}
