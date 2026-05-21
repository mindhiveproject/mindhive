/**
 * Trim leading/trailing whitespace from variable/column names.
 * Two distinct headers that collapse to the same trimmed name (e.g. "x" and " x")
 * are not deduplicated here — callers may see collisions.
 */

/** @param {unknown} name */
export function normalizeVariableName(name) {
  if (name == null) return "";
  return String(name).trim();
}

/** Canonical Pyodide / renamed-dataframe column name for a variable metadata object. */
export function pyodideColumnNameFromVariable(v) {
  const display = normalizeVariableName(v?.displayName);
  if (display) return display;
  return normalizeVariableName(v?.field);
}

/** Rewrite one row object's keys to trimmed names (upload sanitization). */
export function normalizeRowKeys(row) {
  if (!row || typeof row !== "object") return row;
  const out = {};
  for (const key of Object.keys(row)) {
    const trimmed = normalizeVariableName(key);
    if (trimmed) out[trimmed] = row[key];
  }
  return out;
}

/** Unique sorted trimmed column names from parsed upload rows. */
export function columnNamesFromUploadData(data) {
  if (!Array.isArray(data)) return [];
  const allKeys = data
    .map((line) => Object.keys(line || {}))
    .reduce((a, b) => a.concat(b), []);
  const trimmed = allKeys.map((k) => normalizeVariableName(k)).filter(Boolean);
  return Array.from(new Set(trimmed)).sort();
}
