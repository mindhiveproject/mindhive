/**
 * Resolve which datasource slice a component uses (per-component dataset selection).
 */

/**
 * @param {Array<{ id?: string | null }> | null | undefined} journalDatasources
 * @returns {string | null}
 */
function getDefaultDatasourceId(journalDatasources) {
  const list = Array.isArray(journalDatasources) ? journalDatasources : [];
  const first = list.find((d) => d?.id);
  return first?.id ?? null;
}

/**
 * @param {{ datasourceId?: string | null } | null | undefined} content
 * @param {Array<{ id?: string | null }> | null | undefined} journalDatasources
 * @returns {string | null}
 */
export function getEffectiveDatasourceId(content, journalDatasources) {
  const explicit = content?.datasourceId;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  return getDefaultDatasourceId(journalDatasources);
}

/**
 * @param {{
 *   content?: { datasourceId?: string | null } | null;
 *   journalDatasources?: Array<{ id?: string | null }> | null;
 *   sourceDataByDatasourceId?: Record<string, { data?: unknown[]; variables?: unknown[]; settings?: Record<string, unknown> }>;
 * }} params
 * @returns {{ slice: { data?: unknown[]; variables?: unknown[]; settings?: Record<string, unknown> } | null; sliceReady: boolean }}
 */
export function resolveDatasourceSourceSlice({
  content,
  journalDatasources,
  sourceDataByDatasourceId,
}) {
  if (content == null || typeof content !== "object") {
    return {
      slice: null,
      sliceReady: false,
    };
  }

  const map =
    sourceDataByDatasourceId && typeof sourceDataByDatasourceId === "object"
      ? sourceDataByDatasourceId
      : {};
  const dsList = Array.isArray(journalDatasources) ? journalDatasources : [];

  if (dsList.length === 0) {
    return {
      slice: null,
      sliceReady: true,
    };
  }

  let resolvedId = getEffectiveDatasourceId(content, journalDatasources);
  if (!resolvedId) {
    return { slice: null, sliceReady: false };
  }

  if (!map[resolvedId]) {
    resolvedId = getDefaultDatasourceId(dsList);
  }
  if (!resolvedId) {
    return { slice: null, sliceReady: false };
  }

  const slice = map[resolvedId];
  return {
    slice: slice || null,
    sliceReady: Boolean(slice),
  };
}
