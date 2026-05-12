import filterData, { renameData } from "../../../../../Helpers/Filter";

/** Same row keys as Pyodide `df` (filtered + displayName rename). */
export function rowsForGraphColorKeys(slice) {
  if (!slice) return [];
  const data = Array.isArray(slice.data) ? slice.data : [];
  const variables = Array.isArray(slice.variables) ? slice.variables : [];
  const settings =
    slice.settings && typeof slice.settings === "object" ? slice.settings : {};
  const filtered = filterData({ data, settings });
  return renameData({ data: filtered, variables });
}
