import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { useApolloClient } from "@apollo/client";
import { ReactFlowProvider } from "@xyflow/react";
import uniqid from "uniqid";
import * as Y from "yjs";

import Navigation from "../Navigation/Main";
import Builder from "./Builder";
import CycleLinkPreventedModal from "../../shared/CycleLinkPreventedModal";
import StudyFlowCanvas, { newId } from "./Flow/StudyFlowCanvas";
import { CanvasActionsProvider } from "./Flow/CanvasActions";
import useStudyGraph, { SEED_ORIGIN } from "./Flow/useStudyGraph";
import usePresence, { presenceByNode } from "./Flow/presence";
import { CollaboratorsBar } from "./Flow/Collaborators";
import { BuilderLoading } from "./Loading";
import {
  NODE_TYPES,
  LEGACY_TYPES,
  graphFromDiagram,
  graphFingerprint,
  serializeGraph,
} from "../../../../lib/studyGraph";
import { writeGraph, meta } from "../../../../lib/studyGraph/yjs";
import { useCardCollabSession } from "../../../../lib/useCardCollabSession";
import { isStudyLocked } from "../../../../lib/studyLock";
import useAutoSave from "../../../../lib/useAutoSave";
import { TASK_OWNERSHIP } from "../../../Queries/Task";
import { COPY_TASK_FOR_STUDY } from "../../../Mutations/Task";
import { STUDY_DATA_SOURCES } from "../../../Queries/DataSourceBlock";
import { UPDATE_STUDY_DATA_SOURCE } from "../../../Mutations/DataSourceBlock";

// Size of a block, used to place new blocks around a point
const BLOCK_WIDTH = 378;
const BLOCK_HEIGHT = 128;

const shorten = (text) => {
  if (text && text.split(" ").length > 12) {
    return `${text.split(" ").slice(0, 12).join(" ")} ...`;
  }
  return text;
};

const anchorNode = (position = { x: 0, y: 0 }) => ({
  id: newId(),
  type: NODE_TYPES.ANCHOR,
  position,
  data: {},
});

// What the side panels read from a block: the shape of a Storm node's
// options ({ id, type: "my-node", componentID, ... }). `options` is read
// when used, so a panel that stays open sees later changes to the block.
function nodeHandle(getNode, id) {
  return {
    getID: () => id,
    get options() {
      const node = getNode(id);
      return node
        ? { id, type: LEGACY_TYPES[node.type], ...node.data }
        : { id };
    },
  };
}

// A saved design that differs from the shared document is loaded into it
// only when nobody has saved from the document for this long
const ACTIVE_SESSION_MS = 2 * 60 * 1000;

/**
 * Gets the shared document ready to edit. The first person to open a study
 * puts its saved design in the document. Later, the document is the design;
 * but if the saved design changed without it (saved from the Storm canvas,
 * or while live collaboration was unavailable) and nobody is working in it
 * right now, the saved design replaces it.
 *
 * Returns "shared", or "local" when this browser should edit the saved
 * design without the document (a read-only connection cannot load it).
 */
function prepareSharedDesign({ doc, provider, initialGraph, hasSavedDesign, isReadOnly }) {
  const info = meta(doc);
  const load = () =>
    doc.transact(() => {
      writeGraph(doc, initialGraph, Y);
      info.set("seeded", true);
      info.set("savedFingerprint", graphFingerprint(initialGraph));
    }, SEED_ORIGIN);

  if (!info.get("seeded")) {
    if (isReadOnly) return "local";
    load();
    return "shared";
  }
  if (!hasSavedDesign) return "shared";
  if (info.get("savedFingerprint") === graphFingerprint(initialGraph)) {
    return "shared";
  }
  const othersHere = (provider?.awareness?.getStates()?.size || 0) > 1;
  const recentlySaved = Date.now() - (Number(info.get("savedAt")) || 0) < ACTIVE_SESSION_MS;
  // a live session's latest changes may not be saved yet: the document wins
  if (othersHere || recentlySaved) return "shared";
  if (isReadOnly) return "local";
  load();
  return "shared";
}

/**
 * The Study Builder on the React Flow canvas: same props and behaviour as
 * Engine.js (the Storm canvas), plus collaborative editing. An existing study is edited together through
 * a shared Yjs document (`study:<id>` on the collaboration server); when that
 * server cannot be reached the builder works alone, as before. Either way the
 * design is saved as study.diagram (Storm format, so both canvases can open
 * it) and study.flow.
 */
