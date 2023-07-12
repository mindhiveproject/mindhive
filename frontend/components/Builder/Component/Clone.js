import { useQuery, useMutation } from "@apollo/client";

import useTranslation from "next-translate/useTranslation";

import { TASK_TO_CLONE } from "../../Queries/Task";
import { CREATE_TASK } from "../../Mutations/Task";
import { MY_TASKS } from "../../Queries/Task";

import ComponentForm from "./Form";

import useForm from "../../../lib/useForm";

export default function CloneTask({ query, user, taskSlug, redirect }) {
  const { t } = useTranslation("classes");

  const { data, error, loading } = useQuery(TASK_TO_CLONE, {
    variables: { slug: taskSlug },
  });

  const task = data?.task || {
    title: "",
    description: "",
  };

  // console.log(task);

  // save and edit the task information
  const { inputs, handleChange, handleMultipleUpdate, clearForm } = useForm({
    ...task,
    id: undefined,
  });

  console.log({ inputs });

  const [
    createTask,
    { data: taskData, loading: taskLoading, error: taskError },
  ] = useMutation(CREATE_TASK, {
    variables: inputs,
    refetchQueries: [
      {
        query: MY_TASKS,
        variables: { id: user?.id, taskType: task?.taskType },
      },
    ],
  });

  async function handleSubmit() {
    // create a new task with connection to the new template
    await createTask({
      variables: {
        templateId: inputs?.template?.id,
        collaborators:
          inputs?.collaborators?.map((col) => ({ id: col?.id })) || [],
      },
    });
    // to do: change to parameter "area"‚
    redirect({ area: "tasks" });
  }

  return (
    <ComponentForm
      user={user}
      inputs={inputs}
      handleChange={handleChange}
      handleMultipleUpdate={handleMultipleUpdate}
      handleSubmit={handleSubmit}
      submitBtnName={t("common.create")}
      loading={taskLoading}
      error={taskError}
      isTemplateAuthor={false}
    />
  );
}
