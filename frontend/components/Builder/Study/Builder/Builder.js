import { useState } from "react";

import Widget from "./Widget";
import Menu from "./Menu";
import Component from "./Component/Main";

import { StyledCanvasBuilder } from "../../../styles/StyledBuilder";

export default function Builder({
  query,
  user,
  study,
  handleChange,
  handleMultipleUpdate,
  engine,
  addFunctions,
}) {
  const [node, setNode] = useState(null);
  const [componentId, setComponentId] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const openComponentModal = ({
    node,
    isInfoOpen,
    isPreviewOpen,
    isEditorOpen,
  }) => {
    console.log({ node, isInfoOpen, isPreviewOpen, isEditorOpen });
    setNode(node);
    setIsInfoOpen(isInfoOpen);
    setIsPreviewOpen(isPreviewOpen);
    setIsEditorOpen(isEditorOpen);
    setComponentId(node?.options?.componentID);
  };

  const closeComponentModal = () => {
    setComponentId(null);
    engine.getModel().setLocked(false); // unlock the model
  };

  const openDesignModal = ({ node }) => {
    console.log("open design modal", node);
  };

  const closeDesignModal = () => {
    console.log("close design modal");
  };

  const updateCanvas = ({ task, operation }) => {
    const model = engine?.model;
    const nodes = model.getNodes() || [];
    const componentID = node?.options?.componentID;
    const testId = node?.options?.testId;
    // use componentID to update multiple nodes with the same task
    nodes.forEach((n) => {
      if (
        (operation === "create" &&
          n?.options?.componentID === componentID &&
          n?.options?.testId === testId) ||
        (operation === "update" && n?.options?.componentID === componentID)
      ) {
        n.updateOptions({
          componentID: task?.id,
          name: task?.title,
          details: addFunctions.shorten(task?.description),
          subtitle: addFunctions.shorten(task?.subtitle),
        });
      }
    });
    engine.repaintCanvas();
  };

  return (
    <StyledCanvasBuilder>
      <div className="board">
        <button className="addCommentButton" onClick={addFunctions.addComment}>
          Add a comment
        </button>
        {engine?.model &&
          !engine?.model
            .getNodes()
            .filter((node) => node?.options?.type === "my-anchor").length && (
            <button
              className="addAnchorButton"
              onClick={addFunctions?.addAnchor}
            >
              Add starting point
            </button>
          )}
        <Widget
          engine={engine}
          openComponentModal={openComponentModal}
          openDesignModal={openDesignModal}
        />
        <Menu
          user={user}
          engine={engine}
          addFunctions={addFunctions}
          setComponentId={setComponentId}
          study={study}
          handleChange={handleChange}
          handleMultipleUpdate={handleMultipleUpdate}
        />
      </div>

      {componentId && (
        <Component
          query={query}
          user={user}
          componentId={componentId}
          close={() => closeComponentModal()}
          isInfoOpen={isInfoOpen}
          isPreviewOpen={isPreviewOpen}
          isEditorOpen={isEditorOpen}
          updateCanvas={updateCanvas}
          addFunctions={addFunctions}
          node={node}
        />
      )}
    </StyledCanvasBuilder>
  );
}
