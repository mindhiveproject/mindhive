import { useContext, useMemo } from "react";

import { UserContext } from "../../Global/Authorized";

// MindHive identifies user roles via named Permission records attached to a
// Profile (Profile.permissions[].name). The four canonical names are uppercase
// — see e.g. components/Builder/Project/ProjectBoard/Board/Builder/AddCollaboratorModal.js
// for the same pattern used elsewhere on the platform.
//
// SPONSOR: organization accounts that signed up via /signup/sponsor. For
// Connect role-gating they get the same surface as MENTOR (they create
// Opportunities, see "My matched students", etc.). Keeping the SPONSOR name
// distinct lets us tell apart "individual mentor" from "organization sponsor"
// later (e.g., on profile cards) without affecting access.
const ROLE_PERMISSION_NAMES = {
  student: ["STUDENT"],
  mentor: ["MENTOR", "SPONSOR"],
  teacher: ["TEACHER"],
  admin: ["ADMIN"],
};

function hasAnyPermission(user, names) {
  return !!user?.permissions?.some((p) => names.includes(p?.name));
}

export function deriveRoles(user) {
  return {
    isAdmin: hasAnyPermission(user, ROLE_PERMISSION_NAMES.admin),
    isTeacher: hasAnyPermission(user, ROLE_PERMISSION_NAMES.teacher),
    isMentor: hasAnyPermission(user, ROLE_PERMISSION_NAMES.mentor),
    isStudent: hasAnyPermission(user, ROLE_PERMISSION_NAMES.student),
    isSponsor: hasAnyPermission(user, ["SPONSOR"]),
  };
}

export default function useConnectRole() {
  const user = useContext(UserContext);
  return useMemo(() => deriveRoles(user), [user]);
}
