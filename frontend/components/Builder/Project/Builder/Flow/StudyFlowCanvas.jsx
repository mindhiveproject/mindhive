import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  NODE_TYPES,
  OUT_HANDLE,
  checkConnection,
} from "../../../../../lib/studyGraph";
import { getTaskTypeColor } from "../../../../../lib/taskTypeColors";
import { nodeTypes } from "./nodes";
import { edgeTypes, EdgeUiProvider, conditionText } from "./StudyEdge";
import { RemoteCursors } from "./Collaborators";
import { StyledFlowCanvas } from "./styles";

// Payload the side panel's draggable cards put on the drag (NodeTypeLabel)
export const DRAG_DATA_TYPE = "application/x-mindhive-study-block";

// The minimap appears once a study has this many task and design blocks
const MINIMAP_MIN_BLOCKS = 5;

// A link keeps its remove button this long after the pointer leaves it, so
// the pointer can reach the button
const EDGE_HOVER_GRACE_MS = 200;

const minimapColor = (node) => {
  if (node.type === NODE_TYPES.COMMENT) return "#fff59d";
  if (node.type === NODE_TYPES.ANCHOR) return "#9a9a9a";
  if (node.type === NODE_TYPES.DESIGN) return getTaskTypeColor("DESIGN");
  return getTaskTypeColor(node.data?.taskType);
};

const EDGE_MARKER = {
  type: MarkerType.ArrowClosed,
  color: "#9a9a9a",
  width: 18,
  height: 18,
};

// React Flow keeps its own copy of the nodes (with their measured size,
// selection and in-progress drag); the graph stays the source of truth and
// that copy is rebuilt from it whenever it changes.
function toFlowNodes(graph, previous, isLocked, nodePresence = {}) {
  const usedHandles = new Map();
  graph.edges.forEach((edge) => {
    const list = usedHandles.get(edge.source) || [];
    list.push(edge.sourceHandle || OUT_HANDLE);
    usedHandles.set(edge.source, list);
  });
  const previousById = new Map(previous.map((n) => [n.id, n]));
  return graph.nodes.map((node) => {
    const prev = previousById.get(node.id);
    return {
      ...prev,
      id: node.id,
      type: node.type,
      // a block being dragged keeps following the pointer
      position: prev?.dragging ? prev.position : node.position,
      data: { ...node.data, usedHandles: usedHandles.get(node.id) || [] },
      deletable: !isLocked && node.type !== NODE_TYPES.ANCHOR,
      draggable: !isLocked,
      ...(node.type === NODE_TYPES.COMMENT
        ? { dragHandle: ".comment-header-container" }
        : {}),
      ...presenceStyle(nodePresence[node.id]),
    };
  });
}

// Outline and name tag on a block someone else selected or has open
function presenceStyle(presence) {
  if (!presence) return { className: undefined, style: undefined };
  const label = presence.editing ? `${presence.name} · editing` : presence.name;
  return {
    className: "remotePresence",
    style: {
      "--presence-color": presence.color,
      "--presence-name": JSON.stringify(label),
    },
  };
}

// Block moves are shared while dragging at most this often
const LIVE_DRAG_INTERVAL_MS = 80;

function toFlowEdges(graph, previous, isLocked) {
  const previousById = new Map(previous.map((e) => [e.id, e]));
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  return graph.edges.map((edge) => ({
    id: edge.id,
    type: "study",
    source: edge.source,
    sourceHandle: edge.sourceHandle || OUT_HANDLE,
    target: edge.target,
    targetHandle: edge.targetHandle,
    markerEnd: EDGE_MARKER,
    selected: !!previousById.get(edge.id)?.selected,
    deletable: !isLocked,
    data: {
      condition: conditionText(
        nodeById.get(edge.source),
        edge.sourceHandle || OUT_HANDLE
      ),
    },
  }));
}

/**
 * The study design canvas. Every edit goes to `store` (useStudyGraph);
 * blocks dropped from the side panel go to `onDropPayload(payload, position)`.
 */
