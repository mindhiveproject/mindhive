import { useState, useEffect, useReducer, useRef, useCallback } from "react";
import useTranslation from "next-translate/useTranslation";

import uniqid from "uniqid";

import createEngine, {
  DiagramModel,
  DefaultDiagramState,
} from "@projectstorm/react-diagrams";

// factories
import { TasksFactory } from "./Diagram/factories/TasksFactory";
import { AnchorFactory } from "./Diagram/factories/AnchorFactory";
import { CommentsFactory } from "./Diagram/factories/CommentsFactory";
import { DesignFactory } from "./Diagram/factories/DesignFactory";
import { InPortFactory } from "./Diagram/factories/InPortFactory";
import { OutPortFactory } from "./Diagram/factories/OutPortFactory";
import { AdvancedLinkFactory } from "./Diagram/factories/LinkFactory";

// models
import { TaskModel } from "./Diagram/models/TaskModel";
import { CommentModel } from "./Diagram/models/CommentModel";
import { AnchorModel } from "./Diagram/models/AnchorModel";
import { DesignModel } from "./Diagram/models/DesignModel";

import Navigation from "../Navigation/Main";

// Shared Project Builder (includes Undo UI when undo props are passed)
import Builder from "../../Project/Builder/Builder";

export default function Engine({
  query,
  user,
  tab,
  study,
  handleChange,
  handleMultipleUpdate,
  saveStudy,
  toggleSidebar,
}) {
  const { t } = useTranslation("builder");

  // Lock the canvas if dataCollectionStatus is SUBMITTED
  const isCanvasLocked = study?.dataCollectionStatus === "SUBMITTED";

  const [hasStudyChanged, setHasStudyChanged] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  // force update canvas
  const forceUpdate = useReducer((bool) => !bool)[1];
  const [engine, setEngine] = useState(null);

  const engineRef = useRef(null);
  const undoSlotRef = useRef(null);
  const baselineRef = useRef(null);
  const skipHistoryRef = useRef(false);
  const structuralChangePendingRef = useRef(false);
  const isCanvasLockedRef = useRef(isCanvasLocked);
  isCanvasLockedRef.current = isCanvasLocked;

  const serializeModel = useCallback((model) => {
    if (!model) return null;
    try {
      return JSON.stringify(model.serialize());
    } catch (e) {
      return null;
    }
  }, []);

  const getActiveModel = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return null;
    return eng.getModel?.() || eng.model || null;
  }, []);

  const captureBaseline = useCallback(
    (model) => {
      const m = model || getActiveModel();
      baselineRef.current = serializeModel(m);
    },
    [getActiveModel, serializeModel]
  );

  const pushUndoFromCurrent = useCallback(() => {
    if (isCanvasLockedRef.current) return;
    const snapshot = serializeModel(getActiveModel());
    if (!snapshot) return;
    undoSlotRef.current = snapshot;
    setCanUndo(true);
  }, [getActiveModel, serializeModel]);

  const markStructuralChange = useCallback(() => {
    if (skipHistoryRef.current || isCanvasLockedRef.current) return;
    // Coalesce link+node events from one gesture so undo stays the true pre-state
    if (!structuralChangePendingRef.current) {
      if (baselineRef.current) {
        undoSlotRef.current = baselineRef.current;
        setCanUndo(true);
      }
      structuralChangePendingRef.current = true;
      queueMicrotask(() => {
        captureBaseline();
        setHasStudyChanged(true);
        structuralChangePendingRef.current = false;
      });
    }
  }, [captureBaseline]);

  // Undo only for block structure changes (add/remove/connect), not pan or node drag.
  const registerModelListeners = useCallback(
    (model) => {
      if (!model) return;
      model.registerListener({
        linksUpdated: () => {
          markStructuralChange();
        },
        nodesUpdated: () => {
          markStructuralChange();
        },
      });
    },
    [markStructuralChange]
  );

  const replaceModel = useCallback(
    (model) => {
      const eng = engineRef.current;
      if (!eng || !model) return;
      eng.setModel(model);
      registerModelListeners(model);
      captureBaseline(model);
      forceUpdate();
      eng.repaintCanvas?.();
    },
    [captureBaseline, registerModelListeners, forceUpdate]
  );

  const withHistorySnapshot = useCallback(
    (fn) => {
      if (isCanvasLockedRef.current) return;
      pushUndoFromCurrent();
      skipHistoryRef.current = true;
      try {
        fn();
      } finally {
        captureBaseline();
        skipHistoryRef.current = false;
        setHasStudyChanged(true);
      }
    },
    [pushUndoFromCurrent, captureBaseline]
  );

  const undoCanvas = useCallback(() => {
    if (!undoSlotRef.current || isCanvasLockedRef.current) return;
    const eng = engineRef.current;
    if (!eng) return;
    skipHistoryRef.current = true;
    try {
      const model = new DiagramModel();
      model.deserializeModel(JSON.parse(undoSlotRef.current), eng);
      eng.setModel(model);
      registerModelListeners(model);
      undoSlotRef.current = null;
      setCanUndo(false);
      captureBaseline(model);
      setHasStudyChanged(true);
      forceUpdate();
      eng.repaintCanvas?.();
    } finally {
      skipHistoryRef.current = false;
    }
  }, [captureBaseline, registerModelListeners, forceUpdate]);

  const clearUndo = useCallback(() => {
    undoSlotRef.current = null;
    setCanUndo(false);
    captureBaseline();
  }, [captureBaseline]);

  useEffect(() => {
    function handleEngine() {
      const nextEngine = createEngine();
      nextEngine.setModel(new DiagramModel());
      // Create custom node
      nextEngine.getNodeFactories().registerFactory(new TasksFactory());
      // Create custom comment
      nextEngine.getNodeFactories().registerFactory(new CommentsFactory());
      // Create custom anchor
      nextEngine.getNodeFactories().registerFactory(new AnchorFactory());
      // Create custom study design node
      nextEngine.getNodeFactories().registerFactory(new DesignFactory());
      // Register ports
      nextEngine.getPortFactories().registerFactory(new InPortFactory());
      nextEngine.getPortFactories().registerFactory(new OutPortFactory());
      // Register links
      nextEngine.getLinkFactories().registerFactory(new AdvancedLinkFactory());

      // disable creating new nodes when clicking on the link
      nextEngine.maxNumberPointsPerLink = 0;
      // disable loose links
      const state = nextEngine.getStateMachine().getCurrentState();
      if (state instanceof DefaultDiagramState) {
        state.dragNewLink.config.allowLooseLinks = false;
      }
      // load the saved model
      if (study?.diagram) {
        const model = new DiagramModel();
        model.deserializeModel(JSON.parse(study?.diagram), nextEngine);
        nextEngine.setModel(model);
      } else {
        const anchor = new AnchorModel({});
        nextEngine.getModel().addNode(anchor);
      }
      engineRef.current = nextEngine;
      setEngine(nextEngine);
    }
    handleEngine();
    // Specify how to clean up after this effect:
    return function cleanup() {
      // saveDiagramState();
    };
  }, []);
  // study?.diagram - was removed from the previous line not to update every time when the study state is updated

  // Attach undo listeners once the engine exists
  useEffect(() => {
    if (!engine) return;
    const model = engine.getModel?.() || engine.model;
    registerModelListeners(model);
    captureBaseline(model);
  }, [engine]); // eslint-disable-line react-hooks/exhaustive-deps -- register once when engine mounts

  const getRandomIntInclusive = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
  };

  const shorten = (text) => {
    if (text && text.split(" ").length > 12) {
      const short = text.split(" ").slice(0, 12).join(" ");
      return `${short} ...`;
    }
    return text;
  };

  // save the state of the diagram to the more general study state
  const saveDiagramState = () => {
    const model = engine?.model;
    // Serializing
    const diagram = JSON.stringify(model?.serialize());
    // Get the study flow
    const flow = createStudyFlow();
    return {
      diagram,
      flow,
    };
  };

  const addComponentToCanvas = ({
    name,
    details,
    componentID,
    taskType,
    subtitle,
    createCopy,
  }) => {
    if (isCanvasLocked)
      return alert(t("engine.studyLocked", {}, { default: "The study has been locked" }));
    withHistorySnapshot(() => {
      let newNode;
      if (createCopy) {
        newNode = new TaskModel({
          color: "white",
          name,
          details: shorten(details),
          componentID,
          testId: uniqid.time(),
          taskType,
          subtitle: `${t("engine.copy", {}, { default: "COPY" })} ${shorten(subtitle)}`,
          createCopy: true,
        });
      } else {
        newNode = new TaskModel({
          color: "white",
          name,
          details: shorten(details),
          componentID,
          testId: uniqid.time(),
          taskType,
          subtitle: shorten(subtitle),
        });
      }
      const event = {
        clientX: getRandomIntInclusive(300, 500),
        clientY: getRandomIntInclusive(300, 500),
      };
      const point = engine.getRelativeMousePoint(event);
      newNode.setPosition(point);
      engine.getModel().addNode(newNode);
      forceUpdate();
    });
  };

  const addStudyTemplateToCanvas = ({ study: templateStudy }) => {
    if (isCanvasLocked)
      return alert(t("engine.studyLocked", {}, { default: "The study has been locked" }));
    withHistorySnapshot(() => {
      const { diagram } = templateStudy;
      const model = new DiagramModel();
      model.deserializeModel(JSON.parse(diagram), engine);
      replaceModel(model);
    });
  };

  const addComment = () => {
    if (isCanvasLocked)
      return alert(t("engine.studyLocked", {}, { default: "The study has been locked" }));
    withHistorySnapshot(() => {
      const note = new CommentModel({
        author: user?.username,
        time: Date.now(),
        content: "",
      });
      const event = {
        clientX: getRandomIntInclusive(300, 500),
        clientY: getRandomIntInclusive(300, 500),
      };
      const point = engine.getRelativeMousePoint(event);
      note.setPosition(point);
      engine.getModel().addNode(note);
      forceUpdate();
    });
  };

  const addAnchor = () => {
    if (isCanvasLocked)
      return alert(t("engine.studyLocked", {}, { default: "The study has been locked" }));
    withHistorySnapshot(() => {
      const anchor = new AnchorModel({});
      const event = {
        clientX: getRandomIntInclusive(300, 500),
        clientY: getRandomIntInclusive(300, 500),
      };
      const point = engine.getRelativeMousePoint(event);
      anchor.setPosition(point);
      engine.getModel().addNode(anchor);
      forceUpdate();
    });
  };

  const addDesignToCanvas = ({ name, details, conditions }) => {
    if (isCanvasLocked)
      return alert(t("engine.studyLocked", {}, { default: "The study has been locked" }));
    withHistorySnapshot(() => {
      const newNode = new DesignModel({
        name,
        details,
        conditions,
      });
      const event = {
        clientX: getRandomIntInclusive(300, 500),
        clientY: getRandomIntInclusive(300, 500),
      };
      const point = engine.getRelativeMousePoint(event);
      newNode.setPosition(point);
      engine.getModel().addNode(newNode);
      forceUpdate();
    });
  };

  const onBeforeCanvasMutation = () => {
    pushUndoFromCurrent();
    skipHistoryRef.current = true;
  };

  const onAfterCanvasMutation = () => {
    captureBaseline(getActiveModel());
    skipHistoryRef.current = false;
    setHasStudyChanged(true);
    forceUpdate();
  };

  const onModelReplaced = (model) => {
    replaceModel(model);
    skipHistoryRef.current = false;
    setHasStudyChanged(true);
  };

  const addFunctions = {
    addComponentToCanvas,
    addStudyTemplateToCanvas,
    addComment,
    addAnchor,
    addDesignToCanvas,
    shorten,
  };

  // STUDY FLOW FUNCTIONS
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
    } else {
      if (
        node?.ports?.out?.links &&
        Object.values(node?.ports?.out?.links).length
      ) {
        children = Object.values(node?.ports?.out?.links).map(
          (link) => link?.targetPort?.parent
        );
      }
    }
    return children;
  };

  const findNodes = ({ currentNode, flow, position }) => {
    // redefine what is the flow based on the type of the current node
    let currentFlow;
    if (currentNode?.options?.type === "design") {
      const ports = Object.values(currentNode?.ports).filter(
        (port) => port?.options?.type === "outCustomPort"
      );
      flow.push({
        ...currentNode?.options,
        position: position,
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
        // get the last pushed object with the corresponding flow
        currentFlow = flow[flow.length - 1].conditions[num].flow;
        findNodes({
          currentNode: child,
          flow: currentFlow,
          position: position + 1,
        });
      });
    } else {
      // task node
      flow.push({ ...currentNode?.options, position: position });
      currentFlow = flow;
      // find children of the current node
      const children = findChildrenNodes({ node: currentNode }) || [];
      // for each of the children, repeat finding nodes
      children.forEach((child) => {
        findNodes({
          currentNode: child,
          flow: currentFlow,
          position: position + 1,
        });
      });
    }
  };

  const createStudyFlow = () => {
    const model = engine?.model;
    const allNodes = model.getNodes() || [];
    const startingNode = allNodes.filter(
      (node) => node?.options?.type === "my-anchor"
    )[0];
    const flow = [];
    // find all nodes and append them to the flow
    findNodes({ currentNode: startingNode, flow, position: 0 });
    return flow;
  };

  const buildStudy = () => {
    const model = engine?.model;

    // CLEANUP: Remove any dangling/loose links before saving
    const linksToRemove = [];
    model.getLinks().forEach((link) => {
      if (!link.getSourcePort() || !link.getTargetPort()) {
        linksToRemove.push(link);
      }
    });
    skipHistoryRef.current = true;
    linksToRemove.forEach((link) => {
      link.remove();
    });
    skipHistoryRef.current = false;

    if (linksToRemove.length > 0) {
      // Notify the user clearly
      alert(
        t(
          `We found ${linksToRemove.length} incomplete link${
            linksToRemove.length > 1 ? "s" : ""
          } (not connected on both ends) and removed ${
            linksToRemove.length > 1 ? "them" : "it"
          } automatically to keep your study valid.\n\n` +
            `How to create a correct connection between blocks:\n` +
            `1. Click and drag from the output port (small circle at the bottom of the starting block).\n` +
            `2. Move the link toward the next block – it should show a highlighted orange border when you're over a valid drop spot.\n` +
            `3. Release the mouse/button on the highlighted block.\n` +
            `4. Confirm success: A clear arrow should appear at the end of the link, pointing into the next block.\n\n` +
            `This arrow shows the direction of your study flow (from one block to the next). Your study is now cleaned up and saved successfully!`,
          { count: linksToRemove.length }
        )
      );
      engine.repaintCanvas();
    }

    const { flow, diagram } = saveDiagramState();
    const updatedVersionHistory = study?.versionHistory?.map((v) => {
      if (v?.id === study?.currentVersion) {
        return { ...v, diagram };
      } else {
        return v;
      }
    });
    saveStudy({
      flow,
      diagram,
      descriptionInProposalCardId: study?.descriptionInProposalCardId,
      tags: study?.tags,
      status: study?.status,
      currentVersion: study?.currentVersion,
      versionHistory: updatedVersionHistory,
    });
    setHasStudyChanged(false);
    clearUndo();
  };

  const handleStudyChange = (props) => {
    setHasStudyChanged(true);
    handleChange(props);
  };

  const handleStudyMultipleUpdate = (props) => {
    setHasStudyChanged(true);
    handleMultipleUpdate(props);
  };

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        saveBtnName="Save"
        saveBtnFunction={buildStudy}
        toggleSidebar={toggleSidebar}
        hasStudyChanged={hasStudyChanged}
        isCanvasLocked={isCanvasLocked}
      />
      <Builder
        query={query}
        user={user}
        study={study}
        handleChange={handleStudyChange}
        handleMultipleUpdate={handleStudyMultipleUpdate}
        engine={engine}
        addFunctions={addFunctions}
        hasStudyChanged={hasStudyChanged}
        setHasStudyChanged={setHasStudyChanged}
        isCanvasLocked={isCanvasLocked}
        canUndo={canUndo}
        undoCanvas={undoCanvas}
        onBeforeCanvasMutation={onBeforeCanvasMutation}
        onAfterCanvasMutation={onAfterCanvasMutation}
        onModelReplaced={onModelReplaced}
      />
    </>
  );
}
