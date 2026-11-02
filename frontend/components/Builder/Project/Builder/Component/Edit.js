import { useMutation } from "@apollo/client";
import { useRef } from "react";

import useForm from "../../../../../lib/useForm";
import useAutoSave from "../../../../../lib/useAutoSave";
import { runtimeAssetVariables } from "../../../../../lib/runtime/runtimeAsset";

import { CREATE_TASK, UPDATE_TASK } from "../../../../Mutations/Task";

import ComponentForm from "../../../Component/Form";

import { MY_TASK, TASK_TO_EDIT, TASK_TO_PARTICIPATE } from "../../../../Queries/Task";
import { cleanI18nContent } from "../../../../../lib/i18nContent";

// fields that only live on the canvas node, not on the task
const CANVAS_ONLY_FIELDS = ["subtitle", "askDataUsageQuestion"];

function valueFromEvent(e) {
  let { value, name, type } = e.target;
  if (type === "number") {
    value = parseFloat(value);
  }
  if (type === "checkbox") {
    value = e.target.checked;
  }
  return { name, value };
}

export default function EditComponent({
  user,
  isAuthor,
  createCopy,
  task,
  updateCanvas,
  close,
  openPreview,
}) {
  const { inputs, handleChange, handleMultipleUpdate } = useForm(
    { ...task },
    { freezeInitialSync: true }
  );

  const isTemplateAuthor = false;
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;
  const createdIdRef = useRef(isAuthor && !createCopy ? task?.id : null);

  const [createTask, { error: createTaskError }] = useMutation(CREATE_TASK);
  const [updateTask, { error: taskError }] = useMutation(UPDATE_TASK);

  // Writes the task as it is when the save starts. useAutoSave runs saves one
  // after the other and saves again when the task changed during a save, so
  // the copy is only created once and no edit is dropped.
  const saveTask = async () => {
    const current = inputsRef.current;
    const collaborators = (current?.collaborators || [])
      .filter((col) => col?.id)
      .map((col) => ({ id: col.id }));

    if (createdIdRef.current) {
      await updateTask({
        variables: {
          id: createdIdRef.current,
          title: current?.title,
          description: current?.description,
          descriptionForParticipants: current?.descriptionForParticipants,
          link: current?.link,
          parameters: current?.parameters,
          settings: current?.settings,
          i18nContent: cleanI18nContent(current),
          collaborators,
        },
        refetchQueries: [
          { query: MY_TASK, variables: { id: createdIdRef.current } },
          { query: TASK_TO_EDIT, variables: { id: createdIdRef.current } },
          {
            query: TASK_TO_PARTICIPATE,
            variables: { id: createdIdRef.current },
          },
        ],
        awaitRefetchQueries: true,
      });
      return;
    }

    const res = await createTask({
      variables: {
        title: current?.title,
        description: current?.description,
        descriptionForParticipants: current?.descriptionForParticipants,
        ...runtimeAssetVariables(current),
        taskType: current?.taskType,
        isExternal: current?.isExternal,
        link: current?.link,
        parameters: current?.parameters,
        settings: current?.settings,
        i18nContent: cleanI18nContent(current),
        collaborators,
      },
    });
    const newId = res?.data?.createTask?.id;
    createdIdRef.current = newId;
    handleMultipleUpdate({ id: newId });
    // keep the edits made while the copy was being created
    inputsRef.current = { ...inputsRef.current, id: newId };
    updateCanvas({ task: inputsRef.current, operation: "create" });
  };

  const { saveState, markChanged, saveNow, autoSave } = useAutoSave({
    save: saveTask,
    isEnabled: true,
    delay: 600,
  });

  const updateNode = () => {
    updateCanvas({
      task: {
        ...inputsRef.current,
        id: createdIdRef.current || inputsRef.current?.id,
      },
      operation: "update",
    });
  };

  const markDirtyAndChange = (e) => {
    const { name, value } = valueFromEvent(e);
    inputsRef.current = { ...inputsRef.current, [name]: value };
    handleChange(e);
    // the canvas node is auto-saved with the study
    updateNode();
    if (!CANVAS_ONLY_FIELDS.includes(name)) markChanged();
  };

  const markDirtyAndMultiple = (obj) => {
    inputsRef.current = { ...inputsRef.current, ...obj };
    handleMultipleUpdate(obj);
    updateNode();
    markChanged();
  };

  const flushSave = async () => {
    autoSave.cancel();
    await saveNow();
  };

  const handleClose = async () => {
    try {
      await flushSave();
    } catch (e) {
      // keep the panel open so the error stays visible
      return;
    }
    close();
  };

  const handlePreview = async () => {
    await flushSave().catch(() => {});
    openPreview?.();
  };

  return (
    <ComponentForm
      user={user}
      inputs={inputs}
      handleChange={markDirtyAndChange}
      handleMultipleUpdate={markDirtyAndMultiple}
      handleSubmit={handleClose}
      loading={saveState === "saving"}
      error={taskError || createTaskError}
      isTemplateAuthor={isTemplateAuthor}
      close={handleClose}
      openPreview={handlePreview}
      isInStudyBuilder
    />
  );
}
