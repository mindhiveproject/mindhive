import RoleGuard from "../RoleGuard";
import ExploreList from "./List";
import ExploreDetail from "./Detail";

export default function ExploreMain({ query, user }) {
  const { op } = query;

  return (
    <RoleGuard allow={["student", "mentor", "teacher"]}>
      {op ? (
        <ExploreDetail query={query} user={user} opportunityId={op} />
      ) : (
        <ExploreList query={query} user={user} />
      )}
    </RoleGuard>
  );
}
