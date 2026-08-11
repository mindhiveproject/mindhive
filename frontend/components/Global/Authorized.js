import { useUser } from "../Utils/Access/User";
import { createContext, useMemo } from "react";

/**
 * Auth state for the whole app: `{ user, loading }`.
 *
 * `loading` is part of the value rather than a separate context because a null
 * user is meaningless without it — "not known yet" and "logged out" look
 * identical otherwise, which is what made gated pages flash the login form.
 */
export const UserContext = createContext({ user: null, loading: false });

export default function Authorized({ children }) {
  const { user, loading } = useUser();
  const value = useMemo(() => ({ user, loading }), [user, loading]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
