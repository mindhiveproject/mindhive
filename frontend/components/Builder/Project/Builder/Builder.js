import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";

import Menu from "./Menu";
import Component from "./Component/Main";
import DataSources from "./DataSources/Main";
import DataSourceSettings from "./DataSources/Settings";
import TaskPreview from "../../../Tasks/Preview/Main";

import { StyledCanvasBuilder } from "../../../styles/StyledBuilder";
import Modal from "./Modal/Main";
import StudyPreview from "../../../Studies/Preview/Main";
import StudyTitle from "./StudyTitle";

import InDev from "../../../Global/InDev";
import { GET_CLASSES } from "../../../Queries/Classes";
import StudyConnector from "../../../Projects/StudyConnector/Main";
import Button from "../../../DesignSystem/Button";
import IconButton from "../../../DesignSystem/IconButton";
import { FeedbackIcon } from "../../../DesignSystem/Icons";

export default function Builder({
  query,
  user,
  study,
  project,
  handleChange,
  handleMultipleUpdate,
  // what the panels need from the canvas (Storm or React Flow, see
  // canvasAdapter.js); renderCanvas(panelOpeners) draws it
  canvas,
  renderCanvas,
  addFunctions,
  markStudyChanged,
  isCanvasLocked,
  canUndo,
  undoCanvas,
  // optional: shown in the top bar (e.g. who else is editing)
  topBarExtras = null,
  // optional: told which block is open in the side panel (id or null)
  onPanelNodeChange,
}) {
  const { t } = useTranslation("builder");
  const [node, setNode] = useState(null);
  const [componentId, setComponentId] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
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
  // "default" shows the Menu tabs; "block", "design", and "dataSource" swap
  // in a detail panel (Menu stays mounted, just hidden, so its tab survives).
  const [sidepanelMode, setSidepanelMode] = useState("default");
  // Held here rather than in Menu so the data source settings panel can send
  // the user to the Study Flow tab.
  const [menuTab, setMenuTab] = useState("addBlock");

  // The Storm canvas reacts to keys and drags anywhere on the page; it is
  // paused while a side panel is in use (React Flow needs none of this)
  if (isCanvasLocked) {
    canvas?.setInteractionLocked?.(true);
  }

  const unlockCanvasIfEditable = () => {
    if (!isCanvasLocked) {
      canvas?.setInteractionLocked?.(false);
    }
  };

  const panelNodeId =
    sidepanelMode === "block" || sidepanelMode === "design"
      ? node?.getID?.() ?? node?.options?.id ?? null
      : null;
  useEffect(() => {
    onPanelNodeChange?.(panelNodeId);
  }, [panelNodeId]); // eslint-disable-line react-hooks/exhaustive-deps -- report changes only

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
      unlockCanvasIfEditable();
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
    setComponentId(null);
    setIsInfoOpen(false);
    setIsEditorOpen(false);
    setIsPreviewOpen(false);
    unlockCanvasIfEditable();
    setDataSourceSettingsId(id);
    setSidepanelMode("dataSource");
  };

  const closeDataSourceSettings = () => {
    setDataSourceSettingsId(null);
    setSidepanelMode("default");
  };

  const openDesignSettings = ({ node }) => {
    if (isCanvasLocked) return;
    setComponentId(null);
    setIsInfoOpen(false);
    setIsEditorOpen(false);
    setIsPreviewOpen(false);
    setDataSourceSettingsId(null);
    setNode(node);
    setSidepanelMode("design");
  };

  const closeDesignSettings = () => {
    setSidepanelMode("default");
    unlockCanvasIfEditable();
  };

  const openStudyFlowTab = () => {
    closeDataSourceSettings();
    setMenuTab("flow");
  };

  // Same result as selecting the block and pressing Backspace: the block and
  // its links leave the canvas (one undo step); its task is kept.
  const deleteNodeFromCanvas = () => {
    if (isCanvasLocked || !node) return;
    canvas?.removeNode(node);
    closeComponentModal();
  };

  const openBlockPreview = useCallback(() => {
    setIsPreviewOpen(true);
  }, []);

  const updateCanvas = ({ task, operation }) => {
    if (isCanvasLocked) return; // Prevent updates when locked
    // the blocks showing this block's task (same task and version) all
    // follow the edit
    canvas?.updateTaskNodes(
      {
        componentID: node?.options?.componentID,
        testId: node?.options?.testId,
      },
      {
        componentID: task?.id,
        name: task?.title,
        details: addFunctions.shorten(task?.description),
        subtitle: addFunctions.shorten(task?.subtitle),
        askDataUsageQuestion: task?.askDataUsageQuestion,
        // the node now holds its own copy, so editing it again updates
        // that copy instead of copying the original once more
        ...(operation === "create" ? { createCopy: false } : {}),
      }
    );
    markStudyChanged();
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

  const needsStartingPoint = !!canvas?.isReady && !canvas.hasStartingPoint();

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
        {renderCanvas?.({
          openComponentModal,
          openDesignSettings,
          openStudyPreview,
        })}
        <div
          className={clsx(
            "sidepanel",
            (sidepanelMode === "block" || sidepanelMode === "design") &&
              "sidepanel--block"
          )}
          id="sidepanel"
        >
          <div
            className="sidepanelDefaultHost"
            hidden={sidepanelMode !== "default"}
          >
            <Menu
              user={user}
              canvas={canvas}
              addFunctions={lockedAddFunctions}
              study={study}
              handleChange={handleChange}
              handleMultipleUpdate={handleMultipleUpdate}
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
              sharesTask={!!canvas?.sharesTask(node)}
              onOpenPreview={openBlockPreview}
              onDeleteFromCanvas={
                isCanvasLocked ? undefined : deleteNodeFromCanvas
              }
            />
          )}
          {sidepanelMode === "design" && node && (
            <Modal
              key={node?.getID?.() || node?.options?.id || "design"}
              user={user}
              node={node}
              canvas={canvas}
              close={() => closeDesignSettings()}
              markStudyChanged={markStudyChanged}
              study={study}
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
        {!isPreviewOpen && (
          <div
            className={clsx(
              "boardTopBar",
              (sidepanelMode === "block" || sidepanelMode === "design") &&
                "boardTopBar--wideSidepanel"
            )}
          >
            <StudyTitle
              study={study}
              projectId={project?.id}
              disabled={isCanvasLocked}
              onSaved={(title) =>
                handleChange?.({ target: { name: "title", value: title } })
              }
            />
            <div className="boardTopActions">
              {topBarExtras}
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
              <Button
                id="commentButton"
                type="button"
                variant="subtle"
                onClick={lockedAddFunctions.addComment}
                disabled={isCanvasLocked}
                leadingIcon={(<FeedbackIcon />)}
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
            </div>
          </div>
        )}
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
    </StyledCanvasBuilder>
  );
}
