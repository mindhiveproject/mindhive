import { useState, useEffect, useReducer } from "react";

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
import Builder from "./Builder";

export default function Engine({
  query,
  user,
  tab,
  study,
  project,
  handleChange,
  handleMultipleUpdate,
  saveStudy,
  toggleSidebar,
}) {
  const [hasStudyChanged, setHasStudyChanged] = useState(false);
  // force update canvas
  const forceUpdate = useReducer((bool) => !bool)[1];
  const [engine, setEngine] = useState(null);
  useEffect(() => {
    function handleEngine() {
      const engine = createEngine();
      engine.setModel(new DiagramModel());
      // Create custom node
      engine.getNodeFactories().registerFactory(new TasksFactory());
      // Create custom comment
      engine.getNodeFactories().registerFactory(new CommentsFactory());
      // Create custom anchor
      engine.getNodeFactories().registerFactory(new AnchorFactory());
      // Create custom study design node
      engine.getNodeFactories().registerFactory(new DesignFactory());
      // Register ports
      engine.getPortFactories().registerFactory(new InPortFactory());
      engine.getPortFactories().registerFactory(new OutPortFactory());
      // Register links
      engine.getLinkFactories().registerFactory(new AdvancedLinkFactory());

      // disable creating new nodes when clicking on the link
      engine.maxNumberPointsPerLink = 0;
      // disable loose links
      const state = engine.getStateMachine().getCurrentState();
      if (state instanceof DefaultDiagramState) {
        state.dragNewLink.config.allowLooseLinks = false;
      }
      // load the saved model
      if (study?.diagram) {
        const model = new DiagramModel();
        model.deserializeModel(JSON.parse(study?.diagram), engine);
        engine.setModel(model);
      } else {
        const anchor = new AnchorModel({});
        engine.getModel().addNode(anchor);
      }
      // register unsaved changes on link and node events
      engine.model.registerListener({
        linksUpdated: (e) => {
          if (e?.isCreated) {
            setHasStudyChanged(true);
          }
        },
        nodesUpdated: (e) => {
          setHasStudyChanged(true);
        },
      });
      setEngine(engine);
    }
    handleEngine();
    // Specify how to clean up after this effect:
    return function cleanup() {
      // saveDiagramState();
    };
  }, []);
  // study?.diagram - was removed from the previous line not to update every time when the study state is updated

  useEffect(() => {
    if (engine && study?.diagram) {
      engine.repaintCanvas();
    }
  }, [engine, study?.diagram]);

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
    let newNode;
    if (createCopy) {
      newNode = new TaskModel({
        color: "white",
        name,
        details: shorten(details),
        componentID,
        testId: uniqid.time(),
        taskType,
        subtitle: `COPY ${shorten(subtitle)}`,
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
  };

  const addStudyTemplateToCanvas = ({ study }) => {
    const { diagram } = study;
    const model = new DiagramModel();
    model.deserializeModel(JSON.parse(diagram), engine);
    engine.setModel(model);
    setHasStudyChanged(true);
  };

  const addComment = () => {
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
    setHasStudyChanged(true);
  };

  const addAnchor = () => {
    const anchor = new AnchorModel({});
    const event = {
      clientX: getRandomIntInclusive(300, 500),
      clientY: getRandomIntInclusive(300, 500),
    };
    const point = engine.getRelativeMousePoint(event);
    anchor.setPosition(point);
    engine.getModel().addNode(anchor);
    forceUpdate();
  };

  const addDesignToCanvas = ({ name, details, conditions }) => {
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
      tags: study?.tags.map((tag) => ({ id: tag?.id })),
      status: study?.status,
      currentVersion: study?.currentVersion,
      versionHistory: updatedVersionHistory,
    });
    setHasStudyChanged(false);
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
        proposalId={query?.selector}
        query={query}
        user={user}
        tab={tab}
        saveBtnName="Save"
        saveBtnFunction={buildStudy}
        toggleSidebar={toggleSidebar}
        hasStudyChanged={hasStudyChanged}
      />
      <Builder
        query={query}
        user={user}
        project={project}
        study={study}
        handleChange={handleStudyChange}
        handleMultipleUpdate={handleStudyMultipleUpdate}
        engine={engine}
        addFunctions={addFunctions}
        hasStudyChanged={hasStudyChanged}
        setHasStudyChanged={setHasStudyChanged}
      />
    </>
  );
}
