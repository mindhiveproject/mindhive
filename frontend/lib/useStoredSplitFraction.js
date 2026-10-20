import { useCallback, useEffect, useRef, useState } from "react";

// A column split the user dragged, kept per browser under `storageKey`.
// `null` until the stored value has been read, so the split mounts once at the
// right width instead of hydrating at the default and jumping.
export default function useStoredSplitFraction(storageKey, defaultFraction) {
  const [fraction, setFraction] = useState(null);
  // Latest dragged value, so a split that remounts comes back where the user
  // left it.
  const latestRef = useRef(null);
  const saveTimerRef = useRef();

  useEffect(() => {
    let stored = NaN;
    try {
      stored = parseFloat(window.localStorage.getItem(storageKey));
    } catch {
      // storage blocked; fall back to the default
    }
    const initial = stored > 0 && stored < 1 ? stored : defaultFraction;
    latestRef.current = initial;
    setFraction(initial);
    return () => clearTimeout(saveTimerRef.current);
  }, [storageKey, defaultFraction]);

  // The divider reports every pointer move; only the resting value matters.
  const saveFraction = useCallback(
    (next) => {
      latestRef.current = next;
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        try {
          window.localStorage.setItem(storageKey, String(next));
        } catch {
          // ignore storage errors
        }
      }, 200);
    },
    [storageKey]
  );

  return [fraction === null ? null : latestRef.current, saveFraction];
}
