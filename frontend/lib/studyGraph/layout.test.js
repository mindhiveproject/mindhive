// Run with: node --test lib/studyGraph/layout.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { layoutGraph } = require("./layout");

const W = 378;
const H = 128;
const node = (id, type = "task", data = {}, position = { x: 999, y: 999 }) => ({
  id,
  type,
  position,
  data,
});
const edge = (source, target, sourceHandle = "out") => ({
  id: `${source}-${target}`,
  source,
  sourceHandle,
  target,
  targetHandle: "in",
});
const centre = (p) => p.x + W / 2;

function overlaps(positions, ids) {
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const a = positions[ids[i]];
      const b = positions[ids[j]];
      if (a.x < b.x + W && b.x < a.x + W && a.y < b.y + H && b.y < a.y + H) {
        return [ids[i], ids[j]];
      }
    }
  }
  return null;
}

test("a sequence stacks in one column under the starting point, which stays put", () => {
  const graph = {
    nodes: [node("a", "anchor", {}, { x: 100, y: 50 }), node("t1"), node("t2")],
    edges: [edge("a", "t1"), edge("t1", "t2")],
  };
  const p = layoutGraph(graph);
  assert.deepEqual(p.a, { x: 100, y: 50 });
  assert.equal(p.t1.x, 100);
  assert.equal(p.t2.x, 100);
  assert.ok(p.a.y < p.t1.y && p.t1.y < p.t2.y);
  assert.equal(p.t1.y - p.a.y, H + 100);
});

test("branches sit side by side in condition order, the design block centred above", () => {
  const conditions = [{ name: "c1" }, { name: "c2" }, { name: "c3" }];
  const graph = {
    nodes: [
      node("a", "anchor", {}, { x: 0, y: 0 }),
      node("d", "design", { conditions }),
      node("x"), node("y"), node("z"), node("y2"),
    ],
    // links listed out of order on purpose
    edges: [edge("a", "d"), edge("d", "z", "c3"), edge("d", "x", "c1"), edge("d", "y", "c2"), edge("y", "y2")],
  };
  const p = layoutGraph(graph);
  assert.ok(p.x.x < p.y.x && p.y.x < p.z.x, "left to right follows the conditions");
  assert.equal(centre(p.d), centre(p.y));
  assert.equal(p.y2.x, p.y.x);
  assert.equal(overlaps(p, ["a", "d", "x", "y", "z", "y2"]), null);
});

test("a block reached from two branches sits below both", () => {
  const conditions = [{ name: "c1" }, { name: "c2" }];
  const graph = {
    nodes: [
      node("a", "anchor", {}, { x: 0, y: 0 }),
      node("d", "design", { conditions }),
      node("x"), node("x2"), node("y"), node("shared"),
    ],
    edges: [
      edge("a", "d"), edge("d", "x", "c1"), edge("x", "x2"), edge("x2", "shared"),
      edge("d", "y", "c2"), edge("y", "shared"),
    ],
  };
  const p = layoutGraph(graph);
  assert.ok(p.shared.y > p.x2.y && p.shared.y > p.y.y);
  assert.equal(overlaps(p, ["a", "d", "x", "x2", "y", "shared"]), null);
});

test("blocks not linked to the study go in a row below it, keeping their own chains", () => {
  const graph = {
    nodes: [
      node("a", "anchor", {}, { x: 0, y: 0 }),
      node("t1"),
      node("loose1", "task", {}, { x: 500, y: 0 }),
      node("loose2", "task", {}, { x: -500, y: 0 }),
      node("after2"),
    ],
    edges: [edge("a", "t1"), edge("loose2", "after2")],
  };
  const p = layoutGraph(graph);
  const lowestStudy = Math.max(p.a.y, p.t1.y);
  ["loose1", "loose2"].forEach((id) => assert.ok(p[id].y > lowestStudy));
  assert.ok(p.loose2.x < p.loose1.x, "ordered by where they were");
  assert.equal(p.after2.x, p.loose2.x);
  assert.ok(p.after2.y > p.loose2.y);
  assert.equal(overlaps(p, ["a", "t1", "loose1", "loose2", "after2"]), null);
});

test("notes move with the block they were closest to", () => {
  const graph = {
    nodes: [
      node("a", "anchor", {}, { x: 0, y: 0 }),
      node("t1", "task", {}, { x: 2000, y: 2000 }),
      node("note", "comment", {}, { x: 2400, y: 2000 }),
    ],
    edges: [edge("a", "t1")],
  };
  const p = layoutGraph(graph);
  assert.deepEqual(
    { x: p.note.x - p.t1.x, y: p.note.y - p.t1.y },
    { x: 400, y: 0 }
  );
});

test("measured sizes are used, and a study without a starting point stays in place", () => {
  const graph = {
    nodes: [node("t1", "task", {}, { x: 300, y: 300 }), node("t2", "task", {}, { x: 900, y: 300 })],
    edges: [edge("t1", "t2")],
  };
  const p = layoutGraph(graph, { sizes: { t1: { width: 378, height: 300 } } });
  assert.deepEqual(p.t1, { x: 300, y: 300 });
  assert.equal(p.t2.y - p.t1.y, 300 + 100);
});
