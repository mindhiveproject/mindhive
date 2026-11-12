import { useEffect, useRef } from "react";
import { useApolloClient } from "@apollo/client";

const MIN_INTERVAL_MS = 10000;

/**
 * Refetches the named active queries when the teacher comes back to the page
 * (window focus or the tab becoming visible), at most every 10 seconds.
 * Students submit, finish and open/close participation from their own
 * screens; without this the class pages kept showing what they loaded first
 * until a reload.
 */
export default function useRefetchOnFocus(queryNames, { skip = false } = {}) {
  const client = useApolloClient();
  const lastRun = useRef(Date.now());
  const names = queryNames.join("|");

  useEffect(() => {
    if (skip || typeof window === "undefined") return undefined;
    const include = names.split("|").filter(Boolean);
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (now - lastRun.current < MIN_INTERVAL_MS) return;
      lastRun.current = now;
      client.refetchQueries({ include }).catch(() => {});
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [client, names, skip]);
}
