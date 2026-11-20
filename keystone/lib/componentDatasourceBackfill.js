// One-off backfill: every Data Journal component names its dataset.
//
// Before, a component without `content.datasourceId`, or naming a dataset no
// longer in its journal, silently read the journal's most recently updated
// dataset. That choice moved whenever any dataset was edited (or shared, which
// also bumps updatedAt). The frontend now reads only the named dataset
// (frontend/lib/componentDatasource.js), so this writes in, once, the dataset
// each component shows today. Same rule as `legacyDatasourceId` there.

const DATA_COMPONENT_TYPES = [
  "GRAPH",
  "STATISTICS",
  "HYPVIS",
  "STATTEST",
  "CODE",
  "TABLE",
];

function parseContent(content) {
  if (typeof content !== "string") return content ?? null;
  try {
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

function namedDatasourceId(content) {
  const id = content?.datasourceId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function mostRecentDatasourceId(datasources) {
  const time = (d) => new Date(d?.updatedAt || d?.createdAt || 0).getTime();
  const [first] = [...(datasources || [])]
    .filter((d) => d?.id)
    .sort((a, b) => time(b) - time(a));
  return first?.id ?? null;
}

/**
 * What to do with one component.
 * @returns {{ action: "skip" | "keep" | "noDatasets" | "set", reason?: "unassigned" | "dangling", datasourceId?: string, content?: object }}
 */
function planComponent({ type, content, datasources }) {
  if (!DATA_COMPONENT_TYPES.includes(type)) return { action: "skip" };
  const parsed = parseContent(content);
  const named = namedDatasourceId(parsed);
  const ids = (datasources || []).map((d) => d?.id).filter(Boolean);
  if (named && ids.includes(named)) return { action: "keep" };
  const fallback = mostRecentDatasourceId(datasources);
  if (!fallback) return { action: "noDatasets" };
  const base = parsed && typeof parsed === "object" ? parsed : {};
  return {
    action: "set",
    reason: named ? "dangling" : "unassigned",
    datasourceId: fallback,
    content: { ...base, datasourceId: fallback },
  };
}

/**
 * Plan for every data component, read through Prisma in one query.
 * @returns {Promise<{ counts: Record<string, number>, updates: Array<{ id: string, reason: string, datasourceId: string, content: object }> }>}
 */
async function planBackfill(prisma) {
  const sections = await prisma.vizSection.findMany({
    where: { type: { in: DATA_COMPONENT_TYPES } },
    select: {
      id: true,
      type: true,
      content: true,
      vizChapter: {
        select: {
          vizPart: {
            select: {
              datasources: {
                select: { id: true, updatedAt: true, createdAt: true },
              },
            },
          },
        },
      },
    },
  });

  const counts = {
    checked: sections.length,
    keep: 0,
    unassigned: 0,
    dangling: 0,
    noDatasets: 0,
  };
  const updates = [];
  for (const section of sections) {
    const plan = planComponent({
      type: section.type,
      content: section.content,
      datasources: section.vizChapter?.vizPart?.datasources || [],
    });
    if (plan.action === "keep") counts.keep += 1;
    if (plan.action === "noDatasets") counts.noDatasets += 1;
    if (plan.action === "set") {
      counts[plan.reason] += 1;
      updates.push({
        id: section.id,
        reason: plan.reason,
        datasourceId: plan.datasourceId,
        content: plan.content,
      });
    }
  }
  return { counts, updates };
}

module.exports = {
  DATA_COMPONENT_TYPES,
  planComponent,
  planBackfill,
};
