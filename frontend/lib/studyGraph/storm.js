// Converts between the design graph and the diagram JSON written by the
// @projectstorm/react-diagrams canvas (study.diagram, StudyVersion.diagram,
// study templates). The Storm format stays the saved format while both
// canvases are in use, so either canvas can open any study.

const {
  NODE_TYPES,
  LEGACY_TYPES,
  TYPE_FROM_LEGACY,
  IN_HANDLE,
  OUT_HANDLE,
  MAX_LINKS_PER_OUTPUT,
  TASK_FIELDS,
} = require("./constants");

const LINK_LAYER = "diagram-links";
const NODE_LAYER = "diagram-nodes";
const IN_PORT = "inCustomPort";
const OUT_PORT = "outCustomPort";

function parseDiagram(diagram) {
  if (!diagram) return null;
  if (typeof diagram === "object") return diagram;
  try {
    return JSON.parse(diagram);
  } catch (e) {
    return null;
  }
}

function isStormDiagram(diagram) {
  const parsed = parseDiagram(diagram);
  return Array.isArray(parsed?.layers);
}

function nodeData(model, type) {
  if (type === NODE_TYPES.TASK) {
    const data = {};
    TASK_FIELDS.forEach((field) => {
      if (model[field] !== undefined) data[field] = model[field];
    });
    return data;
  }
  if (type === NODE_TYPES.DESIGN) {
    return {
      name: model.name,
      details: model.details,
      conditions: (model.ports || [])
        .filter((port) => port?.type === OUT_PORT)
        .map((port) => ({
          name: port.name,
          label: port.label,
          probability: port.probability,
          assignmentType: port.assignmentType,
          rule: port.rule,
        })),
    };
  }
  if (type === NODE_TYPES.COMMENT) {
    return { author: model.author, time: model.time, content: model.content };
  }
  return {};
}

/**
 * Storm diagram (string or object) → graph. Nodes of unknown types and links
 * not connected on both ends are dropped. Ids are kept: block ids are stored
 * in participants' paths and in data source scopes.
 */
function fromStormDiagram(diagram) {
  const parsed = parseDiagram(diagram);
  const layers = parsed?.layers || [];
  const nodeModels = Object.values(
    layers.find((l) => l?.type === NODE_LAYER)?.models || {}
  );
  const linkModels = Object.values(
    layers.find((l) => l?.type === LINK_LAYER)?.models || {}
  );

  const nodes = [];
  const ports = new Map(); // port id → { nodeId, name, kind }
  nodeModels.forEach((model) => {
    const type = TYPE_FROM_LEGACY[model?.type];
    if (!type || !model?.id) return;
    nodes.push({
      id: model.id,
      type,
      position: { x: Number(model.x) || 0, y: Number(model.y) || 0 },
      data: nodeData(model, type),
    });
    (model.ports || []).forEach((port) => {
      if (port?.id) {
        ports.set(port.id, { nodeId: model.id, name: port.name, kind: port.type });
      }
    });
  });

  const edges = [];
  linkModels.forEach((link) => {
    let from = ports.get(link?.sourcePort);
    let to = ports.get(link?.targetPort);
    if (!from || !to) return;
    // a link drawn backwards (into an output) still means output → input
    if (from.kind === IN_PORT && to.kind === OUT_PORT) [from, to] = [to, from];
    if (from.kind !== OUT_PORT || to.kind !== IN_PORT) return;
    edges.push({
      id: link.id,
      source: from.nodeId,
      sourceHandle: from.name || OUT_HANDLE,
      target: to.nodeId,
      targetHandle: IN_HANDLE,
    });
  });

  return {
    nodes,
    edges,
    viewport: {
      x: Number(parsed?.offsetX) || 0,
      y: Number(parsed?.offsetY) || 0,
      zoom: (Number(parsed?.zoom) || 100) / 100,
    },
  };
}

const portId = (nodeId, name) => `${nodeId}:${name}`;

