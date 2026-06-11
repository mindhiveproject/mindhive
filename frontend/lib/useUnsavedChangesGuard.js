import { useEffect } from "react";

export function confirmLeaveIfDirty(message) {
  return window.confirm(message);
}

export function useUnsavedChangesGuard(hasUnsavedChanges) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);
}
