import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import useTranslation from "next-translate/useTranslation";

import useForm from "../../../../../lib/useForm";

import { UPDATE_TEMPLATE } from "../../../../Mutations/Template";
import { UPDATE_TASK } from "../../../../Mutations/Task";

import ComponentForm from "../../../Component/Form";

import { MY_TASK } from "../../../../Queries/Task";

export default function EditComponent({
  user,
  task,
  updateCanvas,
  close,
}) {

  const router = useRouter();
  const { t } = useTranslation("common");

  const { inputs, handleChange, handleMultipleUpdate, clearForm } = useForm({
    ...task,
  });

  // do not allow to edit template in the study builder
  const isTemplateAuthor = false;

  const [
    updateTask,
    { data: taskData, loading: taskLoading, error: taskError },
  ] = useMutation(UPDATE_TASK, {
    variables: inputs,
    refetchQueries: [{ query: MY_TASK, variables: { id: task?.id } }],
  });

  async function handleSubmit() {
    
    // update the task
    await updateTask({
      variables: {
        collaborators: inputs?.collaborators.map((col) => ({ id: col?.id })),
      },
    });

    // update the canvas in the study builder
    updateCanvas({ task: {
      ...inputs,
    }, operation: "update" });
    close();
  }

  return (
    <ComponentForm
      user={user}
      inputs={inputs}
      handleChange={handleChange}
      handleMultipleUpdate={handleMultipleUpdate}
      handleSubmit={handleSubmit}
      submitBtnName={t("update")}
      loading={taskLoading}
      error={taskError}
      isTemplateAuthor={isTemplateAuthor}
      close={close}
      isInStudyBuilder
    />
  );
}
