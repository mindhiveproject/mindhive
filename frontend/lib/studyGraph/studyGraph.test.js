// Run with: node --test lib/studyGraph/studyGraph.test.js
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildStudyFlow,
  checkConnection,
  fromStormDiagram,
  toStormDiagram,
  graphFromDiagram,
  serializeGraph,
} = require("./index");
const { legacyStudyFlow, normalizeFlow } = require("./legacyFlow");

// --- a Storm diagram written the way the Storm canvas writes it ----------

let uid = 0;
const nextId = (prefix) => `${prefix}-${(uid += 1)}`;

function stormFixture() {
  const nodes = {};
  const links = {};
  const portIds = {};

  const port = (nodeId, name, type, extra = {}) => {
    const id = nextId("port");
    portIds[`${nodeId}.${name}`] = id;
    return { id, type, x: 0, y: 0, name, alignment: "top", parentNode: nodeId, links: [], in: type === "inCustomPort", label: name, ...extra };
  };

  const api = {
    anchor(id) {
      nodes[id] = { id, type: "my-anchor", x: 0, y: 0, selected: false, ports: [port(id, "out", "outCustomPort", { maximumLinks: 2 })] };
      return api;
    },
    task(id, extra = {}) {
      nodes[id] = {
        id, type: "my-node", x: 10, y: 20, selected: false, locked: false,
        ports: [port(id, "in", "inCustomPort"), port(id, "out", "outCustomPort", { maximumLinks: 2 })],
        name: `Task ${id}`, details: "d", componentID: `c-${id}`, testId: `t-${id}`,
        taskType: "TASK", subtitle: "s", ...extra,
      };
      return api;
    },
    design(id, conditions) {
      nodes[id] = {
        id, type: "design", x: 0, y: 0, selected: false, name: "Between-subjects design", details: "dd",
        ports: [
          port(id, "in", "inCustomPort"),
          ...conditions.map((c) =>
            port(id, c, "outCustomPort", { label: `Label ${c}`, probability: 50, maximumLinks: 2 })
          ),
        ],
      };
      return api;
    },
    comment(id) {
      nodes[id] = { id, type: "my-comment", x: 5, y: 5, ports: [], author: "amy", time: 1, content: "hi" };
      return api;
    },
    link(from, fromPort, to) {
      const id = nextId("link");
      links[id] = {
        id, type: "advanced", source: from, sourcePort: portIds[`${from}.${fromPort}`],
        target: to, targetPort: portIds[`${to}.in`], points: [], labels: [],
      };
      return api;
    },
    build() {
      return JSON.stringify({
        id: "m", offsetX: 12, offsetY: -30, zoom: 80, gridSize: 0,
        layers: [
          { id: "l1", type: "diagram-links", isSvg: true, transformed: true, models: links },
          { id: "l2", type: "diagram-nodes", isSvg: false, transformed: true, models: nodes },
        ],
      });
    },
  };
  return api;
}

const sameAsLegacy = (diagram) =>
  assert.deepEqual(
    normalizeFlow(buildStudyFlow(fromStormDiagram(diagram))),
    normalizeFlow(legacyStudyFlow(diagram))
  );

// --- flow ------------------------------------------------------------------

test("a sequence of tasks gives the same flow as the Storm canvas", () => {
  const diagram = stormFixture()
    .anchor("a").task("t1").task("t2").comment("note")
    .link("a", "out", "t1").link("t1", "out", "t2")
    .build();
  sameAsLegacy(diagram);
  const flow = buildStudyFlow(fromStormDiagram(diagram));
  assert.deepEqual(flow.map((s) => [s.id, s.type, s.position]), [
    ["a", "my-anchor", 0],
    ["t1", "my-node", 1],
    ["t2", "my-node", 2],
  ]);
  assert.equal(flow[1].componentID, "c-t1");
  assert.equal(flow[1].testId, "t-t1");
});

test("a between-subjects design nests one flow per condition", () => {
  const diagram = stormFixture()
    .anchor("a").task("t1").design("d", ["c1", "c2"]).task("x").task("y").task("y2")
    .link("a", "out", "t1").link("t1", "out", "d")
    .link("d", "c1", "x").link("d", "c2", "y").link("y", "out", "y2")
    .build();
  sameAsLegacy(diagram);
  const [, , design] = buildStudyFlow(fromStormDiagram(diagram));
  assert.equal(design.type, "design");
  assert.deepEqual(design.conditions.map((c) => c.name), ["c1", "c2"]);
  assert.deepEqual(design.conditions[0].flow.map((s) => s.id), ["x"]);
  assert.deepEqual(design.conditions[1].flow.map((s) => s.id), ["y", "y2"]);
  assert.equal(design.conditions[1].label, "Label c2");
});

