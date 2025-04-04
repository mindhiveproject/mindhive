import { useEffect } from "react";
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

  // save and edit the task information
  const { inputs, handleChange, handleMultipleUpdate, clearForm } = useForm({
    ...task,
    id: undefined,
  });

  useEffect(() => {
    async function fetchFile() {
      // get the file and put it in inputs?.script
      const url = `/api/templates/${task?.template?.slug}/script`;
      const res = await fetch(url);
      const data = await res.text();
      handleMultipleUpdate({
        template: {
          ...inputs?.template,
          script: data,
        },
      });
    }
    if (inputs?.template?.slug) {
      fetchFile();
    }
  }, [inputs?.template?.slug]);

  const [
    createTask,
    { data: taskData, loading: taskLoading, error: taskError },
  ] = useMutation(CREATE_TASK, {
    variables: inputs,
    refetchQueries: [
      {
        query: MY_TASKS,
        variables: {
          where: {
            AND: [
              { taskType: { equals: task?.taskType } },
              {
                OR: [
                  { author: { id: { equals: user?.id } } },
                  { collaborators: { some: { id: { equals: user?.id } } } },
                ],
              },
            ],
          },
        },
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

    redirect({ area: `${task?.taskType.toLowerCase()}s` });
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
