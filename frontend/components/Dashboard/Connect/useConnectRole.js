import { useContext, useMemo } from "react";

import { UserContext } from "../../Global/Authorized";

// MindHive identifies user roles via named Permission records attached to a
// Profile (Profile.permissions[].name). The four canonical names are uppercase
// — see e.g. components/Builder/Project/ProjectBoard/Board/Builder/AddCollaboratorModal.js
// for the same pattern used elsewhere on the platform.
const ROLE_PERMISSION_NAME = {
  student: "STUDENT",
  mentor: "MENTOR",
  teacher: "TEACHER",
  admin: "ADMIN",
};

function hasPermission(user, name) {
  return !!user?.permissions?.some((p) => p?.name === name);
}

export function deriveRoles(user) {
  return {
    isAdmin: hasPermission(user, ROLE_PERMISSION_NAME.admin),
    isTeacher: hasPermission(user, ROLE_PERMISSION_NAME.teacher),
    isMentor: hasPermission(user, ROLE_PERMISSION_NAME.mentor),
    isStudent: hasPermission(user, ROLE_PERMISSION_NAME.student),
  };
}

export default function useConnectRole() {
  const user = useContext(UserContext);
  return useMemo(() => deriveRoles(user), [user]);
}
