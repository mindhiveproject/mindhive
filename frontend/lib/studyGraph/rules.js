// Which links the Study Builder accepts. Shared by the canvas (to refuse a
// link while it is being dragged) and anything that edits the graph.

const {
  NODE_TYPES,
  IN_HANDLE,
  OUT_HANDLE,
  MAX_LINKS_PER_OUTPUT,
} = require("./constants");

/** Output handles a node has: "out", or one per design condition. */
function outputHandles(node) {
  if (!node) return [];
  if (node.type === NODE_TYPES.DESIGN) {
    return (node.data?.conditions || []).map((c) => c?.name).filter(Boolean);
  }
  if (node.type === NODE_TYPES.TASK || node.type === NODE_TYPES.ANCHOR) {
    return [OUT_HANDLE];
  }
  return [];
}

function hasInput(node) {
  return node?.type === NODE_TYPES.TASK || node?.type === NODE_TYPES.DESIGN;
}

/** Ids of the nodes a node links to, in link order. */
function childIds(edges, nodeId) {
  return (edges || []).filter((e) => e.source === nodeId).map((e) => e.target);
}

/** True when a link source → target would close a loop. */
function wouldCreateCycle(edges, sourceId, targetId) {
  if (!sourceId || !targetId) return false;
  if (sourceId === targetId) return true;
  const visited = new Set();
  const queue = [targetId];
  while (queue.length) {
    const current = queue.shift();
    if (current === sourceId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    childIds(edges, current).forEach((id) => {
      if (!visited.has(id)) queue.push(id);
    });
  }
  return false;
}

/**
 * Whether a link may be made. Returns { ok: true } or { ok: false, reason }
 * where reason is one of "missing", "self", "handle", "duplicate", "limit",
 * "cycle". Only "cycle" is worth telling the user about; the others are
 * ordinary misses while dragging.
 */
function checkConnection(graph, { source, sourceHandle, target, targetHandle }) {
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);
  if (!sourceNode || !targetNode) return { ok: false, reason: "missing" };
  if (source === target) return { ok: false, reason: "self" };
  const handle = sourceHandle || OUT_HANDLE;
  if (!outputHandles(sourceNode).includes(handle)) {
    return { ok: false, reason: "handle" };
  }
  if (!hasInput(targetNode) || (targetHandle && targetHandle !== IN_HANDLE)) {
    return { ok: false, reason: "handle" };
  }
  const fromHandle = edges.filter(
    (e) => e.source === source && (e.sourceHandle || OUT_HANDLE) === handle
  );
  if (fromHandle.some((e) => e.target === target)) {
    return { ok: false, reason: "duplicate" };
  }
  if (fromHandle.length >= MAX_LINKS_PER_OUTPUT) {
    return { ok: false, reason: "limit" };
  }
  if (wouldCreateCycle(edges, source, target)) {
    return { ok: false, reason: "cycle" };
  }
  return { ok: true };
}

module.exports = {
  outputHandles,
  hasInput,
  wouldCreateCycle,
  checkConnection,
};
