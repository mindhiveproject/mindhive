/**
 * Map persisted graph/stat selector strings to the column name that exists on the
 * Pyodide dataframe (single-datasource / per-component slice: renameData uses displayName when set).
 */
export function selectorValueForPyodide(stored, variables) {
  const raw = stored == null ? "" : String(stored).trim();
  if (!raw || !variables?.length) return raw;

  const byField = variables.find((v) => v.field === raw);
  const byDisplay = variables.find(
    (v) => String(v.displayName || "").trim() === raw,
  );

  if (byDisplay) {
    return byDisplay.displayName && String(byDisplay.displayName).trim()
      ? byDisplay.displayName
      : byDisplay.field;
  }
  if (byField) {
    return byField.displayName && String(byField.displayName).trim()
      ? byField.displayName
      : byField.field;
  }
  return raw;
}

/** Comma-separated multi-select (bar wide, histogram) */
export function selectorListForPyodide(storedListOrCsv, variables) {
  const parts = Array.isArray(storedListOrCsv)
    ? storedListOrCsv
    : String(storedListOrCsv || "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
  return parts
    .map((p) => selectorValueForPyodide(p, variables))
    .filter(Boolean);
}
