import { useCallback, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";

import Widget from "./Widget";
import Menu from "./Menu";
import Component from "./Component/Main";
import DataSources from "./DataSources/Main";
import DataSourceSettings from "./DataSources/Settings";
import TaskPreview from "../../../Tasks/Preview/Main";

import { StyledCanvasBuilder } from "../../../styles/StyledBuilder";
import Modal from "./Modal/Main";
import StudyPreview from "../../../Studies/Preview/Main";

import InDev from "../../../Global/InDev";
import { GET_CLASSES } from "../../../Queries/Classes";
import StudyConnector from "../../../Projects/StudyConnector/Main";
import Button from "../../../DesignSystem/Button";
import IconButton from "../../../DesignSystem/IconButton";

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
  canUndo,
  undoCanvas,
  onBeforeCanvasMutation,
  onAfterCanvasMutation,
  onModelReplaced,
  persistStudy,
}) {
  const { t } = useTranslation("builder");
  const [node, setNode] = useState(null);
  const [componentId, setComponentId] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudyPreviewOpen, setStudyPreviewOpen] = useState(false);
  const [dataSourceSettingsId, setDataSourceSettingsId] = useState(null);

  // Physiological data is opt-in per class; a study gets the data sources
  // panel when at least one of its classes has turned the setting on. Read
  // from the server rather than study.classes, which only holds ids after a
  // class is linked in the builder.
  const classIds = (study?.classes || []).map((cl) => cl?.id).filter(Boolean);
  const { data: classesData } = useQuery(GET_CLASSES, {
    variables: { input: { id: { in: classIds } } },
    skip: !classIds.length,
  });
  const physiologicalDataEnabled = (classesData?.classes || []).some(
    (cl) => cl?.settings?.physiologicalDataEnabled === true
  );
  // "default" shows the Menu tabs; "block" and "dataSource" swap in a detail
  // panel for the selected block or linked data source (Menu stays mounted,
  // just hidden, so its tab survives the round trip).
  const [sidepanelMode, setSidepanelMode] = useState("default");
  // Held here rather than in Menu so the data source settings panel can send
  // the user to the Study Flow tab.
  const [menuTab, setMenuTab] = useState("addBlock");

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
    setIsInfoOpen(!!isInfoOpen);
    setIsPreviewOpen(!!isPreviewOpen);
    setIsEditorOpen(!!isEditorOpen);
    setComponentId(node?.options?.componentID);
    if (isInfoOpen || isEditorOpen) {
      setDataSourceSettingsId(null);
      setSidepanelMode("block");
    }
  };

  const closeComponentModal = () => {
    setComponentId(null);
    setIsInfoOpen(false);
    setIsEditorOpen(false);
    setIsPreviewOpen(false);
    setSidepanelMode("default");
  };

  const openDataSourceSettings = (id) => {
    closeComponentModal();
    setDataSourceSettingsId(id);
    setSidepanelMode("dataSource");
  };

  const closeDataSourceSettings = () => {
    setDataSourceSettingsId(null);
    setSidepanelMode("default");
  };

  const openStudyFlowTab = () => {
    closeDataSourceSettings();
    setMenuTab("flow");
  };

  const openBlockPreview = useCallback(() => {
    setIsPreviewOpen(true);
  }, []);

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

  const needsStartingPoint =
    engine?.model &&
    !engine.model
      .getNodes()
      .filter((n) => n?.options?.type === "my-anchor").length;

  return (
    <StyledCanvasBuilder>
      {isCanvasLocked && (
        <div className="lockedMessageOverlay">
          <h3>{t("builder.studyBuilderLocked", {}, { default: "Study Builder Locked" })}</h3>
          <p>
            {t(
              "builder.lockedMessage",
              {},
              {
                default:
                  "This study has been submitted and cannot be edited. To make changes, please ask your teacher to un-submit the study.",
              }
            )}
          </p>
        </div>
      )}
      <div
        className="board"
        id="board"
        // onContextMenu={(e) => e.preventDefault()}
      >
        <Widget
          engine={engine}
          openComponentModal={openComponentModal}
          openModal={openModal}
          openStudyPreview={openStudyPreview}
          isCanvasLocked={isCanvasLocked}
          onBeforeCanvasMutation={onBeforeCanvasMutation}
          onAfterCanvasMutation={onAfterCanvasMutation}
          onModelReplaced={onModelReplaced}
        />
        <div
          className={clsx(
            "sidepanel",
            sidepanelMode === "block" && "sidepanel--block"
          )}
          id="sidepanel"
        >
          <div
            className="sidepanelDefaultHost"
            hidden={sidepanelMode !== "default"}
          >
            <Menu
              user={user}
              engine={engine}
              addFunctions={lockedAddFunctions}
              study={study}
              handleChange={handleChange}
              handleMultipleUpdate={handleMultipleUpdate}
              hasStudyChanged={hasStudyChanged}
              isCanvasLocked={isCanvasLocked}
              tab={menuTab}
              setTab={setMenuTab}
            />
          </div>
          {sidepanelMode === "block" && componentId && (
            <Component
              key={componentId}
              query={query}
              user={user}
              study={study}
              componentId={componentId}
              close={() => closeComponentModal()}
              isInfoOpen={isInfoOpen}
              isPreviewOpen={false}
              isEditorOpen={isEditorOpen}
              updateCanvas={updateCanvas}
              addFunctions={lockedAddFunctions}
              node={node}
              onOpenPreview={openBlockPreview}
              persistStudy={persistStudy}
            />
          )}
          {sidepanelMode === "dataSource" && dataSourceSettingsId && (
            <DataSourceSettings
              key={dataSourceSettingsId}
              study={study}
              studyDataSourceId={dataSourceSettingsId}
              onClose={closeDataSourceSettings}
              onOpenStudyFlow={openStudyFlowTab}
            />
          )}
        </div>
        {physiologicalDataEnabled && (
          <DataSources
            study={study}
            user={user}
            dataSourceSettingsId={dataSourceSettingsId}
            onOpenSettings={openDataSourceSettings}
          />
        )}
        <div className="boardTopActions">
          <Button
            id="commentButton"
            type="button"
            variant="filled"
            style={{ background: "#5D5763" }}
            onClick={lockedAddFunctions.addComment}
            disabled={isCanvasLocked}
          >
            {t("builder.addComment", {}, { default: "Add a comment" })}
          </Button>
          {needsStartingPoint && (
            <Button
              type="button"
              variant="tonal"
              onClick={lockedAddFunctions.addAnchor}
              disabled={isCanvasLocked}
            >
              {t("builder.addStartingPoint", {}, {
                default: "Add starting point",
              })}
            </Button>
          )}
          {typeof undoCanvas === "function" &&
            canUndo &&
            !isCanvasLocked && (
              <IconButton
                id="undoButton"
                type="button"
                variant="text"
                onClick={undoCanvas}
                ariaLabel={t("builder.undo", {}, { default: "Undo" })}
                title={t("builder.undo", {}, { default: "Undo" })}
                icon={
                  <img
                    src="/assets/tiptapIcons/undo.svg"
                    alt=""
                    width="24"
                    height="24"
                  />
                }
              />
            )}
        </div>
      </div>

      {isPreviewOpen && componentId && (
        <TaskPreview
          user={user}
          study={study}
          id={componentId}
          close={() => {
            setIsPreviewOpen(false);
            if (sidepanelMode !== "block") {
              closeComponentModal();
            }
          }}
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
