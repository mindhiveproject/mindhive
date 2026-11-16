import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";

import { NODE_TYPES } from "../../../../../lib/studyGraph";
import { readGraph, writeGraph, NODES, EDGES } from "../../../../../lib/studyGraph/yjs";

const HISTORY_LIMIT = 50;

// Origins of changes made to the shared document by this browser: block
// structure (an undo step), everything else (moves, task edits, comments),
// and loading the saved design into an empty document.
export const STRUCTURE_ORIGIN = "study-builder:structure";
export const EDIT_ORIGIN = "study-builder:edit";
export const SEED_ORIGIN = "study-builder:seed";

const emptyGraph = () => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
});

/**
 * The study design graph and every edit made to it. All edits go through
 * these operations, which compute the next graph from the current one.
 *
 * Without `doc` the graph lives in React state. With `doc` (a Yjs document
 * shared through the collaboration server) each edit is written to the
 * document, the graph is read back from it, and edits from other people
 * arrive the same way.
 *
 * Structural edits (adding, removing or linking blocks, replacing the design)
 * are undo steps; with a shared document each person undoes only their own.
 * Moving a block or typing in a comment is saved but is not an undo step.
 * `onChange` is called after every change that should be saved, including
 * changes made by others (so the saved study keeps up with the document).
 */
