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
  onOpenPreview,
  persistStudy,
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

  const createCopy = node?.options?.createCopy;

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
      collaborators: [],
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
        persistStudy={persistStudy}
        close={close}
        openPreview={() => onOpenPreview?.()}
      />
    );
  }

  return (
    <Viewer
      task={task}
      close={close}
      openEditor={openEditor}
      openPreview={() => onOpenPreview?.()}
    />
  );
}
