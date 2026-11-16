// The study flow algorithm of the Storm canvas (Builder/Engine.js
// findNodes/createStudyFlow), run on a saved Storm diagram without the Storm
// library. Used only to check the new builder against what was saved before:
// see studyGraph.test.js and scripts/check-study-flows.js.
//
// It rebuilds the objects Storm creates on load: ports keyed by name (the
// constructor's in/out ports first), and each port's links in the order of
// the links layer.

const KEPT_FIELDS = {
  "my-node": [
    "name",
    "details",
    "componentID",
    "testId",
    "taskType",
    "subtitle",
    "createCopy",
    "askDataUsageQuestion",
  ],
  design: ["name", "details"],
  "my-comment": ["author", "time", "content"],
};

function loadStormObjects(parsed) {
  const layers = parsed?.layers || [];
  const nodeModels = Object.values(
    layers.find((l) => l?.type === "diagram-nodes")?.models || {}
  );
  const linkModels = Object.values(
    layers.find((l) => l?.type === "diagram-links")?.models || {}
  );
  const portsById = new Map();
  const nodes = nodeModels.map((model) => {
    const portModels = model.ports || [];
    // Storm's deserialize keeps only these fields on the model's options
    const kept = ["id", "type", "locked", "extras", "selected"].concat(
      KEPT_FIELDS[model.type] || []
    );
    const options = {};
    kept.forEach((field) => {
      options[field] = model[field];
    });
    const node = { options, ports: {} };
    // constructor ports come first, deserialized ones replace them in place
    if (["my-node", "design"].includes(model.type)) node.ports.in = null;
    if (["my-node", "my-anchor"].includes(model.type)) node.ports.out = null;
    portModels.forEach((portModel) => {
      const port = {
        options: { ...portModel },
        links: {},
        parent: node,
      };
      node.ports[portModel.name] = port;
      portsById.set(portModel.id, port);
    });
    Object.keys(node.ports).forEach((name) => {
      if (!node.ports[name]) delete node.ports[name];
    });
    return node;
  });
  linkModels.forEach((model) => {
    const link = {
      sourcePort: portsById.get(model.sourcePort) || null,
      targetPort: portsById.get(model.targetPort) || null,
    };
    if (link.sourcePort) link.sourcePort.links[model.id] = link;
    if (link.targetPort) link.targetPort.links[model.id] = link;
  });
  return nodes;
}

function legacyStudyFlow(diagram) {
  const parsed = typeof diagram === "string" ? JSON.parse(diagram) : diagram;
  const allNodes = loadStormObjects(parsed);

  // --- copied from Engine.js ---
  const findChildrenNodes = ({ node }) => {
    let children = [];
    if (node?.options?.type === "design") {
      const ports = Object.values(node?.ports).filter(
        (port) => port?.options?.type === "outCustomPort"
      );
      if (ports.length) {
        children = ports
          .map((port) =>
            Object.values(port?.links).map((link) => link?.targetPort?.parent)
          )
          .flat();
      }
    } else if (
      node?.ports?.out?.links &&
      Object.values(node?.ports?.out?.links).length
    ) {
      children = Object.values(node?.ports?.out?.links).map(
        (link) => link?.targetPort?.parent
      );
    }
    return children;
  };

  const findNodes = ({ currentNode, flow, position, path }) => {
    if (!currentNode) return;
    const nodeId = currentNode?.options?.id;
    if (nodeId && path?.has(nodeId)) return;
    const nextPath = new Set(path);
    if (nodeId) nextPath.add(nodeId);
    let currentFlow;
    if (currentNode?.options?.type === "design") {
      const ports = Object.values(currentNode?.ports).filter(
        (port) => port?.options?.type === "outCustomPort"
      );
      flow.push({
        ...currentNode?.options,
        position,
        conditions: ports.map((port) => ({
          name: port?.options?.name,
          label: port?.options?.label,
          assignmentType: port?.options?.assignmentType,
          probability: port?.options?.probability,
          rule: port?.options?.rule,
          flow: [],
        })),
      });
      const children = findChildrenNodes({ node: currentNode }) || [];
      children.forEach((child, num) => {
        currentFlow = flow[flow.length - 1].conditions[num]?.flow;
        if (!currentFlow) return; // the old code threw here
        findNodes({ currentNode: child, flow: currentFlow, position: position + 1, path: nextPath });
      });
    } else {
      flow.push({ ...currentNode?.options, position });
      currentFlow = flow;
      const children = findChildrenNodes({ node: currentNode }) || [];
      children.forEach((child) => {
        findNodes({ currentNode: child, flow: currentFlow, position: position + 1, path: nextPath });
      });
    }
  };
  // --- end of copy ---

  const startingNode = allNodes.filter((n) => n?.options?.type === "my-anchor")[0];
  const flow = [];
  findNodes({ currentNode: startingNode, flow, position: 0, path: new Set() });
  return flow;
}

// Fields Storm keeps on every model that mean nothing to the study runtime
const UI_ONLY_FIELDS = new Set(["selected", "locked", "extras", "color"]);

/** Flow without UI-only fields and undefined values, for comparisons. */
function normalizeFlow(flow) {
  const clean = (value) => {
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === "object") {
      const out = {};
      Object.keys(value)
        .filter((k) => !UI_ONLY_FIELDS.has(k) && value[k] !== undefined)
        .sort()
        .forEach((k) => {
          out[k] = clean(value[k]);
        });
      return out;
    }
    return value;
  };
  return clean(flow || []);
}

module.exports = { legacyStudyFlow, normalizeFlow };
