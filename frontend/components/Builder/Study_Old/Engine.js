import { useState, useEffect, useReducer } from "react";

import uniqid from "uniqid";
import generate from "project-name-generator";

import createEngine, {
  DiagramModel,
  DefaultDiagramState,
} from "@projectstorm/react-diagrams";

// factories
import { TasksFactory } from "./Builder/Diagram/factories/TasksFactory";
import { AnchorFactory } from "./Builder/Diagram/factories/AnchorFactory";
import { CommentsFactory } from "./Builder/Diagram/factories/CommentsFactory";
import { DesignFactory } from "./Builder/Diagram/factories/DesignFactory";
import { InPortFactory } from "./Builder/Diagram/factories/InPortFactory";
import { OutPortFactory } from "./Builder/Diagram/factories/OutPortFactory";
import { AdvancedLinkFactory } from "./Builder/Diagram/factories/LinkFactory";

// models
import { TaskModel } from "./Builder/Diagram/models/TaskModel";
import { CommentModel } from "./Builder/Diagram/models/CommentModel";
import { AnchorModel } from "./Builder/Diagram/models/AnchorModel";
import { DesignModel } from "./Builder/Diagram/models/DesignModel";

import Builder from "./Builder/Main";
import Navigation from "./Navigation/Main";
import Proposal from "./Proposal/Main";
import ParticipantPage from "./ParticipantPage/Main";
import Review from "./Review/Main";
import Collect from "./Collect/Main";

import { StyledBuilderArea } from "../../styles/StyledBuilder";

export default function Engine({
  query,
  user,
  study,
  handleChange,
  handleMultipleUpdate,
  captureFile,
  toggleSlidebar,
}) {
  const [tab, setTab] = useState("page");

  // force update canvas
  const forceUpdate = useReducer((bool) => !bool)[1];
  const [engine, setEngine] = useState(null);
  useEffect(() => {
    function handleEngine() {
      // console.log("Setting it up");
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
            createUnsavedChanges();
          }
        },
        nodesUpdated: (e) => {
          createUnsavedChanges();
        },
      });
      setEngine(engine);
    }
    handleEngine();
    // Specify how to clean up after this effect:
    return function cleanup() {
      // console.log("Cleaning up");
      // saveDiagramState();
    };
  }, [study?.diagram]);

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

  // diagram functions
  const findChildren = (node) => {
    let children = [];
    if (
      node?.ports?.out?.links &&
      Object.values(node?.ports?.out?.links).length
    ) {
      children = Object.values(node?.ports?.out?.links).map(
        (link) => link?.targetPort?.parent
      );
    }
    return children;
  };

  const compareArrays = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const makeBlock = (tests) => {
    const blocks = study?.components?.blocks || [];
    // find whether there is a block which contains the tests (by id)
    const blocksWithTests = blocks.filter((block) => {
      if (
        block?.tests.length === tests.length &&
        compareArrays(
          block?.tests?.map((t) => t?.id),
          tests.map((t) => t?.id)
        )
      ) {
        return true;
      }
      return false;
    });
    return {
      blockId: blocksWithTests.length
        ? blocksWithTests[0]?.blockId
        : uniqid.time(),
      title: blocksWithTests.length
        ? blocksWithTests[0]?.title
        : generate().dashed,
      tests: [...tests],
      skip: blocksWithTests.length ? blocksWithTests[0].skip : false,
    };
  };

  const findChildrenRecursively = (nodes, level, blocks, tests) => {
    nodes.forEach((node) => {
      let blockTests = [];
      if (level > 0) {
        blockTests = [...tests];
        blockTests.push({
          id: node?.options?.componentID,
          title: node?.options?.name,
          testId: node?.options?.testId,
          subtitle: node?.options?.subtitle,
          level,
        });
      }
      const children = findChildren(node) || [];
      if (children.length) {
        findChildrenRecursively(children, level + 1, blocks, blockTests);
      } else {
        blocks.push(makeBlock(blockTests));
      }
    });
  };

  const createStudyDesign = ({ model }) => {
    const allNodes = model.getNodes() || [];
    const startingNode = allNodes.filter(
      (node) => node?.options?.type === "my-anchor"
    );
    const blocks = [];
    findChildrenRecursively(startingNode, 0, blocks, []);
    return { blocks };
  };

  // save the state of the diagram to the more general study state
  const saveDiagramState = () => {
    const model = engine?.model;
    // Serializing
    const diagram = JSON.stringify(model?.serialize());
    // Get the experiment model
    const components = createStudyDesign({ model });
    handleMultipleUpdate({ diagram, components });
  };

  const addComponentToCanvas = ({
    name,
    details,
    componentID,
    taskType,
    subtitle,
  }) => {
    const newNode = new TaskModel({
      color: "white",
      name,
      details: shorten(details),
      componentID,
      testId: uniqid.time(),
      taskType,
      subtitle: shorten(subtitle),
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

  const addStudyTemplateToCanvas = (study) => {
    const { diagram } = study;
    const model = new DiagramModel();
    model.deserializeModel(JSON.parse(diagram), props.engine);
    engine.setModel(model);
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

  const addDesignToCanvas = ({ name, details }) => {
    const newNode = new DesignModel({
      name,
      details,
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

  const createUnsavedChanges = () => {
    handleChange({
      target: {
        name: "unsavedChanges",
        value: true,
      },
    });
  };

  const addFunctions = {
    addComponentToCanvas,
    addStudyTemplateToCanvas,
    addComment,
    addAnchor,
    addDesignToCanvas,
    shorten,
  };

  return (
    <StyledBuilderArea>
      <Navigation
        query={query}
        tab={tab}
        study={study}
        user={user}
        setTab={setTab}
        handleChange={handleChange}
        saveDiagramState={saveDiagramState}
        toggleSlidebar={toggleSlidebar}
      />

      <div className="board">
        {/* <button onClick={() => saveDiagramState()}>Save</button> */}
        {tab === "proposal" && <Proposal user={user} study={study} />}

        {tab === "page" && (
          <ParticipantPage
            query={query}
            user={user}
            study={study}
            handleChange={handleChange}
            handleMultipleUpdate={handleMultipleUpdate}
            captureFile={captureFile}
          />
        )}

        {tab === "builder" && (
          <Builder
            query={query}
            user={user}
            study={study}
            handleChange={handleChange}
            handleMultipleUpdate={handleMultipleUpdate}
            engine={engine}
            addFunctions={addFunctions}
          />
        )}

        {tab === "review" && (
          <Review
            query={query}
            user={user}
            study={study}
            handleChange={handleChange}
            handleMultipleUpdate={handleMultipleUpdate}
            captureFile={captureFile}
          />
        )}

        {tab === "collect" && (
          <Collect
            query={query}
            user={user}
            study={study}
            handleChange={handleChange}
            handleMultipleUpdate={handleMultipleUpdate}
          />
        )}
      </div>
    </StyledBuilderArea>
  );
}
