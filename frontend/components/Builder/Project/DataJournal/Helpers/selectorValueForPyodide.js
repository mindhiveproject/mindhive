import {
  normalizeVariableName,
  pyodideColumnNameFromVariable,
} from "../../../../../lib/normalizeVariableName";

/**
 * Map persisted graph/stat selector strings to the column name that exists on the
 * Pyodide dataframe (single-datasource / per-component slice: renameData uses displayName when set).
 */
export function selectorValueForPyodide(stored, variables) {
  const raw = normalizeVariableName(stored);
  if (!raw || !variables?.length) return raw;

  const byField = variables.find(
    (v) => v.field === raw || normalizeVariableName(v.field) === raw,
  );
  const byDisplay = variables.find(
    (v) => normalizeVariableName(v.displayName) === raw,
  );

  if (byDisplay) return pyodideColumnNameFromVariable(byDisplay);
  if (byField) return pyodideColumnNameFromVariable(byField);
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
