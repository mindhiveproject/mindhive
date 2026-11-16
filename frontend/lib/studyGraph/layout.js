// "Tidy up": arranges a study design as a tree, top to bottom from the
// starting point. The branches of a between-subjects block sit side by side in
// the order of its condition outputs (left to right), so links never cross.
//
//   layoutGraph(graph, { sizes }) → { [nodeId]: { x, y } }
//
// - A block's row is its longest path from the starting point, so a block
//   reached along two branches sits below both. Horizontally it belongs to
//   the first branch that reaches it.
// - Blocks not connected to the starting point are laid out the same way
//   (each loose chain as its own tree) in a row below the study.
// - Notes keep their offset from the block they were closest to.
// - The starting point stays where it is; everything moves around it.

const { NODE_TYPES, OUT_HANDLE } = require("./constants");

const DEFAULT_SIZE = { width: 378, height: 128 };
const DEFAULT_COMMENT_SIZE = { width: 280, height: 140 };
const GAP_X = 60;
const GAP_Y = 100;
const GAP_LOOSE = 160;

function layoutGraph(graph, { sizes = {}, gapX = GAP_X, gapY = GAP_Y } = {}) {
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const sizeOf = (node) =>
    sizes[node.id] ||
    (node.type === NODE_TYPES.COMMENT ? DEFAULT_COMMENT_SIZE : DEFAULT_SIZE);

  // children in output order: "out", or one output per condition in order
  const childrenOf = (node) => {
    const handles =
      node.type === NODE_TYPES.DESIGN
        ? (node.data?.conditions || []).map((c) => c?.name)
        : [OUT_HANDLE];
    const result = [];
    handles.forEach((handle) => {
      edges
        .filter(
          (e) =>
            e.source === node.id &&
            (e.sourceHandle || OUT_HANDLE) === handle &&
            byId.has(e.target)
        )
        .forEach((e) => {
          const child = byId.get(e.target);
          if (child.type !== NODE_TYPES.COMMENT && !result.includes(child)) {
            result.push(child);
          }
        });
    });
    return result;
  };

  const blocks = nodes.filter((n) => n.type !== NODE_TYPES.COMMENT);
  const placed = new Map(); // id → { x, y } (top-left)
  const assigned = new Set(); // ids that belong to a tree already

  // Lays out the tree under `root` with its top-left corner at (left, top).
  // Returns the bottom edge of the tree.
  const layoutTree = (root, left, top) => {
    // rows: longest path from the root (guarded against loops)
    const rank = new Map([[root.id, 0]]);
    const visit = (node, path) => {
      if (path.has(node.id)) return;
      const nextPath = new Set(path).add(node.id);
      childrenOf(node).forEach((child) => {
        if (assigned.has(child.id)) return;
        const r = rank.get(node.id) + 1;
        if (!rank.has(child.id) || rank.get(child.id) < r) {
          rank.set(child.id, r);
          visit(child, nextPath);
        }
      });
    };
    visit(root, new Set());

    // each block hangs (horizontally) under the first parent reaching it
    const treeChildren = new Map();
    const inTree = new Set([root.id]);
    const queue = [root];
    while (queue.length) {
      const node = queue.shift();
      const kids = [];
      childrenOf(node).forEach((child) => {
        if (inTree.has(child.id) || assigned.has(child.id) || !rank.has(child.id)) return;
        inTree.add(child.id);
        kids.push(child);
        queue.push(child);
      });
      treeChildren.set(node.id, kids);
    }

    // widths of subtrees
    const width = new Map();
    const measure = (node) => {
      const kids = treeChildren.get(node.id) || [];
      const kidsWidth =
        kids.reduce((sum, kid) => sum + measure(kid), 0) +
        Math.max(kids.length - 1, 0) * gapX;
      const w = Math.max(sizeOf(node).width, kidsWidth);
      width.set(node.id, w);
      return w;
    };
    measure(root);

    // row tops: each row is as tall as its tallest block
    const rowHeight = [];
    inTree.forEach((id) => {
      const r = rank.get(id);
      rowHeight[r] = Math.max(rowHeight[r] || 0, sizeOf(byId.get(id)).height);
    });
    const rowTop = [];
    let y = top;
    for (let r = 0; r < rowHeight.length; r += 1) {
      rowTop[r] = y;
      y += (rowHeight[r] || 0) + gapY;
    }

    // x: children side by side, the parent centred over them
    const place = (node, subtreeLeft) => {
      const kids = treeChildren.get(node.id) || [];
      const nodeWidth = sizeOf(node).width;
      let centre;
      if (kids.length) {
        const kidsWidth =
          kids.reduce((sum, kid) => sum + width.get(kid.id), 0) +
          (kids.length - 1) * gapX;
        let kidLeft = subtreeLeft + (width.get(node.id) - kidsWidth) / 2;
        const centres = kids.map((kid) => {
          const c = place(kid, kidLeft);
          kidLeft += width.get(kid.id) + gapX;
          return c;
        });
        centre = (centres[0] + centres[centres.length - 1]) / 2;
      } else {
        centre = subtreeLeft + width.get(node.id) / 2;
      }
      placed.set(node.id, { x: centre - nodeWidth / 2, y: rowTop[rank.get(node.id)] });
      return centre;
    };
    place(root, left);
    inTree.forEach((id) => assigned.add(id));
    return { bottom: y - gapY, right: left + width.get(root.id) };
  };

  // the study, from its starting point
  const anchor = blocks.find((n) => n.type === NODE_TYPES.ANCHOR);
  let bottom = 0;
  let left = 0;
  if (anchor) {
    ({ bottom } = layoutTree(anchor, 0, 0));
  }

  // loose chains, left to right in a row below the study; each starts at a
  // block no other loose block links into
  const byPlace = (a, b) => a.position.x - b.position.x || a.position.y - b.position.y;
  const isLooseRoot = (node) =>
    !edges.some(
      (e) =>
        e.target === node.id &&
        byId.has(e.source) &&
        !assigned.has(e.source) &&
        byId.get(e.source).type !== NODE_TYPES.COMMENT
    );
  const rowTop = anchor ? bottom + GAP_LOOSE : 0;
  for (;;) {
    const remaining = blocks.filter((n) => !assigned.has(n.id)).sort(byPlace);
    if (!remaining.length) break;
    const root = remaining.find(isLooseRoot) || remaining[0];
    left = layoutTree(root, left, rowTop).right + gapX;
  }

  // the starting point stays where it was (without one, the top-left corner
  // of the blocks does)
  let shift = null;
  if (anchor && placed.has(anchor.id)) {
    const at = placed.get(anchor.id);
    shift = { x: anchor.position.x - at.x, y: anchor.position.y - at.y };
  } else if (blocks.length) {
    const minOf = (list, key) => Math.min(...list.map((p) => p[key]));
    const before = blocks.map((n) => n.position);
    const after = Array.from(placed.values());
    shift = {
      x: minOf(before, "x") - minOf(after, "x"),
      y: minOf(before, "y") - minOf(after, "y"),
    };
  }
  if (shift) {
    placed.forEach((p, id) => placed.set(id, { x: p.x + shift.x, y: p.y + shift.y }));
  }

  // notes follow the block they were closest to
  const centreOf = (node, position = node.position) => ({
    x: position.x + sizeOf(node).width / 2,
    y: position.y + sizeOf(node).height / 2,
  });
  nodes
    .filter((n) => n.type === NODE_TYPES.COMMENT)
    .forEach((note) => {
      const c = centreOf(note);
      let nearest = null;
      let best = Infinity;
      blocks.forEach((block) => {
        const b = centreOf(block);
        const d = (b.x - c.x) ** 2 + (b.y - c.y) ** 2;
        if (d < best) {
          best = d;
          nearest = block;
        }
      });
      if (!nearest || !placed.has(nearest.id)) return;
      const moved = placed.get(nearest.id);
      placed.set(note.id, {
        x: note.position.x + (moved.x - nearest.position.x),
        y: note.position.y + (moved.y - nearest.position.y),
      });
    });

  const result = {};
  placed.forEach((p, id) => {
    result[id] = { x: Math.round(p.x), y: Math.round(p.y) };
  });
  return result;
}

module.exports = { layoutGraph };
