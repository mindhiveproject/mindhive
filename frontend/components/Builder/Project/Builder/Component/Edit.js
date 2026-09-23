import { useMutation } from "@apollo/client";
import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";

import useForm from "../../../../../lib/useForm";

import { CREATE_TASK, UPDATE_TASK } from "../../../../Mutations/Task";

import ComponentForm from "../../../Component/Form";

import { MY_TASK, TASK_TO_EDIT, TASK_TO_PARTICIPATE } from "../../../../Queries/Task";

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
  persistStudy,
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
  const dirtyTaskRef = useRef(false);
  const createdIdRef = useRef(isAuthor && !createCopy ? task?.id : null);
  const [saveState, setSaveState] = useState("idle");

  const [createTask, { error: createTaskError }] = useMutation(CREATE_TASK);
  const [updateTask, { error: taskError }] = useMutation(UPDATE_TASK);

  const persistFnRef = useRef(async () => {});

  persistFnRef.current = async () => {
    const current = inputsRef.current;
    const collaborators = (current?.collaborators || [])
      .filter((col) => col?.id)
      .map((col) => ({ id: col.id }));

    updateCanvas({
      task: { ...current, id: createdIdRef.current || current?.id },
      operation: "update",
    });
    persistStudy?.();

    if (!dirtyTaskRef.current) {
      setSaveState("saved");
      return;
    }

    setSaveState("saving");
    try {
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
            i18nContent: current?.i18nContent,
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
      } else {
        const res = await createTask({
          variables: {
            title: current?.title,
            description: current?.description,
            descriptionForParticipants: current?.descriptionForParticipants,
            templateId: current?.templateId,
            taskType: current?.taskType,
            isExternal: current?.isExternal,
            link: current?.link,
            parameters: current?.parameters,
            settings: current?.settings,
            i18nContent: current?.i18nContent,
            collaborators,
          },
        });
        const newId = res?.data?.createTask?.id;
        createdIdRef.current = newId;
        handleMultipleUpdate({ id: newId });
        inputsRef.current = { ...current, id: newId };
        updateCanvas({
          task: {
            ...current,
            id: newId,
            subtitle: current?.subtitle,
            askDataUsageQuestion: current?.askDataUsageQuestion,
          },
          operation: "create",
        });
        persistStudy?.();
      }
      dirtyTaskRef.current = false;
      setSaveState("saved");
    } catch (e) {
      setSaveState("idle");
    }
  };

  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        persistFnRef.current?.();
      }, 600),
    []
  );

  useEffect(
    () => () => {
      debouncedSave.flush();
      debouncedSave.cancel();
    },
    [debouncedSave]
  );

  const markDirtyAndChange = (e) => {
    const { name, value } = valueFromEvent(e);
    inputsRef.current = { ...inputsRef.current, [name]: value };
    if (name !== "subtitle" && name !== "askDataUsageQuestion") {
      dirtyTaskRef.current = true;
    }
    setSaveState("idle");
    handleChange(e);
    updateCanvas({
      task: {
        ...inputsRef.current,
        id: createdIdRef.current || inputsRef.current?.id,
      },
      operation: "update",
    });
    persistStudy?.();
    debouncedSave();
  };

  const markDirtyAndMultiple = (obj) => {
    dirtyTaskRef.current = true;
    inputsRef.current = { ...inputsRef.current, ...obj };
    setSaveState("idle");
    handleMultipleUpdate(obj);
    updateCanvas({
      task: {
        ...inputsRef.current,
        id: createdIdRef.current || inputsRef.current?.id,
      },
      operation: "update",
    });
    persistStudy?.();
    debouncedSave();
  };

  const flushSave = async () => {
    debouncedSave.cancel();
    await persistFnRef.current?.();
  };

  const handleClose = async () => {
    await flushSave();
    close();
  };

  const handlePreview = async () => {
    await flushSave();
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
