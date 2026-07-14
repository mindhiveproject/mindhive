import OpportunitiesList from "./List";
import OpportunityEditor from "./EditorSwitch";
import ReviewList from "./ReviewList";
import RoleGuard from "../RoleGuard";
import { deriveRoles } from "../useConnectRole";

export default function OpportunitiesMain({ query, user }) {
  const { op, tab } = query;
  const { isTeacher, isAdmin, isClassNetworkAdmin } = deriveRoles(user);
  const showReviewQueue =
    tab === "review" && (isTeacher || isAdmin || isClassNetworkAdmin);

  return (
    <RoleGuard allow={["mentor", "teacher", "admin", "classNetworkAdmin"]}>
      {op ? (
        <OpportunityEditor query={query} user={user} opportunityId={op} />
      ) : showReviewQueue ? (
        <ReviewList user={user} />
      ) : (
        <OpportunitiesList query={query} user={user} />
      )}
    </RoleGuard>
  );
}
