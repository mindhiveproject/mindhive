import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";

// Saves a page automatically a moment after it changes. Saves run one after
// the other, and the page only counts as saved when nothing changed while the
// last save was running. Shared by the study builder and the participant page.
export default function useAutoSave({ save, isEnabled, delay = 1000 }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // idle | saving | saved | error
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState(null);

  const saveRef = useRef(save);
  saveRef.current = save;
  const isEnabledRef = useRef(isEnabled);
  isEnabledRef.current = isEnabled;
  // every change bumps the revision
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const queueRef = useRef(Promise.resolve());

  const runSave = useCallback(async (options = {}) => {
    const revision = revisionRef.current;
    if (!options.force && revision === savedRevisionRef.current) return null;
    setSaveState("saving");
    try {
      const result = await saveRef.current(options);
      savedRevisionRef.current = revision;
      if (revisionRef.current === revision) setHasUnsavedChanges(false);
      setSaveState("saved");
      setSaveError(null);
      return result;
    } catch (error) {
      setSaveState("error");
      setSaveError(error);
      throw error;
    }
  }, []);

  // Saves right away, after the save that is running. The options are passed
  // on to save; force saves even when nothing has changed.
  const saveNow = useCallback(
    (options) => {
      const next = queueRef.current.then(() => runSave(options));
      queueRef.current = next.catch(() => {});
      return next;
    },
    [runSave]
  );

  const autoSave = useMemo(
    () =>
      debounce(() => {
        if (!isEnabledRef.current) return;
        // a failed save is shown with saveState, and retried on the next change
        saveNow().catch(() => {});
      }, delay),
    [saveNow, delay]
  );

  const markChanged = useCallback(() => {
    revisionRef.current += 1;
    setHasUnsavedChanges(true);
    autoSave();
  }, [autoSave]);

  const retry = useCallback(() => {
    saveNow().catch(() => {});
  }, [saveNow]);

  // leaving the page saves what is still waiting for the delay
  useEffect(
    () => () => {
      autoSave.flush();
    },
    [autoSave]
  );

  // closing the tab cannot wait for a save, so the browser asks first
  useEffect(() => {
    if (!isEnabled || !(hasUnsavedChanges || saveState === "saving")) {
      return undefined;
    }
    const warnBeforeUnload = (event) => {
      autoSave.flush();
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isEnabled, hasUnsavedChanges, saveState, autoSave]);

  return {
    hasUnsavedChanges,
    saveState,
    saveError,
    markChanged,
    saveNow,
    autoSave,
    retry,
  };
}
