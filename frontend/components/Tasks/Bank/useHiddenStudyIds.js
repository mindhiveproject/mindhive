import { useContext, useMemo } from "react";

import { UserContext } from "../../Global/Authorized";
import { hiddenStudyIdsFor } from "../../../lib/taskBankFilter";

// Ids of the featured studies the signed-in user's classes hide from them.
export default function useHiddenStudyIds() {
  const { user } = useContext(UserContext);
  return useMemo(() => hiddenStudyIdsFor(user), [user]);
}
