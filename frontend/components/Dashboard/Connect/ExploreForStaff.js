import { useEffect } from "react";
import { useRouter } from "next/router";

import MessageCard from "../../DesignSystem/MessageCard";
import useConnectRole from "./useConnectRole";
import ExploreMain from "./Explore/Main";

/**
 * Explore opportunities is staff/sponsor only. Pure students are redirected
 * to My Classes (class Opportunities is their opportunity surface).
 */
export default function ExploreForStaff({ query, user }) {
  const router = useRouter();
  const { isStudent, isAdmin, isTeacher, isMentor, isSponsor, isClassNetworkAdmin } =
    useConnectRole();

  const canExplore =
    isAdmin || isTeacher || isMentor || isSponsor || isClassNetworkAdmin;
  const mustRedirect = isStudent && !canExplore;

  useEffect(() => {
    if (mustRedirect) {
      router.replace("/dashboard/classes");
    }
  }, [mustRedirect, router]);

  if (mustRedirect) {
    return (
      <MessageCard
        variant="information"
        message="Redirecting to your classes…"
      />
    );
  }

  if (!canExplore) {
    return (
      <MessageCard
        variant="neutral"
        message="Explore opportunities is not available for your account."
      />
    );
  }

  return <ExploreMain query={query} user={user} />;
}