test("two links from one task (older designs) still run in link order", () => {
  const diagram = stormFixture()
    .anchor("a").task("t1").task("t2").task("t3")
    .link("a", "out", "t1").link("t1", "out", "t3").link("t1", "out", "t2")
    .build();
  sameAsLegacy(diagram);
  assert.deepEqual(
    buildStudyFlow(fromStormDiagram(diagram)).map((s) => s.id),
    ["a", "t1", "t3", "t2"]
  );
});

test("a block reached from two conditions appears under both", () => {
  const diagram = stormFixture()
    .anchor("a").design("d", ["c1", "c2"]).task("x")
    .link("a", "out", "d").link("d", "c1", "x").link("d", "c2", "x")
    .build();
  sameAsLegacy(diagram);
});

test("a block linked from the second condition goes under the second condition", () => {
  // The Storm canvas put it under the first condition when the first one had
  // no link: it matched blocks to conditions by counting links.
  const diagram = stormFixture()
    .anchor("a").design("d", ["c1", "c2"]).task("x")
    .link("a", "out", "d").link("d", "c2", "x")
    .build();
  const [, design] = buildStudyFlow(fromStormDiagram(diagram));
  assert.deepEqual(design.conditions[0].flow, []);
  assert.deepEqual(design.conditions[1].flow.map((s) => s.id), ["x"]);
  const [, legacyDesign] = legacyStudyFlow(diagram);
  assert.deepEqual(legacyDesign.conditions[0].flow.map((s) => s.id), ["x"]);
});

test("a study without a starting point has an empty flow", () => {
  const diagram = stormFixture().task("t1").build();
  assert.deepEqual(buildStudyFlow(fromStormDiagram(diagram)), []);
});

// --- conversion --------------------------------------------------------------

test("Storm diagram → graph keeps ids, data, handles and the viewport", () => {
  const graph = fromStormDiagram(
    stormFixture()
      .anchor("a").design("d", ["c1"]).task("x").comment("n")
      .link("a", "out", "d").link("d", "c1", "x")
      .build()
  );
  assert.deepEqual(graph.nodes.map((n) => [n.id, n.type]), [
    ["a", "anchor"], ["d", "design"], ["x", "task"], ["n", "comment"],
  ]);
  assert.deepEqual(graph.nodes[1].data.conditions, [
    { name: "c1", label: "Label c1", probability: 50, assignmentType: undefined, rule: undefined },
  ]);
  assert.deepEqual(graph.nodes[3].data, { author: "amy", time: 1, content: "hi" });
  assert.deepEqual(
    graph.edges.map((e) => [e.source, e.sourceHandle, e.target, e.targetHandle]),
    [["a", "out", "d", "in"], ["d", "c1", "x", "in"]]
  );
  assert.deepEqual(graph.viewport, { x: 12, y: -30, zoom: 0.8 });
});

test("graph → Storm diagram → graph is lossless, and the Storm canvas reads the same flow", () => {
  const original = fromStormDiagram(
    stormFixture()
      .anchor("a").task("t1", { createCopy: false, askDataUsageQuestion: true })
      .design("d", ["c1", "c2"]).task("x").task("y").comment("n")
      .link("a", "out", "t1").link("t1", "out", "d")
      .link("d", "c1", "x").link("d", "c2", "y")
      .build()
  );
  const storm = toStormDiagram(original);
  assert.deepEqual(fromStormDiagram(storm), original);
  assert.deepEqual(
    normalizeFlow(legacyStudyFlow(storm)),
    normalizeFlow(buildStudyFlow(original))
  );
});

test("links missing an end are dropped and backwards links are turned around", () => {
  const parsed = JSON.parse(
    stormFixture().anchor("a").task("t1").task("t2").link("a", "out", "t1").build()
  );
  const links = parsed.layers[0].models;
  const nodes = parsed.layers[1].models;
  links.loose = { id: "loose", sourcePort: nodes.t1.ports[1].id, targetPort: null };
  links.back = { id: "back", sourcePort: nodes.t2.ports[0].id, targetPort: nodes.t1.ports[1].id };
  const graph = fromStormDiagram(parsed);
  assert.deepEqual(graph.edges.map((e) => [e.id, e.source, e.target]).slice(1), [
    ["back", "t1", "t2"],
  ]);
});

test("serializeGraph gives the saved diagram string and flow; unknown formats load empty", () => {
  const graph = fromStormDiagram(
    stormFixture().anchor("a").task("t1").link("a", "out", "t1").build()
  );
  const { diagram, flow } = serializeGraph(graph);
  assert.equal(typeof diagram, "string");
  assert.deepEqual(graphFromDiagram(diagram), graph);
  assert.deepEqual(flow.map((s) => s.id), ["a", "t1"]);
  assert.deepEqual(graphFromDiagram("test").nodes, []);
  assert.deepEqual(graphFromDiagram(null).nodes, []);
});

