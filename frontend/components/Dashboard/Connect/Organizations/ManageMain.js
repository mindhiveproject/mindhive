import ManageOrganization from "./ManageOrganization";
import ManageOrganizationsList from "./ManageOrganizationsList";

export default function ManageMain({ query, user }) {
  const { org } = query;

  if (org) {
    return <ManageOrganization organizationId={org} user={user} />;
  }

  return <ManageOrganizationsList user={user} />;
}
