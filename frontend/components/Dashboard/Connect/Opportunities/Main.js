import OpportunitiesList from "./List";
import OpportunityEditor from "./EditorSwitch";
import ReviewList from "./ReviewList";
import RoleGuard from "../RoleGuard";
import { deriveRoles } from "../useConnectRole";

export default function OpportunitiesMain({ query, user }) {
  const { op, tab } = query;
  const { isTeacher, isAdmin } = deriveRoles(user);
  const showReviewQueue = tab === "review" && (isTeacher || isAdmin);

  return (
    <RoleGuard allow={["mentor", "teacher"]}>
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