// --- connection rules -------------------------------------------------------

test("connection rules", () => {
  const graph = fromStormDiagram(
    stormFixture()
      .anchor("a").task("t1").task("t2").design("d", ["c1", "c2"]).comment("n")
      .link("a", "out", "t1").link("t1", "out", "d")
      .build()
  );
  const check = (source, sourceHandle, target) =>
    checkConnection(graph, { source, sourceHandle, target, targetHandle: "in" });

  assert.deepEqual(check("d", "c1", "t2"), { ok: true });
  assert.deepEqual(check("t2", "out", "t2"), { ok: false, reason: "self" });
  assert.deepEqual(check("t1", "out", "t2"), { ok: false, reason: "limit" });
  assert.deepEqual(check("a", "out", "t2"), { ok: false, reason: "limit" });
  assert.deepEqual(check("t1", "out", "d"), { ok: false, reason: "duplicate" });
  assert.deepEqual(check("d", "c1", "t1"), { ok: false, reason: "cycle" });
  assert.deepEqual(check("d", "nope", "t2"), { ok: false, reason: "handle" });
  assert.deepEqual(check("t2", "out", "a"), { ok: false, reason: "handle" });
  assert.deepEqual(check("t2", "out", "n"), { ok: false, reason: "handle" });
  assert.deepEqual(check("n", "out", "t2"), { ok: false, reason: "handle" });
});

// --- shared document (collaborative editing) --------------------------------

const Y = require("yjs");
const { readGraph, writeGraph } = require("./yjs");
const { graphFingerprint } = require("./index");

const sampleGraph = () =>
  fromStormDiagram(
    stormFixture()
      .anchor("a").task("t1").design("d", ["c1", "c2"]).task("x").comment("n")
      .link("a", "out", "t1").link("t1", "out", "d").link("d", "c2", "x")
      .build()
  );
const withoutViewport = ({ viewport, ...rest }) => rest;

test("a graph written to a shared document reads back the same", () => {
  const doc = new Y.Doc();
  const graph = sampleGraph();
  doc.transact(() => writeGraph(doc, graph, Y));
  assert.deepEqual(
    JSON.parse(JSON.stringify(readGraph(doc))),
    JSON.parse(JSON.stringify(withoutViewport(graph)))
  );
});

test("only the fields that changed are written", () => {
  const doc = new Y.Doc();
  const graph = sampleGraph();
  doc.transact(() => writeGraph(doc, graph, Y));
  let updates = 0;
  doc.on("update", () => { updates += 1; });
  doc.transact(() => writeGraph(doc, graph, Y));
  assert.equal(updates, 0);
  const moved = {
    ...graph,
    nodes: graph.nodes.map((n) => (n.id === "x" ? { ...n, position: { x: 99, y: 1 } } : n)),
    edges: graph.edges.filter((e) => e.source !== "d"),
  };
  doc.transact(() => writeGraph(doc, moved, Y));
  const read = readGraph(doc);
  assert.deepEqual(read.nodes.find((n) => n.id === "x").position, { x: 99, y: 1 });
  assert.equal(read.edges.length, 2);
});

test("two people editing different fields of one block both keep their change", () => {
  const a = new Y.Doc();
  const b = new Y.Doc();
  a.transact(() => writeGraph(a, sampleGraph(), Y));
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a));
  const edit = (doc, change) => {
    const g = readGraph(doc);
    doc.transact(() =>
      writeGraph(doc, { ...g, nodes: g.nodes.map((n) => (n.id === "t1" ? change(n) : n)) }, Y)
    );
  };
  edit(a, (n) => ({ ...n, position: { x: 500, y: 500 } }));
  edit(b, (n) => ({ ...n, data: { ...n.data, subtitle: "renamed" } }));
  Y.applyUpdate(a, Y.encodeStateAsUpdate(b));
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a));
  const t1 = readGraph(a).nodes.find((n) => n.id === "t1");
  assert.deepEqual(t1.position, { x: 500, y: 500 });
  assert.equal(t1.data.subtitle, "renamed");
  assert.deepEqual(readGraph(a), readGraph(b));
});

test("the fingerprint of a saved design matches the shared document it came from", () => {
  const doc = new Y.Doc();
  doc.transact(() => writeGraph(doc, sampleGraph(), Y));
  const fromDoc = { ...readGraph(doc), viewport: { x: 5, y: 5, zoom: 2 } };
  const { diagram } = serializeGraph(fromDoc);
  assert.equal(graphFingerprint(graphFromDiagram(diagram)), graphFingerprint(fromDoc));
  const moved = { ...fromDoc, nodes: fromDoc.nodes.map((n) => ({ ...n, position: { x: 1, y: 2 } })) };
  assert.notEqual(graphFingerprint(moved), graphFingerprint(fromDoc));
});
