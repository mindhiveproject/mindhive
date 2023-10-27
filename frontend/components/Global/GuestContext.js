import { useLazyQuery } from "@apollo/client";
import { useState, useEffect, createContext } from "react";

export const GuestContext = createContext();

import { GET_GUEST } from "../Queries/Guest";

export default function Guest({ children, query }) {
  const guestPublicId = query?.guest;

  const [guest, setGuest] = useState(null);
  const [loadGuestData, { data }] = useLazyQuery(GET_GUEST);

  const fetchGuestData = async (publicId) => {
    const { data } = await loadGuestData({ variables: { publicId } });
    if (data?.guest) {
      setGuest(data?.guest);
    }
  };

  useEffect(() => {
    if (guestPublicId) {
      fetchGuestData(guestPublicId);
    }
  }, [guestPublicId]);

  return (
    <GuestContext.Provider value={guest}>{children}</GuestContext.Provider>
  );
}