function stormPort(node, { name, kind, label, extra = {} }, linkIds) {
  return {
    id: portId(node.id, name),
    type: kind,
    x: node.position.x,
    y: node.position.y,
    name,
    // the values the Storm port models were created with
    alignment: kind === IN_PORT ? "top" : "down",
    parentNode: node.id,
    links: linkIds,
    in: kind === IN_PORT,
    label: label ?? name,
    ...extra,
  };
}

/** Graph → Storm diagram object (JSON.stringify it for study.diagram). */
function toStormDiagram(graph) {
  const nodes = graph?.nodes || [];
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = (graph?.edges || []).filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
  );
  const linksOf = (nodeId, handle, side) =>
    edges
      .filter((e) =>
        side === "source"
          ? e.source === nodeId && (e.sourceHandle || OUT_HANDLE) === handle
          : e.target === nodeId
      )
      .map((e) => e.id);

  const nodeModels = {};
  nodes.forEach((node) => {
    const legacyType = LEGACY_TYPES[node.type];
    if (!legacyType) return;
    const ports = [];
    if (node.type === NODE_TYPES.TASK || node.type === NODE_TYPES.DESIGN) {
      ports.push(
        stormPort(node, { name: IN_HANDLE, kind: IN_PORT }, linksOf(node.id, IN_HANDLE, "target"))
      );
    }
    if (node.type === NODE_TYPES.TASK || node.type === NODE_TYPES.ANCHOR) {
      ports.push(
        stormPort(
          node,
          {
            name: OUT_HANDLE,
            kind: OUT_PORT,
            extra: { maximumLinks: MAX_LINKS_PER_OUTPUT },
          },
          linksOf(node.id, OUT_HANDLE, "source")
        )
      );
    }
    if (node.type === NODE_TYPES.DESIGN) {
      (node.data?.conditions || []).forEach((condition) => {
        ports.push(
          stormPort(
            node,
            {
              name: condition.name,
              kind: OUT_PORT,
              label: condition.label,
              extra: {
                maximumLinks: MAX_LINKS_PER_OUTPUT,
                assignmentType: condition.assignmentType,
                probability: condition.probability,
                rule: condition.rule,
              },
            },
            linksOf(node.id, condition.name, "source")
          )
        );
      });
    }

    const model = {
      id: node.id,
      type: legacyType,
      selected: false,
      x: node.position?.x || 0,
      y: node.position?.y || 0,
      ports,
    };
    if (node.type === NODE_TYPES.TASK) {
      TASK_FIELDS.forEach((field) => {
        if (node.data?.[field] !== undefined) model[field] = node.data[field];
      });
    } else if (node.type === NODE_TYPES.DESIGN) {
      model.name = node.data?.name;
      model.details = node.data?.details;
    } else if (node.type === NODE_TYPES.COMMENT) {
      model.author = node.data?.author;
      model.time = node.data?.time;
      model.content = node.data?.content;
    }
    nodeModels[node.id] = model;
  });

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const linkModels = {};
  edges.forEach((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    linkModels[edge.id] = {
      id: edge.id,
      type: "advanced",
      selected: false,
      source: edge.source,
      sourcePort: portId(edge.source, edge.sourceHandle || OUT_HANDLE),
      target: edge.target,
      targetPort: portId(edge.target, IN_HANDLE),
      points: [
        { id: `${edge.id}:p0`, type: "point", x: source.position.x, y: source.position.y },
        { id: `${edge.id}:p1`, type: "point", x: target.position.x, y: target.position.y },
      ],
      labels: [],
      width: 4,
      color: "gray",
      curvyness: 70,
      selectedColor: "rgb(0,192,255)",
    };
  });

  const viewport = graph?.viewport || { x: 0, y: 0, zoom: 1 };
  return {
    id: "study-diagram",
    offsetX: viewport.x || 0,
    offsetY: viewport.y || 0,
    zoom: (viewport.zoom || 1) * 100,
    gridSize: 0,
    layers: [
      { id: "links-layer", type: LINK_LAYER, isSvg: true, transformed: true, models: linkModels },
      { id: "nodes-layer", type: NODE_LAYER, isSvg: false, transformed: true, models: nodeModels },
    ],
  };
}

module.exports = {
  parseDiagram,
  isStormDiagram,
  fromStormDiagram,
  toStormDiagram,
};
