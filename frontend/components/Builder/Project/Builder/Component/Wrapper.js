import { useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { TASK_TO_EDIT } from "../../../../Queries/Task.js";

import Viewer from "./Viewer.js";
import Editor from "./Editor.js";

export default function Wrapper({
  query,
  user,
  study,
  componentId,
  close,
  isInfoOpen,
  isPreviewOpen,
  isEditorOpen,
  updateCanvas,
  addFunctions,
  node,
  sharesTask,
  onOpenPreview,
  onDeleteFromCanvas,
}) {
  const { t } = useTranslation("builder");
  const [showEditor, setShowEditor] = useState(isEditorOpen);

  useEffect(() => {
    setShowEditor(isEditorOpen);
  }, [componentId, isEditorOpen]);

  const openEditor = () => {
    setShowEditor(true);
  };

  const { data, error, loading } = useQuery(TASK_TO_EDIT, {
    variables: { id: componentId },
  });

  const theTask = data?.task || {};

  const isAuthor =
    user?.id === theTask?.author?.id ||
    (theTask?.collaborators?.map((c) => c.id) || []).includes(user.id);

  // The Study Builder never edits an original task (the one in the task
  // bank, without `copiedFrom`), nor a task another block on the canvas also
  // uses: the block gets its own copy on first save, so the edit stays in
  // this block.
  const isOriginalTask = !theTask?.copiedFrom?.id;
  const createCopy = node?.options?.createCopy || sharesTask || isOriginalTask;

  const canvasFields = {
    subtitle: node?.options?.subtitle,
    testId: node?.options?.testId,
    askDataUsageQuestion: node?.options?.askDataUsageQuestion,
  };

  let task;

  if (isAuthor && !createCopy) {
    task = {
      ...theTask,
      templateId: theTask?.template?.id,
      consent: theTask?.consent?.id,
      ...canvasFields,
    };
  } else if (createCopy) {
    task = {
      ...theTask,
      templateId: theTask?.template?.id,
      consent: null,
      // an author's own task, copied for this block, keeps its team
      collaborators: isAuthor ? theTask?.collaborators || [] : [],
      isOriginal: false,
      ...canvasFields,
    };
  } else {
    task = {
      ...theTask,
      templateId: theTask?.template?.id,
      consent: null,
      collaborators: [],
      isOriginal: false,
      ...canvasFields,
    };
  }

  if (loading || !theTask?.id) {
    return (
      <div className="blockPanel">
        <p className="blockPanelLoading">
          {t("blockPanel.loading", {}, { default: "Loading…" })}
        </p>
      </div>
    );
  }

  if (showEditor) {
    return (
      <Editor
        user={user}
        isAuthor={isAuthor}
        createCopy={createCopy}
        task={task}
        updateCanvas={updateCanvas}
        close={close}
        openPreview={() => onOpenPreview?.()}
        onDeleteFromCanvas={onDeleteFromCanvas}
      />
    );
  }

  return (
    <Viewer
      task={task}
      user={user}
      study={study}
      close={close}
      openEditor={openEditor}
      openPreview={() => onOpenPreview?.()}
    />
  );
}