export default function useStudyGraph(
  initialGraph,
  { onChange, doc = null, readOnly = false } = {}
) {
  const [graph, setGraphState] = useState(() =>
    doc
      ? { ...readGraph(doc), viewport: initialGraph?.viewport || emptyGraph().viewport }
      : initialGraph || emptyGraph()
  );
  const graphRef = useRef(graph);
  const historyRef = useRef([]);
  const undoManagerRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;

  // shared document: follow every change to it, ours and others'
  useEffect(() => {
    if (!doc) return undefined;
    const ynodes = doc.getMap(NODES);
    const yedges = doc.getMap(EDGES);
    const onDocChange = (events, transaction) => {
      const next = { ...readGraph(doc), viewport: graphRef.current.viewport };
      graphRef.current = next;
      setGraphState(next);
      if (transaction.origin !== SEED_ORIGIN) onChangeRef.current?.();
    };
    ynodes.observeDeep(onDocChange);
    yedges.observeDeep(onDocChange);

    const undoManager = new Y.UndoManager([ynodes, yedges], {
      trackedOrigins: new Set([STRUCTURE_ORIGIN]),
      captureTimeout: 300,
    });
    const syncCanUndo = () => setCanUndo(undoManager.undoStack.length > 0);
    undoManager.on("stack-item-added", syncCanUndo);
    undoManager.on("stack-item-popped", syncCanUndo);
    undoManager.on("stack-cleared", syncCanUndo);
    undoManagerRef.current = undoManager;

    // the document may have changed between the first render and now
    onDocChange([], { origin: SEED_ORIGIN });
    return () => {
      ynodes.unobserveDeep(onDocChange);
      yedges.unobserveDeep(onDocChange);
      undoManager.destroy();
      undoManagerRef.current = null;
    };
  }, [doc]);

  const commit = useCallback(
    (update, { undoable = false } = {}) => {
      if (readOnlyRef.current) return graphRef.current;
      const previous = graphRef.current;
      const next = typeof update === "function" ? update(previous) : update;
      if (!next || next === previous) return previous;
      if (doc) {
        // the observer above updates the graph and calls onChange
        doc.transact(
          () => writeGraph(doc, next, Y),
          undoable ? STRUCTURE_ORIGIN : EDIT_ORIGIN
        );
        return graphRef.current;
      }
      if (undoable) {
        historyRef.current = [...historyRef.current, previous].slice(-HISTORY_LIMIT);
        setCanUndo(true);
      }
      graphRef.current = next;
      setGraphState(next);
      onChangeRef.current?.();
      return next;
    },
    [doc]
  );

  const getNode = useCallback(
    (id) => graphRef.current.nodes.find((n) => n.id === id) || null,
    []
  );

  const addNode = useCallback(
    (node) =>
      commit((g) => ({ ...g, nodes: [...g.nodes, node] }), { undoable: true }),
    [commit]
  );

  /** Merges `patch` (or patch(data)) into the data of one block. */
  const updateNodeData = useCallback(
    (id, patch, { undoable = false } = {}) =>
      commit(
        (g) => {
          if (!g.nodes.some((n) => n.id === id)) return g;
          return {
            ...g,
            nodes: g.nodes.map((n) =>
              n.id === id
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      ...(typeof patch === "function" ? patch(n.data) : patch),
                    },
                  }
                : n
            ),
          };
        },
        { undoable }
      ),
    [commit]
  );

  /** Merges `patch` into the data of every block `match(node)` accepts. */
  const updateNodesWhere = useCallback(
    (match, patch) =>
      commit((g) => {
        if (!g.nodes.some(match)) return g;
        return {
          ...g,
          nodes: g.nodes.map((n) =>
            match(n) ? { ...n, data: { ...n.data, ...patch } } : n
          ),
        };
      }),
    [commit]
  );

  /**
   * positions: { [nodeId]: { x, y } }. Moving blocks by hand is not an undo
   * step; rearranging the whole design ("Tidy up") is (`undoable`).
   */
  const moveNodes = useCallback(
    (positions, { undoable = false } = {}) =>
      commit(
        (g) => ({
          ...g,
          nodes: g.nodes.map((n) =>
            positions[n.id] ? { ...n, position: positions[n.id] } : n
          ),
        }),
        { undoable }
      ),
    [commit]
  );

  /** Removes blocks (with their links) and links. The starting point stays. */
  const removeElements = useCallback(
    ({ nodeIds = [], edgeIds = [] }) =>
      commit(
        (g) => {
          const removeNodes = new Set(
            nodeIds.filter(
              (id) => g.nodes.find((n) => n.id === id)?.type !== NODE_TYPES.ANCHOR
            )
          );
          const removeEdges = new Set(edgeIds);
          if (!removeNodes.size && !removeEdges.size) return g;
          return {
            ...g,
            nodes: g.nodes.filter((n) => !removeNodes.has(n.id)),
            edges: g.edges.filter(
              (e) =>
                !removeEdges.has(e.id) &&
                !removeNodes.has(e.source) &&
                !removeNodes.has(e.target)
            ),
          };
        },
        { undoable: true }
      ),
    [commit]
  );

  const addEdge = useCallback(
    (edge) =>
      commit((g) => ({ ...g, edges: [...g.edges, edge] }), { undoable: true }),
    [commit]
  );

  /** Replaces a design block's conditions; links of removed ones go too. */
  const setDesignConditions = useCallback(
    (id, conditions) =>
      commit(
        (g) => {
          const names = new Set(conditions.map((c) => c.name));
          return {
            ...g,
            nodes: g.nodes.map((n) =>
              n.id === id ? { ...n, data: { ...n.data, conditions } } : n
            ),
            edges: g.edges.filter(
              (e) => e.source !== id || names.has(e.sourceHandle)
            ),
          };
        },
        { undoable: true }
      ),
    [commit]
  );

  /** Puts a whole design (template, version) on the canvas. */
  const replaceGraph = useCallback(
    (next) => commit(next, { undoable: true }),
    [commit]
  );

  /** Pan and zoom are each person's own and are not a change to save. */
  const setViewport = useCallback((viewport) => {
    graphRef.current = { ...graphRef.current, viewport };
  }, []);

  const undo = useCallback(() => {
    if (readOnlyRef.current) return;
    if (doc) {
      undoManagerRef.current?.undo();
      return;
    }
    const history = historyRef.current;
    if (!history.length) return;
    const previous = history[history.length - 1];
    historyRef.current = history.slice(0, -1);
    setCanUndo(historyRef.current.length > 0);
    commit({ ...previous, viewport: graphRef.current.viewport });
  }, [commit, doc]);

  const clearHistory = useCallback(() => {
    if (doc) {
      undoManagerRef.current?.clear();
      return;
    }
    historyRef.current = [];
    setCanUndo(false);
  }, [doc]);

  return {
    graph,
    graphRef,
    isShared: !!doc,
    getNode,
    addNode,
    updateNodeData,
    updateNodesWhere,
    moveNodes,
    removeElements,
    addEdge,
    setDesignConditions,
    replaceGraph,
    setViewport,
    undo,
    canUndo,
    clearHistory,
  };
}