export default function FlowEngine(props) {
  const { study, query } = props;
  const isCollaborative = !!study?.id && query?.area !== "cloneofstudy";

  // The design as saved; a study without one starts with the starting point
  const [initialGraph] = useState(() => {
    const graph = graphFromDiagram(study?.diagram);
    if (!study?.diagram) graph.nodes.push(anchorNode());
    return graph;
  });

  const session = useCardCollabSession({
    documentName: isCollaborative ? `study:${study.id}` : null,
    active: isCollaborative,
  });

  const [mode, setMode] = useState(null);
  useEffect(() => {
    if (session.status === "synced" && session.provider && !mode) {
      setMode(
        prepareSharedDesign({
          doc: session.provider.document,
          provider: session.provider,
          initialGraph,
          hasSavedDesign: !!study?.diagram,
          isReadOnly: isStudyLocked(study),
        })
      );
    }
    // the connection is gone for good: keep editing alone
    if (session.status === "unavailable" && mode !== "local") setMode("local");
  }, [session.status, session.provider]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isCollaborative && !mode) return <BuilderLoading />;

  const shared = mode === "shared" && session.provider;
  return (
    <FlowEditor
      key={shared ? "shared" : "local"}
      {...props}
      initialGraph={initialGraph}
      doc={shared ? session.provider.document : null}
      provider={shared ? session.provider : null}
      connected={!!shared && session.connected}
      workingAlone={isCollaborative && !shared}
    />
  );
}

