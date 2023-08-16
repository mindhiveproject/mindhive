import { useQuery } from "@apollo/client";
import { useState } from "react";
import { TASK_TO_EDIT } from "../../../../Queries/Task.js";

import Viewer from "./Viewer.js";
import Editor from "./Editor.js";

import TaskPreview from "../../../../Tasks/Preview/Main.js";

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
}) {
  const [showInfo, setShowInfo] = useState(isInfoOpen);
  const [showPreview, setShowPreview] = useState(isPreviewOpen);
  const [showEditor, setShowEditor] = useState(isEditorOpen);

  const openEditor = () => {
    setShowEditor(true);
  };

  const openPreview = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  const { data, error, loading } = useQuery(TASK_TO_EDIT, {
    variables: { id: componentId },
  });

  const theTask = data?.task || {};
  // console.log({ theTask });

  // check whether the current user is the author of the task or the collaborator on the task
  const isAuthor =
    user?.id === theTask?.author?.id ||
    theTask?.collaborators?.map((c) => c.id).includes(user.id);

  // check whether the task should be cloned
  const createCopy = node?.options?.createCopy;

  console.log({ node });

  let task;

  if (isAuthor && !createCopy) {
    task = {
      ...theTask,
      templateId: theTask?.template?.id,
      consent: theTask?.consent?.id,
      collaborators: (theTask?.collaborators &&
        theTask.collaborators.map((c) => c.username).length &&
        theTask.collaborators.map((c) => c.username)) || [""],
    };
  } else if (createCopy) {
    task = {
      ...theTask,
      templateId: theTask?.template?.id,
      consent: null,
      collaborators: [""],
      isOriginal: false, // switch to false as it should be cloned
      subtitle: node?.options?.subtitle,
    };
  } else {
    task = {
      ...theTask,
      templateId: theTask?.template?.id,
      consent: null,
      collaborators: [""],
      isOriginal: false, // switch to false as it should be cloned
    };
  }

  if (showEditor) {
    return (
      <div className="background">
        <div className="modal">
          <Editor user={user} taskId={task?.id} close={close} />
        </div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <TaskPreview
        user={user}
        study={study}
        id={task?.id}
        close={() => {
          closePreview();
          if (!showInfo) {
            close();
          }
        }}
      />
    );
  }

  return (
    <div className="background">
      <div className="modal">
        <Viewer
          task={task}
          close={close}
          openEditor={openEditor}
          openPreview={openPreview}
        />
      </div>
    </div>
  );
}
