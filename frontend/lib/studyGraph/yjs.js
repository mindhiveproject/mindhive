// The design graph inside a shared Yjs document (collaborative editing).
//
//   doc.getMap("nodes"): id → Y.Map { type, x, y, order, data: Y.Map(field → JSON) }
//   doc.getMap("edges"): id → { source, sourceHandle, target, targetHandle, order }
//   doc.getMap("meta"):  { seeded, savedFingerprint, editedAt }
//
// Each block field is its own entry, so two people editing different blocks,
// or different fields of one block (one moves it, another renames its task),
// both keep their change. `order` keeps the order of blocks and links the same
// for everyone (it decides the run order of links from one output).
// The viewport is per person and is not shared.

const NODES = "nodes";
const EDGES = "edges";
const META = "meta";

const isYMap = (value) =>
  !!value && typeof value.get === "function" && typeof value.set === "function";

const byOrder = (a, b) =>
  a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function readGraph(doc) {
  const nodes = [];
  doc.getMap(NODES).forEach((ynode, id) => {
    if (!isYMap(ynode)) return;
    const ydata = ynode.get("data");
    nodes.push({
      id,
      order: Number(ynode.get("order")) || 0,
      type: ynode.get("type"),
      position: { x: Number(ynode.get("x")) || 0, y: Number(ynode.get("y")) || 0 },
      data: isYMap(ydata) ? ydata.toJSON() : {},
    });
  });
  const edges = [];
  doc.getMap(EDGES).forEach((edge, id) => {
    if (!edge?.source || !edge?.target) return;
    edges.push({ ...edge, id, order: Number(edge.order) || 0 });
  });
  return {
    nodes: nodes.sort(byOrder).map(({ order, ...node }) => node),
    edges: edges.sort(byOrder).map(({ order, ...edge }) => edge),
  };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function maxOrder(map) {
  let max = -1;
  map.forEach((value) => {
    const order = Number(isYMap(value) ? value.get("order") : value?.order);
    if (Number.isFinite(order) && order > max) max = order;
  });
  return max;
}

function writeData(ydata, data) {
  const next = data || {};
  Array.from(ydata.keys()).forEach((key) => {
    if (next[key] === undefined) ydata.delete(key);
  });
  Object.keys(next).forEach((key) => {
    if (next[key] === undefined) return;
    if (!same(ydata.get(key), next[key])) ydata.set(key, next[key]);
  });
}

/**
 * Makes the document hold `graph` (nodes and edges), writing only what
 * differs. Call inside doc.transact so the change is one update with an
 * origin (undo, saving and seeding look at the origin).
 */
function writeGraph(doc, graph, Y) {
  const ynodes = doc.getMap(NODES);
  const yedges = doc.getMap(EDGES);
  const nodes = graph?.nodes || [];
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = (graph?.edges || []).filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
  );
  const edgeIds = new Set(edges.map((e) => e.id));

  Array.from(ynodes.keys()).forEach((id) => {
    if (!nodeIds.has(id)) ynodes.delete(id);
  });
  Array.from(yedges.keys()).forEach((id) => {
    if (!edgeIds.has(id)) yedges.delete(id);
  });

  let nextNodeOrder = maxOrder(ynodes) + 1;
  nodes.forEach((node) => {
    const existing = ynodes.get(node.id);
    if (!isYMap(existing)) {
      const ynode = new Y.Map();
      ynode.set("type", node.type);
      ynode.set("x", node.position?.x || 0);
      ynode.set("y", node.position?.y || 0);
      ynode.set("order", nextNodeOrder);
      nextNodeOrder += 1;
      const ydata = new Y.Map();
      Object.entries(node.data || {}).forEach(([key, value]) => {
        if (value !== undefined) ydata.set(key, value);
      });
      ynode.set("data", ydata);
      ynodes.set(node.id, ynode);
      return;
    }
    if (existing.get("type") !== node.type) existing.set("type", node.type);
    if (existing.get("x") !== node.position?.x) existing.set("x", node.position?.x || 0);
    if (existing.get("y") !== node.position?.y) existing.set("y", node.position?.y || 0);
    let ydata = existing.get("data");
    if (!isYMap(ydata)) {
      ydata = new Y.Map();
      existing.set("data", ydata);
    }
    writeData(ydata, node.data);
  });

  let nextEdgeOrder = maxOrder(yedges) + 1;
  edges.forEach((edge) => {
    const existing = yedges.get(edge.id);
    const value = {
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle,
      order: existing ? existing.order : nextEdgeOrder,
    };
    if (!existing) nextEdgeOrder += 1;
    if (!same(existing, value)) yedges.set(edge.id, value);
  });
}

const meta = (doc) => doc.getMap(META);

module.exports = { readGraph, writeGraph, meta, NODES, EDGES, META };
