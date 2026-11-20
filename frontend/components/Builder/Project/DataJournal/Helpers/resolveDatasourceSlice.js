/**
 * The loaded data of the dataset a component names (lib/componentDatasource.js).
 * A component never borrows another dataset: when its own is missing the
 * slice is null and `status` says why.
 */
import { componentDatasourceStatus } from "../../../../../lib/componentDatasource";

/**
 * @param {{
 *   content?: { datasourceId?: string | null } | null;
 *   journalDatasources?: Array<{ id?: string | null }> | null;
 *   sourceDataByDatasourceId?: Record<string, { data?: unknown[]; variables?: unknown[]; settings?: Record<string, unknown> }>;
 * }} params
 * @returns {{
 *   slice: { data?: unknown[]; variables?: unknown[]; settings?: Record<string, unknown> } | null;
 *   sliceReady: boolean;
 *   status: "ok" | "noDatasets" | "unassigned" | "missing" | "none";
 *   datasourceId: string | null;
 * }}
 */
export function resolveDatasourceSourceSlice({
  content,
  journalDatasources,
  sourceDataByDatasourceId,
}) {
  if (content == null || typeof content !== "object") {
    return { slice: null, sliceReady: false, status: "none", datasourceId: null };
  }

  const { status, datasourceId } = componentDatasourceStatus(
    content,
    journalDatasources,
  );
  if (status !== "ok") {
    // No datasets: widgets render their empty state. Unassigned or missing:
    // the widget frame shows a "pick a dataset" notice instead.
    return {
      slice: null,
      sliceReady: status === "noDatasets",
      status,
      datasourceId,
    };
  }

  const slice = sourceDataByDatasourceId?.[datasourceId] || null;
  return { slice, sliceReady: Boolean(slice), status, datasourceId };
}
