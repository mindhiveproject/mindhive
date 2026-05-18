import { useContext, useMemo } from "react";

import { UserContext } from "../../Global/Authorized";

export function deriveRoles(user) {
  if (!user) {
    return {
      isAdmin: false,
      isTeacher: false,
      isMentor: false,
      isStudent: false,
    };
  }

  const profileKind = user.profileKind || "";
  const adminFlag = (user.permissions || []).some(
    (p) => p?.canManageUsers || p?.canAccessAdminUI
  );

  return {
    isAdmin: adminFlag || profileKind === "admin",
    isTeacher:
      profileKind === "teacher" ||
      (user.teacherIn?.length || 0) > 0 ||
      (user.connectRoundsCreated?.length || 0) > 0,
    isMentor:
      profileKind === "mentor" ||
      (user.mentorIn?.length || 0) > 0 ||
      (user.opportunitiesCreated?.length || 0) > 0,
    isStudent:
      profileKind === "student" || (user.studentIn?.length || 0) > 0,
  };
}

export default function useConnectRole() {
  const user = useContext(UserContext);
  return useMemo(() => deriveRoles(user), [user]);
}
