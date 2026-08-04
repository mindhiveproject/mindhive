import OpportunitiesList from "./List";
import EditorDefinitionMode from "./EditorDefinitionMode";
import NetworkReview from "./NetworkReview";
import ReviewList from "./ReviewList";
import RoleGuard from "../RoleGuard";
import { deriveRoles } from "../useConnectRole";

export default function OpportunitiesMain({ query, user }) {
  const { op, tab, review } = query;
  const { isTeacher, isAdmin, isClassNetworkAdmin } = deriveRoles(user);
  const showReviewQueue =
    tab === "review" && (isTeacher || isAdmin || isClassNetworkAdmin);
  const isNetworkReview =
    op &&
    (review === "1" || review === "true") &&
    (isTeacher || isAdmin || isClassNetworkAdmin);

  return (
    <RoleGuard allow={["mentor", "teacher", "admin", "classNetworkAdmin"]}>
      {isNetworkReview ? (
        <NetworkReview opportunityId={op} query={query} user={user} />
      ) : op ? (
        <EditorDefinitionMode opportunityId={op} />
      ) : showReviewQueue ? (
        <ReviewList user={user} />
      ) : (
        <OpportunitiesList query={query} user={user} />
      )}
    </RoleGuard>
  );
}
