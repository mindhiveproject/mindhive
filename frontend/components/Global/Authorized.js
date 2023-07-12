import { useUser } from "../User";
import { useState, createContext } from "react";

export const UserContext = createContext();

export default function Authorized({ children }) {
  const user = useUser();
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
