import { useState } from "react";

import Widget from "./Widget";
import Menu from "./Menu";
import Component from "./Component/Main";

import { StyledCanvasBuilder } from "../../../styles/StyledBuilder";
import Modal from "./Modal/Main";
import StudyPreview from "../../../Studies/Preview/Main";

import InDev from "../../../Global/InDev";

export default function Builder({
  query,
  user,
  study,
  handleChange,
  handleMultipleUpdate,
  engine,
  addFunctions,
  hasStudyChanged,
  setHasStudyChanged,
}) {
  const [node, setNode] = useState(null);
  const [componentId, setComponentId] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudyPreviewOpen, setStudyPreviewOpen] = useState(false);

  const openComponentModal = ({
    node,
    isInfoOpen,
    isPreviewOpen,
    isEditorOpen,
  }) => {
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

  const openModal = ({ node }) => {
    setNode(node);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    engine.getModel().setLocked(false); // unlock the model
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
        (operation === "update" &&
          n?.options?.componentID === componentID &&
          n?.options?.testId === testId)
      ) {
        n.updateOptions({
          componentID: task?.id,
          name: task?.title,
          details: addFunctions.shorten(task?.description),
          subtitle: addFunctions.shorten(task?.subtitle),
          askDataUsageQuestion: task?.askDataUsageQuestion,
        });
      }
    });
    engine.repaintCanvas();
    setHasStudyChanged(true);
  };

  const openStudyPreview = () => {
    setStudyPreviewOpen(true);
  };

  if (isStudyPreviewOpen) {
    return (
      <StudyPreview study={study} close={() => setStudyPreviewOpen(false)} />
    );
  }

  if (!study?.id) {
    return (
      <InDev
        header="🤷🏻 Sorry, no study found, please save your study first."
        message="If you need help, please contact the tech support at info@mindhive.science"
      />
    );
  }

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
          openModal={openModal}
          openStudyPreview={openStudyPreview}
        />
        <Menu
          user={user}
          engine={engine}
          addFunctions={addFunctions}
          study={study}
          handleChange={handleChange}
          handleMultipleUpdate={handleMultipleUpdate}
          hasStudyChanged={hasStudyChanged}
        />
      </div>

      {componentId && (
        <Component
          query={query}
          user={user}
          study={study}
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

      {isModalOpen && (
        <Modal
          user={user}
          node={node}
          engine={engine}
          close={() => closeModal()}
          setHasStudyChanged={setHasStudyChanged}
          study={study}
        />
      )}
    </StyledCanvasBuilder>
  );
}
