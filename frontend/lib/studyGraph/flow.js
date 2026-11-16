// Builds study.flow, the tree the study runtime walks
// (Studies/Run/Manager.js, keystone/lib/runtime/runtimeCore.js), from the
// design graph. The shape is the one the Storm canvas wrote:
//
//   [ { id, type: "my-anchor", position: 0 },
//     { id, type: "my-node", componentID, testId, ..., position: 1 },
//     { id, type: "design", name, details, position: 2,
//       conditions: [{ name, label, probability, ..., flow: [ ... ] }] } ]
//
// Each block is pushed after the block that links to it; a design block
// starts one nested flow per condition.

const {
  NODE_TYPES,
  LEGACY_TYPES,
  OUT_HANDLE,
  TASK_FIELDS,
  CONDITION_FIELDS,
} = require("./constants");

function pick(source, fields) {
  const out = {};
  fields.forEach((field) => {
    if (source?.[field] !== undefined) out[field] = source[field];
  });
  return out;
}

function flowEntry(node, position) {
  const base = { id: node.id, type: LEGACY_TYPES[node.type] };
  if (node.type === NODE_TYPES.TASK) {
    return { ...base, ...pick(node.data, TASK_FIELDS), position };
  }
  if (node.type === NODE_TYPES.DESIGN) {
    return {
      ...base,
      ...pick(node.data, ["name", "details"]),
      position,
      conditions: (node.data?.conditions || []).map((condition) => ({
        ...pick(condition, CONDITION_FIELDS),
        flow: [],
      })),
    };
  }
  return { ...base, position };
}

function buildStudyFlow(graph) {
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const childrenOf = (nodeId, handle) =>
    edges
      .filter(
        (e) =>
          e.source === nodeId &&
          (e.sourceHandle || OUT_HANDLE) === handle &&
          byId.has(e.target)
      )
      .map((e) => byId.get(e.target));

  const visit = (node, flow, position, path) => {
    // a node already on the current path closes a loop; one reached along
    // two different paths is visited twice (the runtime skips the repeat)
    if (!node || path.has(node.id)) return;
    const nextPath = new Set(path).add(node.id);
    const entry = flowEntry(node, position);
    flow.push(entry);

    if (node.type === NODE_TYPES.DESIGN) {
      (node.data?.conditions || []).forEach((condition, index) => {
        childrenOf(node.id, condition?.name).forEach((child) =>
          visit(child, entry.conditions[index].flow, position + 1, nextPath)
        );
      });
      return;
    }
    childrenOf(node.id, OUT_HANDLE).forEach((child) =>
      visit(child, flow, position + 1, nextPath)
    );
  };

  const flow = [];
  const anchor = nodes.find((n) => n.type === NODE_TYPES.ANCHOR);
  visit(anchor, flow, 0, new Set());
  return flow;
}

module.exports = { buildStudyFlow };
