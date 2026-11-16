const constants = require("./constants");
const rules = require("./rules");
const { buildStudyFlow } = require("./flow");
const { layoutGraph } = require("./layout");
const storm = require("./storm");

/** Saved study.diagram (any supported format) → graph, or an empty graph. */
function graphFromDiagram(diagram) {
  if (storm.isStormDiagram(diagram)) return storm.fromStormDiagram(diagram);
  return { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
}

/** Graph → the two strings saved on a study: diagram and flow. */
function serializeGraph(graph) {
  return {
    diagram: JSON.stringify(storm.toStormDiagram(graph)),
    flow: buildStudyFlow(graph),
  };
}

// JSON with object keys sorted, so equal graphs give equal strings
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .filter((k) => value[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

// cyrb53, a small fast string hash
function hash(text) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * Short id of a design's content (blocks, their places and data, links),
 * ignoring the viewport and the order blocks are listed in. Used to tell
 * whether the saved study.diagram is the design in the shared document.
 */
function graphFingerprint(graph) {
  const nodes = [...(graph?.nodes || [])]
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((n) => ({ id: n.id, type: n.type, x: n.position?.x || 0, y: n.position?.y || 0, data: n.data || {} }));
  const edges = [...(graph?.edges || [])]
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((e) => ({ id: e.id, source: e.source, sourceHandle: e.sourceHandle, target: e.target }));
  return hash(canonical({ nodes, edges }));
}

module.exports = {
  graphFingerprint,
  ...constants,
  ...rules,
  ...storm,
  buildStudyFlow,
  layoutGraph,
  graphFromDiagram,
  serializeGraph,
};
