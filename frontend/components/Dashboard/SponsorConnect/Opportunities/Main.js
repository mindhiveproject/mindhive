import OpportunitiesList from "./List";
import OpportunityEditor from "./EditorSwitch";
import RoleGuard from "../../Connect/RoleGuard";

export default function OpportunitiesMain({ query, user }) {
  const { op } = query;

  return (
    <RoleGuard allow={["sponsor"]}>
      {op ? (
        <OpportunityEditor query={query} user={user} opportunityId={op} />
      ) : (
        <OpportunitiesList query={query} user={user} />
      )}
    </RoleGuard>
  );
}
