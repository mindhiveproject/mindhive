import { useContext, useMemo } from "react";

import { UserContext } from "../../Global/Authorized";
import { hiddenTaskIdsFor } from "../../../lib/taskBankFilter";

// Ids of the public tasks the signed-in user's classes hide from them. Reads
// the full current user from context, so callers don't depend on whichever
// `user` prop they were handed.
export default function useHiddenTaskIds() {
  const { user } = useContext(UserContext);
  return useMemo(() => hiddenTaskIdsFor(user), [user]);
}
