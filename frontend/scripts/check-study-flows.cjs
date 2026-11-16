#!/usr/bin/env node
// Checks the new study graph code (lib/studyGraph) against saved studies:
// for each study it rebuilds study.flow from study.diagram and compares it
// with the flow that is stored, and lists designs that do not follow the
// one-link-per-output rule. Read-only: it never writes to the database.
//
// Export the studies (and versions) to a JSON file first, e.g.
//
//   psql "$DATABASE_URL" -Atc "select json_agg(s) from (
//       select 'Study' as source, id, diagram, flow from \"Study\"
//         where diagram is not null and diagram <> ''
//       union all
//       select 'StudyVersion', id, diagram, flow from \"StudyVersion\"
//         where diagram is not null and diagram <> '' and flow is not null
//     ) s" > studies.json
//
//   node scripts/check-study-flows.cjs studies.json [--details]

const fs = require("fs");
const path = require("path");
const {
  fromStormDiagram,
  buildStudyFlow,
  isStormDiagram,
  NODE_TYPES,
  OUT_HANDLE,
} = require("../lib/studyGraph");
const { legacyStudyFlow, normalizeFlow } = require("../lib/studyGraph/legacyFlow");

const [file, ...flags] = process.argv.slice(2);
if (!file) {
  console.error("Usage: node scripts/check-study-flows.cjs <studies.json> [--details]");
  process.exit(1);
}
const showDetails = flags.includes("--details");

const raw = fs.readFileSync(path.resolve(file), "utf8").trim();
const rows = JSON.parse(raw || "[]") || [];

const parseFlow = (flow) => {
  if (typeof flow !== "string") return flow;
  try {
    return JSON.parse(flow);
  } catch (e) {
    return undefined;
  }
};

function firstDifference(a, b, at = "flow") {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) {
    return `${at}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const diff = firstDifference(a[key], b[key], `${at}.${key}`);
    if (diff) return diff;
  }
  return `${at}: differs`;
}

function extraLinks(graph) {
  const counts = new Map();
  graph.edges.forEach((e) => {
    const key = `${e.source}|${e.sourceHandle || OUT_HANDLE}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const types = new Map(graph.nodes.map((n) => [n.id, n.type]));
  const out = { task: 0, condition: 0 };
  counts.forEach((count, key) => {
    if (count < 2) return;
    const type = types.get(key.split("|")[0]);
    if (type === NODE_TYPES.DESIGN) out.condition += 1;
    else out.task += 1;
  });
  return out;
}

const result = {
  total: rows.length,
  notStorm: [],
  noStoredFlow: [],
  same: 0,
  // new ≠ stored, and the old algorithm run now does not match stored either:
  // the stored flow is out of date or was written by older code
  staleStoredFlow: [],
  // new ≠ stored but old algorithm = stored: a real behaviour change
  changed: [],
  multiLinkTasks: [],
  multiLinkConditions: [],
};

rows.forEach((row) => {
  const label = `${row.source || "Study"} ${row.id}`;
  if (!isStormDiagram(row.diagram)) {
    result.notStorm.push(label);
    return;
  }
  const graph = fromStormDiagram(row.diagram);
  const extra = extraLinks(graph);
  if (extra.task) result.multiLinkTasks.push(label);
  if (extra.condition) result.multiLinkConditions.push(label);

  const stored = parseFlow(row.flow);
  if (!Array.isArray(stored)) {
    result.noStoredFlow.push(label);
    return;
  }
  const rebuilt = normalizeFlow(buildStudyFlow(graph));
  const expected = normalizeFlow(stored);
  if (JSON.stringify(rebuilt) === JSON.stringify(expected)) {
    result.same += 1;
    return;
  }
  let legacy;
  try {
    legacy = normalizeFlow(legacyStudyFlow(row.diagram));
  } catch (e) {
    legacy = null;
  }
  const entry = { label, difference: firstDifference(rebuilt, expected) };
  if (legacy && JSON.stringify(legacy) === JSON.stringify(expected)) {
    result.changed.push(entry);
  } else {
    result.staleStoredFlow.push(entry);
  }
});

const list = (title, items) => {
  console.log(`${title}: ${items.length}`);
  if (showDetails) {
    items.forEach((item) =>
      console.log(
        typeof item === "string" ? `  ${item}` : `  ${item.label}\n    ${item.difference}`
      )
    );
  }
};

console.log(`Checked: ${result.total}`);
console.log(`Same flow as stored: ${result.same}`);
list("Different from stored, old code agrees with stored (behaviour change)", result.changed);
list("Different from stored, old code disagrees too (stored flow out of date)", result.staleStoredFlow);
list("No stored flow", result.noStoredFlow);
list("Not a Storm diagram", result.notStorm);
list("Task or starting point with more than one link", result.multiLinkTasks);
list("Condition with more than one link", result.multiLinkConditions);
if (!showDetails) console.log("\nAdd --details to list the studies.");