function FlowEditor({
  query,
  user,
  tab,
  study,
  project,
  handleChange,
  handleMultipleUpdate,
  saveStudy,
  initialGraph,
  doc,
  provider,
  connected,
  workingAlone,
}) {
  const { t } = useTranslation("builder");
  const apolloClient = useApolloClient();

  // Lock the canvas once the study is submitted
  const isCanvasLocked = isStudyLocked(study);
  const isCanvasLockedRef = useRef(isCanvasLocked);
  isCanvasLockedRef.current = isCanvasLocked;
  // A study that does not exist yet (new, clone, project without a study) is
  // created with the Save button; changes to an existing one are auto-saved
  const isAutoSaveEnabled =
    !isCanvasLocked && !!study?.id && query?.area !== "cloneofstudy";

  const [versionNotice, setVersionNotice] = useState(null);
  const [cycleWarningOpen, setCycleWarningOpen] = useState(false);
  const saveDesignRef = useRef(async () => null);

  const {
    hasUnsavedChanges: hasStudyChanged,
    saveState,
    saveError,
    markChanged,
    saveNow,
    autoSave,
    retry: retrySave,
  } = useAutoSave({
    save: (options) => saveDesignRef.current(options),
    isEnabled: isAutoSaveEnabled,
  });

  const markStudyChanged = useCallback(() => {
    if (isCanvasLockedRef.current) return;
    markChanged();
  }, [markChanged]);

  const store = useStudyGraph(initialGraph, {
    onChange: markStudyChanged,
    doc,
    readOnly: isCanvasLocked,
  });
  const { getNode } = store;

  // ---- presence ---------------------------------------------------------

  const { others, setCursor, setSelection, setEditing } = usePresence({
    provider,
    user,
  });
  // rebuilt only when what others selected or opened changes, not on every
  // pointer move
  const selectionKey = JSON.stringify(
    others.map((o) => [o.user.id, o.user.color, o.selection, o.editing])
  );
  const nodePresence = useMemo(
    () => presenceByNode(others),
    [selectionKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Settings (tags, status, ...) are saved with the design only after this
  // person changed them, so a save made for a collaborator's canvas change
  // never writes back this browser's older copy of them.
  const settingsChangedRef = useRef(false);

  const reactFlowRef = useRef(null);
  // Set by Builder through renderCanvas: the side panel openers
  const panelOpenersRef = useRef({});

  const getDiagramState = useCallback(
    () => serializeGraph(store.graphRef.current),
    [store]
  );

  // A point in the middle of the part of the canvas the side panel does not
  // cover, a little off so blocks added one after another do not stack.
  const visibleCenter = () => {
    const instance = reactFlowRef.current;
    const element = document.getElementById("canvas");
    if (!instance || !element) return { x: 0, y: 0 };
    const rect = element.getBoundingClientRect();
    const sidepanelWidth = document.getElementById("sidepanel")?.offsetWidth || 0;
    const jitter = () => Math.round((Math.random() - 0.5) * 120);
    const point = instance.screenToFlowPosition({
      x: rect.left + Math.max(rect.width - sidepanelWidth, 0) / 2 + jitter(),
      y: rect.top + rect.height / 2 + jitter(),
    });
    return { x: point.x - BLOCK_WIDTH / 2, y: point.y - BLOCK_HEIGHT / 2 };
  };

  // A new study shows its starting point in the middle of the visible canvas
  const onCanvasReady = useCallback(
    (instance) => {
      reactFlowRef.current = instance;
      const { nodes } = store.graphRef.current;
      const [anchor] = nodes;
      if (
        nodes.length !== 1 ||
        anchor?.type !== NODE_TYPES.ANCHOR ||
        anchor.position.x !== 0 ||
        anchor.position.y !== 0
      ) {
        return;
      }
      const element = document.getElementById("canvas");
      if (!element?.clientWidth) return;
      const sidepanelWidth = document.getElementById("sidepanel")?.offsetWidth || 0;
      const visibleWidth = Math.max(element.clientWidth - sidepanelWidth, 0);
      instance.setViewport({
        x: Math.max((visibleWidth - BLOCK_WIDTH) / 2, 0),
        y: Math.max((element.clientHeight - BLOCK_HEIGHT) / 2, 0),
        zoom: 1,
      });
    },
    [store]
  );

  // ---- side panels ------------------------------------------------------

  const openComponentModal = useCallback(
    ({ nodeId, ...panels }) =>
      panelOpenersRef.current.openComponentModal?.({
        node: nodeHandle(getNode, nodeId),
        ...panels,
      }),
    [getNode]
  );

  const openDesignSettings = useCallback(
    ({ nodeId }) =>
      panelOpenersRef.current.openDesignSettings?.({
        node: nodeHandle(getNode, nodeId),
      }),
    [getNode]
  );

  // Opens the settings panel of a block that was just added, so the user
  // sees right away what the block needs. Skipped if it was removed since.
  const openNodeSettings = (nodeId) => {
    const node = getNode(nodeId);
    if (!node || isCanvasLockedRef.current) return;
    if (node.type === NODE_TYPES.DESIGN) {
      openDesignSettings({ nodeId });
    } else if (node.data?.componentID) {
      openComponentModal({
        nodeId,
        isEditorOpen: true,
        isInfoOpen: false,
        isPreviewOpen: false,
      });
    }
  };

  // ---- adding blocks ----------------------------------------------------

  const alertLocked = () =>
    alert(t("engine.studyLocked", {}, { default: "The study has been locked" }));

  // Points a block just added at the user's own copy of its task, so later
  // edits to the original (by its author) never change this study. Blocks of
  // a task the user owns keep the original unless `always` is set ("Create a
  // copy"); the Study Builder never edits that original either.
  const giveNodeOwnTask = async (nodeId, { always = false } = {}) => {
    const originalId = getNode(nodeId)?.data?.componentID;
    if (!originalId) return;
    try {
      const { data } = await apolloClient.query({
        query: TASK_OWNERSHIP,
        variables: { id: originalId },
        fetchPolicy: "network-only",
      });
      const task = data?.task;
      const owns =
        task?.author?.id === user?.id ||
        (task?.collaborators || []).some((c) => c?.id === user?.id);
      if (owns && !always) return;
      const res = await apolloClient.mutate({
        mutation: COPY_TASK_FOR_STUDY,
        variables: { id: originalId },
      });
      const copyId = res?.data?.copyTaskForStudy?.id;
      // the block may have been removed while the copy was being made
      if (!copyId || !getNode(nodeId)) return;
      store.updateNodeData(nodeId, { componentID: copyId, createCopy: false });
    } catch (error) {
      alert(
        t("engine.copyFailed", {}, {
          default:
            "This block could not get its own copy of the task. Remove it and add it again.",
        })
      );
    }
  };

  // A dropped or added task block first gets the study's own copy of its
  // task, then opens on that copy (never on the original).
  const onTaskNodeAdded = (nodeId, options) =>
    giveNodeOwnTask(nodeId, options).finally(() => openNodeSettings(nodeId));

  const taskNode = (fields, position, { copyLabel = false } = {}) => ({
    id: newId(),
    type: NODE_TYPES.TASK,
    position,
    data: {
      name: fields?.name,
      details: shorten(fields?.details),
      componentID: fields?.componentID,
      testId: uniqid.time(),
      taskType: fields?.taskType,
      subtitle: copyLabel
        ? `${t("engine.copy", "COPY")} ${shorten(fields?.subtitle)}`
        : shorten(fields?.subtitle),
    },
  });

  const designNode = (fields, position) => ({
    id: newId(),
    type: NODE_TYPES.DESIGN,
    position,
    data: { name: fields?.name, details: fields?.details, conditions: [] },
  });

  const addComponentToCanvas = (fields) => {
    if (isCanvasLockedRef.current) return alertLocked();
    const node = taskNode(fields, visibleCenter(), {
      copyLabel: !!fields?.createCopy,
    });
    store.addNode(node);
    onTaskNodeAdded(node.id, { always: !!fields?.createCopy });
  };

  const addDesignToCanvas = (fields) => {
    if (isCanvasLockedRef.current) return alertLocked();
    const node = designNode(fields, visibleCenter());
    store.addNode(node);
    openNodeSettings(node.id);
  };

  const addComment = () => {
    if (isCanvasLockedRef.current) return alertLocked();
    store.addNode({
      id: newId(),
      type: NODE_TYPES.COMMENT,
      position: visibleCenter(),
      data: { author: user?.username, time: Date.now(), content: "" },
    });
  };

  const addAnchor = () => {
    if (isCanvasLockedRef.current) return alertLocked();
    store.addNode(anchorNode(visibleCenter()));
  };

  // Replaces the design with a template's or a saved version's. Returns the
  // { diagram, flow } that is now on the canvas.
  const addStudyTemplateToCanvas = ({ study: templateStudy }) => {
    if (isCanvasLockedRef.current) {
      alertLocked();
      return null;
    }
    const { diagram } = templateStudy || {};
    if (!diagram) {
      alert(
        t("version.missingDiagram", {}, {
          default: "This version has no saved diagram to load.",
        })
      );
      return null;
    }
    const graph = graphFromDiagram(diagram);
    if (!graph.nodes.length) {
      alert(
        t("version.invalidDiagram", {}, {
          default: "This version's diagram could not be loaded.",
        })
      );
      return null;
    }
    store.replaceGraph({ ...graph, viewport: store.graphRef.current.viewport });
    requestAnimationFrame(() =>
      reactFlowRef.current?.fitView({ padding: 0.2, duration: 300 })
    );
    return getDiagramState();
  };

  const onDropPayload = (payload, position) => {
    if (isCanvasLockedRef.current) return;
    const at = { x: position.x - BLOCK_WIDTH / 2, y: position.y - 20 };
    if (payload?.type === "component") {
      const node = taskNode(payload, at);
      store.addNode(node);
      onTaskNodeAdded(node.id);
    } else if (payload?.type === "design") {
      const node = designNode(payload, at);
      store.addNode(node);
      openNodeSettings(node.id);
    } else if (payload?.type === "study") {
      addStudyTemplateToCanvas({ study: payload });
    }
  };

  // ---- duplicating ------------------------------------------------------

  // Data sources limited to some blocks (`scope: { steps: [...] }`) that run
  // during `sourceBlockId` also run during `newBlockId`, so a duplicated block
  // records the same way as the one it was made from.
  const copyBlockDataSources = async (sourceBlockId, newBlockId) => {
    if (!study?.id) return;
    try {
      const { data } = await apolloClient.query({
        query: STUDY_DATA_SOURCES,
        variables: { studyId: study.id },
        fetchPolicy: "network-only",
      });
      const rows = (data?.studyDataSources || []).filter(
        (row) =>
          Array.isArray(row.scope?.steps) &&
          row.scope.steps.includes(sourceBlockId) &&
          !row.scope.steps.includes(newBlockId)
      );
      await Promise.all(
        rows.map((row) =>
          apolloClient.mutate({
            mutation: UPDATE_STUDY_DATA_SOURCE,
            variables: {
              id: row.id,
              data: { scope: { ...row.scope, steps: [...row.scope.steps, newBlockId] } },
            },
          })
        )
      );
    } catch (error) {
      console.error("Could not add the duplicated block to its data sources", error);
    }
  };

  // Blocks whose duplicate is being made, so a double click makes only one
  const duplicatingRef = useRef(new Set());

  // Puts a copy of a task block next to it, with its own copy of the task
  // (so editing one block never changes the other). The copy is not linked,
  // so it stays out of the study flow until the user connects it.
  const duplicateNode = async (nodeId) => {
    if (isCanvasLockedRef.current) return alertLocked();
    const source = getNode(nodeId);
    const sourceTaskId = source?.data?.componentID;
    if (!sourceTaskId || duplicatingRef.current.has(nodeId)) return;
    duplicatingRef.current.add(nodeId);
    try {
      let copyId;
      try {
        const res = await apolloClient.mutate({
          mutation: COPY_TASK_FOR_STUDY,
          variables: { id: sourceTaskId },
        });
        copyId = res?.data?.copyTaskForStudy?.id;
      } catch (error) {
        console.error(error);
      }
      if (!copyId) {
        alert(
          t("engine.duplicateFailed", {}, {
            default: "This block could not be duplicated. Please try again.",
          })
        );
        return;
      }
      if (isCanvasLockedRef.current) return;
      const current = getNode(nodeId) || source;
      const copy = {
        id: newId(),
        type: NODE_TYPES.TASK,
        position: { x: current.position.x + 40, y: current.position.y + 40 },
        data: {
          ...current.data,
          componentID: copyId,
          testId: uniqid.time(),
          createCopy: false,
        },
      };
      store.addNode(copy);
      await copyBlockDataSources(nodeId, copy.id);
    } finally {
      duplicatingRef.current.delete(nodeId);
    }
  };

  const updateComment = (nodeId, patch) => store.updateNodeData(nodeId, patch);

  // ---- canvas adapter for Builder.js (see canvasAdapter.js) -------------

  const canvas = {
    isReady: true,
    hasStartingPoint: () =>
      store.graphRef.current.nodes.some((n) => n.type === NODE_TYPES.ANCHOR),
    sharesTask: (node) => {
      const componentID = node?.options?.componentID;
      return (
        !!componentID &&
        store.graphRef.current.nodes.some(
          (n) => n.id !== node.getID() && n.data?.componentID === componentID
        )
      );
    },
    updateTaskNodes: ({ componentID, testId }, patch) =>
      store.updateNodesWhere(
        (n) =>
          n.type === NODE_TYPES.TASK &&
          n.data?.componentID === componentID &&
          n.data?.testId === testId,
        patch
      ),
    removeNode: (node) => store.removeElements({ nodeIds: [node.getID()] }),
    getDesignConditions: (node) => getNode(node.getID())?.data?.conditions || [],
    setDesignConditions: (node, conditions) =>
      store.setDesignConditions(node.getID(), conditions),
  };

  const addFunctions = {
    addComponentToCanvas,
    duplicateNode: (node) => duplicateNode(node?.getID?.() ?? node),
    onTaskNodeAdded,
    openNodeSettings,
    addStudyTemplateToCanvas,
    addComment,
    addAnchor,
    addDesignToCanvas,
    getDiagramState,
    shorten,
  };

  const canvasActions = {
    studyId: study?.id,
    isLocked: isCanvasLocked,
    openComponentModal,
    openDesignSettings,
    openStudyPreview: () => panelOpenersRef.current.openStudyPreview?.(),
    duplicateNode,
    updateComment,
  };

  const renderCanvas = (openers) => {
    panelOpenersRef.current = openers;
    return (
      <CanvasActionsProvider value={canvasActions}>
        <StudyFlowCanvas
          store={store}
          isLocked={isCanvasLocked}
          onDropPayload={onDropPayload}
          onCyclePrevented={() => setCycleWarningOpen(true)}
          onReady={onCanvasReady}
          others={others}
          nodePresence={nodePresence}
          onCursorMove={provider ? setCursor : undefined}
          onSelectionIdsChange={provider ? setSelection : undefined}
        />
      </CanvasActionsProvider>
    );
  };

  // ---- saving -----------------------------------------------------------

  saveDesignRef.current = async ({ createVersion = false } = {}) => {
    const { flow, diagram } = getDiagramState();
    const includeSettings = !store.isShared || settingsChangedRef.current;
    settingsChangedRef.current = false;
    // saveStudy creates the study when it does not exist yet, and stores the
    // design as a new version when createVersion is set and it differs from
    // the most recent one
    let result;
    try {
      result = await saveStudy({
        flow,
        diagram,
        descriptionInProposalCardId: study?.descriptionInProposalCardId,
        tags: study?.tags?.map((tag) => ({ id: tag?.id })) || [],
        status: study?.status,
        createVersion,
        includeSettings,
      });
    } catch (error) {
      if (includeSettings) settingsChangedRef.current = true;
      throw error;
    }
    // tell the next person who opens the study that the saved design is
    // the shared one (see prepareSharedDesign)
    if (doc && !isCanvasLockedRef.current) {
      doc.transact(() => {
        const info = meta(doc);
        info.set("savedFingerprint", graphFingerprint(graphFromDiagram(diagram)));
        info.set("savedAt", Date.now());
      }, SEED_ORIGIN);
    }
    return result;
  };

  useEffect(() => {
    if (!versionNotice) return undefined;
    const timeout = setTimeout(() => setVersionNotice(null), 4000);
    return () => clearTimeout(timeout);
  }, [versionNotice]);

  // The Save button: stores the design as a new version, or creates the study
  // when it does not exist yet. (Links are only ever made between two blocks
  // here, so there are no loose links to clean up first.)
  const saveVersion = async () => {
    autoSave.cancel();
    let result;
    try {
      result = await saveNow({ createVersion: true, force: true });
    } catch (error) {
      alert(
        t(
          "engine.saveFailed",
          { message: error?.message || "" },
          {
            default:
              "The study could not be saved: {{message}}. Please check your connection and try again.",
          }
        )
      );
      return;
    }
    if (isAutoSaveEnabled) {
      setVersionNotice(result?.versionCreated ? "saved" : "unchanged");
    }
    store.clearHistory();
  };

  const handleStudyChange = (props) => {
    settingsChangedRef.current = true;
    markStudyChanged();
    handleChange(props);
  };

  const handleStudyMultipleUpdate = (props) => {
    settingsChangedRef.current = true;
    markStudyChanged();
    handleMultipleUpdate(props);
  };

  return (
    <ReactFlowProvider>
      <Navigation
        proposalId={query?.selector}
        query={query}
        user={user}
        tab={tab}
        saveBtnName={
          isAutoSaveEnabled
            ? t("engine.saveVersion", {}, { default: "Save version" })
            : t("engine.save", "Save")
        }
        saveBtnFunction={saveVersion}
        // auto-saved changes only need a warning when saving them failed
        hasStudyChanged={
          isAutoSaveEnabled ? saveState === "error" : hasStudyChanged
        }
        saveStatus={
          isAutoSaveEnabled
            ? {
                state: saveState,
                errorMessage: saveError?.message,
                lastSavedAt: study?.updatedAt,
                versionNotice,
                onRetry: retrySave,
              }
            : undefined
        }
        isCanvasLocked={isCanvasLocked}
      />
      <Builder
        query={query}
        user={user}
        project={project}
        study={study}
        handleChange={handleStudyChange}
        handleMultipleUpdate={handleStudyMultipleUpdate}
        canvas={canvas}
        renderCanvas={renderCanvas}
        addFunctions={addFunctions}
        markStudyChanged={markStudyChanged}
        isCanvasLocked={isCanvasLocked}
        canUndo={store.canUndo}
        undoCanvas={store.undo}
        onPanelNodeChange={provider ? setEditing : undefined}
        topBarExtras={
          provider ? (
            <CollaboratorsBar others={others} connected={connected} />
          ) : workingAlone ? (
            <CollaboratorsBar
              others={[]}
              connected={false}
              message={t("collaboration.unavailable", {}, {
                default: "Live collaboration is unavailable right now",
              })}
            />
          ) : null
        }
      />
      <CycleLinkPreventedModal
        open={cycleWarningOpen}
        onClose={() => setCycleWarningOpen(false)}
      />
    </ReactFlowProvider>
  );
}