export default function StudyFlowCanvas({
  store,
  isLocked,
  onDropPayload,
  onCyclePrevented,
  onReady,
  // collaborative editing (all optional)
  others = [],
  nodePresence,
  onCursorMove,
  onSelectionIdsChange,
}) {
  const reactFlow = useReactFlow();
  const { graph } = store;
  const [nodes, setNodes] = useState(() =>
    toFlowNodes(graph, [], isLocked, nodePresence)
  );
  const [edges, setEdges] = useState(() => toFlowEdges(graph, [], isLocked));

  useEffect(() => {
    setNodes((previous) => toFlowNodes(graph, previous, isLocked, nodePresence));
  }, [graph, isLocked, nodePresence]);

  useEffect(() => {
    setEdges((previous) => toFlowEdges(graph, previous, isLocked));
  }, [graph, isLocked]);

  // The link under the pointer (it shows its remove button)
  const [hoveredEdgeId, setHoveredEdgeId] = useState(null);
  const unhoverTimerRef = useRef(null);
  const hoverEdge = useCallback((id) => {
    clearTimeout(unhoverTimerRef.current);
    setHoveredEdgeId(id);
  }, []);
  const unhoverEdge = useCallback((id) => {
    clearTimeout(unhoverTimerRef.current);
    unhoverTimerRef.current = setTimeout(
      () => setHoveredEdgeId((current) => (current === id ? null : current)),
      EDGE_HOVER_GRACE_MS
    );
  }, []);
  useEffect(() => () => clearTimeout(unhoverTimerRef.current), []);
  const edgeUi = useMemo(
    () => ({
      isLocked,
      hoveredEdgeId,
      hoverEdge,
      unhoverEdge,
      removeEdge: (id) => {
        setHoveredEdgeId(null);
        store.removeElements({ edgeIds: [id] });
      },
    }),
    [isLocked, hoveredEdgeId, hoverEdge, unhoverEdge, store]
  );

  const blockCount = graph.nodes.filter(
    (n) => n.type === NODE_TYPES.TASK || n.type === NODE_TYPES.DESIGN
  ).length;

  // In a shared design others see a block move while it is dragged
  const lastLiveDragRef = useRef(0);
  const onNodeDrag = useCallback(
    (event, node, dragged) => {
      if (!store.isShared) return;
      const now = Date.now();
      if (now - lastLiveDragRef.current < LIVE_DRAG_INTERVAL_MS) return;
      lastLiveDragRef.current = now;
      const positions = {};
      (dragged?.length ? dragged : [node]).forEach((n) => {
        positions[n.id] = { x: n.position.x, y: n.position.y };
      });
      store.moveNodes(positions);
    },
    [store]
  );

  const onMouseMove = useCallback(
    (event) => {
      if (!onCursorMove) return;
      onCursorMove(
        reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY })
      );
    },
    [onCursorMove, reactFlow]
  );

  // removals go through the graph (onDelete), everything else (selection,
  // measured size, drag in progress) stays local to the canvas
  const onNodesChange = useCallback(
    (changes) =>
      setNodes((current) =>
        applyNodeChanges(
          changes.filter((c) => c.type !== "remove"),
          current
        )
      ),
    []
  );
  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((current) =>
        applyEdgeChanges(
          changes.filter((c) => c.type !== "remove"),
          current
        )
      ),
    []
  );

  const onNodeDragStop = useCallback(
    (event, node, dragged) => {
      const positions = {};
      (dragged?.length ? dragged : [node]).forEach((n) => {
        positions[n.id] = { x: n.position.x, y: n.position.y };
      });
      store.moveNodes(positions);
    },
    [store]
  );

  const onDelete = useCallback(
    ({ nodes: removedNodes, edges: removedEdges }) =>
      store.removeElements({
        nodeIds: removedNodes.map((n) => n.id),
        edgeIds: removedEdges.map((e) => e.id),
      }),
    [store]
  );

  // A link that would close a loop is let through to onConnect so the user
  // can be told why it was refused; every other refusal is silent.
  const isValidConnection = useCallback(
    (connection) => {
      const result = checkConnection(store.graphRef.current, connection);
      return result.ok || result.reason === "cycle";
    },
    [store]
  );

  const onConnect = useCallback(
    (connection) => {
      const result = checkConnection(store.graphRef.current, connection);
      if (result.reason === "cycle") {
        onCyclePrevented?.();
        return;
      }
      if (!result.ok) return;
      store.addEdge({
        id: newId(),
        source: connection.source,
        sourceHandle: connection.sourceHandle || OUT_HANDLE,
        target: connection.target,
        targetHandle: connection.targetHandle,
      });
    },
    [store, onCyclePrevented]
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (isLocked) return;
      const raw = event.dataTransfer.getData(DRAG_DATA_TYPE);
      if (!raw) return;
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch (e) {
        return;
      }
      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      onDropPayload?.(payload, position);
    },
    [isLocked, reactFlow, onDropPayload]
  );

  return (
    <StyledFlowCanvas
      id="canvas"
      onMouseMove={onMouseMove}
      onMouseLeave={() => onCursorMove?.(null)}
    >
      <EdgeUiProvider value={edgeUi}>
      <ReactFlow
        // React Flow is MIT licensed; the attribution badge is optional
        proOptions={{ hideAttribution: true }}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onEdgeMouseEnter={(event, edge) => hoverEdge(edge.id)}
        onEdgeMouseLeave={(event, edge) => unhoverEdge(edge.id)}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={({ nodes: selected }) =>
          onSelectionIdsChange?.(selected.map((n) => n.id))
        }
        onDelete={onDelete}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onDrop={onDrop}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }}
        defaultViewport={graph.viewport}
        onMoveEnd={(event, viewport) => store.setViewport(viewport)}
        onInit={(instance) => onReady?.(instance)}
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        deleteKeyCode={isLocked ? null : ["Backspace", "Delete"]}
        // links can be dropped near the input, not only right on it
        connectionRadius={40}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-center"
      >
        <Controls position="bottom-left" showInteractive={false} />
        {blockCount >= MINIMAP_MIN_BLOCKS && (
          <MiniMap
            // bottom right is under the side panel; this sits next to the
            // zoom controls
            position="bottom-left"
            className="studyMinimap"
            nodeColor={minimapColor}
            nodeStrokeWidth={0}
            nodeBorderRadius={8}
            pannable
            zoomable
            ariaLabel="Study overview"
          />
        )}
        {others.length > 0 && <RemoteCursors others={others} />}
      </ReactFlow>
      </EdgeUiProvider>
    </StyledFlowCanvas>
  );
}

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
