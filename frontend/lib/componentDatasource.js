// Which dataset a Data Journal component reads.
//
// Every data component (graph, table, statistics, test, code, hypothesis
// visualizer) names its dataset in `content.datasourceId`. It reads that
// dataset and no other: when the id is missing, or names a dataset that is no
// longer in the journal, the component says so instead of borrowing another
// one.

const DATA_COMPONENT_TYPES = [
  "GRAPH",
  "STATISTICS",
  "HYPVIS",
  "STATTEST",
  "CODE",
  "TABLE",
];

function isDataComponentType(type) {
  return DATA_COMPONENT_TYPES.includes(type);
}

/** The dataset id a component's content names, or null. */
function componentDatasourceId(content) {
  const id = content?.datasourceId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

/**
 * Where a component stands with its dataset.
 *   ok         — it names a dataset of this journal
 *   noDatasets — the journal has no datasets yet
 *   unassigned — it names no dataset
 *   missing    — it names a dataset that is no longer in the journal
 * @param {object | null | undefined} content
 * @param {Array<{ id?: string | null }> | null | undefined} journalDatasources
 * @returns {{ status: "ok" | "noDatasets" | "unassigned" | "missing", datasourceId: string | null }}
 */
function componentDatasourceStatus(content, journalDatasources) {
  const ids = (Array.isArray(journalDatasources) ? journalDatasources : [])
    .map((d) => d?.id)
    .filter(Boolean);
  const datasourceId = componentDatasourceId(content);
  if (!ids.length) return { status: "noDatasets", datasourceId };
  if (!datasourceId) return { status: "unassigned", datasourceId: null };
  if (!ids.includes(datasourceId)) return { status: "missing", datasourceId };
  return { status: "ok", datasourceId };
}

/**
 * The dataset a component showed before every component named its own: the
 * one it names when the journal has it, else the journal's most recently
 * updated dataset. Used once, when copying a template, to write that choice in.
 * @param {object | null | undefined} content
 * @param {Array<{ id?: string | null, updatedAt?: string, createdAt?: string }>} datasources
 * @returns {string | null}
 */
function legacyDatasourceId(content, datasources) {
  const list = (Array.isArray(datasources) ? datasources : []).filter(
    (d) => d?.id
  );
  const named = componentDatasourceId(content);
  if (named && list.some((d) => d.id === named)) return named;
  const time = (d) => new Date(d?.updatedAt || d?.createdAt || 0).getTime();
  const [mostRecent] = [...list].sort((a, b) => time(b) - time(a));
  return mostRecent?.id ?? null;
}

module.exports = {
  DATA_COMPONENT_TYPES,
  isDataComponentType,
  componentDatasourceId,
  componentDatasourceStatus,
  legacyDatasourceId,
};
