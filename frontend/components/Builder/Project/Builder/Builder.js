import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Widget from "./Widget";
import Menu from "./Menu";
import Component from "./Component/Main";

import { StyledCanvasBuilder } from "../../../styles/StyledBuilder";
import Modal from "./Modal/Main";
import StudyPreview from "../../../Studies/Preview/Main";

import InDev from "../../../Global/InDev";
import StudyConnector from "../../../Projects/StudyConnector/Main";

export default function Builder({
  query,
  user,
  study,
  project,
  handleChange,
  handleMultipleUpdate,
  engine,
  addFunctions,
  hasStudyChanged,
  setHasStudyChanged,
  isCanvasLocked,
}) {
  const { t } = useTranslation("builder");
  const [node, setNode] = useState(null);
  const [componentId, setComponentId] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudyPreviewOpen, setStudyPreviewOpen] = useState(false);

  if (isCanvasLocked && engine?.getModel()) {
    engine.getModel().setLocked(true);
  }

  const openComponentModal = ({
    node,
    isInfoOpen,
    isPreviewOpen,
    isEditorOpen,
  }) => {
    if (isCanvasLocked) return; // Prevent opening modals when locked
    setNode(node);
    setIsInfoOpen(isInfoOpen);
    setIsPreviewOpen(isPreviewOpen);
    setIsEditorOpen(isEditorOpen);
    setComponentId(node?.options?.componentID);
  };

  const closeComponentModal = () => {
    setComponentId(null);
    if (!isCanvasLocked && engine?.getModel()) {
      engine.getModel().setLocked(false); // Unlock only if not SUBMITTED
    }
  };

  const openModal = ({ node }) => {
    if (isCanvasLocked) return; // Prevent opening modals when locked
    setNode(node);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (!isCanvasLocked && engine?.getModel()) {
      engine.getModel().setLocked(false); // Unlock only if not SUBMITTED
    }
  };

  const updateCanvas = ({ task, operation }) => {
    if (isCanvasLocked) return; // Prevent updates when locked
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
    setStudyPreviewOpen(true); // Allow preview even when locked
  };

  // Wrap addFunctions to block task additions when locked
  const lockedAddFunctions = {
    ...addFunctions,
    addAnchor: () => {
      if (isCanvasLocked) return;
      addFunctions.addAnchor();
    },
    addComment: () => {
      if (isCanvasLocked) return;
      addFunctions.addComment();
    },
    addNode: () => {
      if (isCanvasLocked) return;
      if (addFunctions.addNode) addFunctions.addNode();
    },
    addTask: () => {
      if (isCanvasLocked) return;
      if (addFunctions.addTask) addFunctions.addTask();
    },
  };

  if (isStudyPreviewOpen) {
    return (
      <StudyPreview study={study} close={() => setStudyPreviewOpen(false)} />
    );
  }

  if (!study?.id) {
    return (
      <div>
        <StudyConnector user={user} project={project} />
      </div>
    );
  }

  return (
    <StyledCanvasBuilder>
      {isCanvasLocked && (
        <div className="lockedMessageOverlay">
          <h3>{t("builder.studyBuilderLocked", "Study Builder Locked")}</h3>
          <p>
            {t("builder.lockedMessage", "This study has been submitted and cannot be edited. To make changes, please ask your teacher to un-submit the study.")}
          </p>
        </div>
      )}
      <div className="board">
        <Widget
          engine={engine}
          openComponentModal={openComponentModal}
          openModal={openModal}
          openStudyPreview={openStudyPreview}
          isCanvasLocked={isCanvasLocked}
        />
        <div className="sidepanel">
          <Menu
            user={user}
            engine={engine}
            addFunctions={lockedAddFunctions}
            study={study}
            handleChange={handleChange}
            handleMultipleUpdate={handleMultipleUpdate}
            hasStudyChanged={hasStudyChanged}
            isCanvasLocked={isCanvasLocked}
          />
        </div>
        <button
          className="addCommentButton"
          onClick={lockedAddFunctions.addComment}
          disabled={isCanvasLocked}
        >
          {t("builder.addComment", "Add a comment")}
        </button>
        {engine?.model &&
          !engine?.model
            .getNodes()
            .filter((node) => node?.options?.type === "my-anchor").length && (
            <button
              className="addAnchorButton"
              onClick={lockedAddFunctions.addAnchor}
              disabled={isCanvasLocked}
            >
              {t("builder.addStartingPoint", "Add starting point")}
            </button>
          )}
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
          addFunctions={lockedAddFunctions}
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
