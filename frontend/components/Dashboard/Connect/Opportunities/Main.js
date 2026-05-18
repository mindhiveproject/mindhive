import OpportunitiesList from "./List";
import OpportunityEditor from "./Editor";
import RoleGuard from "../RoleGuard";

export default function OpportunitiesMain({ query, user }) {
  const { op } = query;

  return (
    <RoleGuard allow={["mentor"]}>
      {op ? (
        <OpportunityEditor query={query} user={user} opportunityId={op} />
      ) : (
        <OpportunitiesList query={query} user={user} />
      )}
    </RoleGuard>
  );
}
