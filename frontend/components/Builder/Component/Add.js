import { useMutation } from "@apollo/client";

import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../lib/useForm";
import DisplayError from "../../ErrorMessage";

import { CREATE_TEMPLATE, UPDATE_TEMPLATE } from "../../Mutations/Template";
import { CREATE_TASK, CREATE_EXTERNAL_TASK } from "../../Mutations/Task";
import { MY_TASKS } from "../../Queries/Task";

import ComponentForm from "./Form";

import UploadFile from "./Template/UploadFile";

export default function AddComponent({ query, user, redirect, isExternal }) {
  const { area } = query;
  const taskType = area.slice(0, -1).toUpperCase();

  const { t } = useTranslation("classes");

  const { inputs, handleChange, handleMultipleUpdate, clearForm } = useForm({
    title: "",
    description: "",
    descriptionForParticipants: "",
    taskType,
    template: {
      title: "",
      description: "",
    },
    isExternal: !!isExternal,
    settings: {
      mobileCompatible: false,
      descriptionBefore: "",
      descriptionAfter: "",
      background: "",
      duration: "",
      scoring: "",
      format: "",
      resources: "[]",
      aggregateVariables: "[]",
      addInfo: "",
    },
  });

  const [
    createTemplate,
    { data: templateData, loading: templateLoading, error: templateError },
  ] = useMutation(CREATE_TEMPLATE, {
    variables: inputs?.template,
  });

  const [
    updateTemplate,
    {
      data: updateTemplateData,
      loading: updateTemplateLoading,
      error: updateTemplateError,
    },
  ] = useMutation(UPDATE_TEMPLATE);

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
              { taskType: { equals: taskType } },
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

  const [
    createExternalTask,
    {
      data: externalTaskData,
      loading: externalTaskLoading,
      error: externalTaskError,
    },
  ] = useMutation(CREATE_EXTERNAL_TASK, {
    variables: inputs,
    refetchQueries: [
      {
        query: MY_TASKS,
        variables: { id: user?.id, taskType: taskType },
      },
    ],
  });

  async function handleSubmit() {
    if (inputs.isExternal) {
      // no need to create a template for external task
      await createExternalTask({
        variables: {
          collaborators:
            inputs?.collaborators?.map((col) => ({ id: col?.id })) || [],
        },
      });
    } else {
      // create a new template
      const template = await createTemplate({
        variables: {
          collaborators:
            inputs?.template?.collaborators?.map((col) => ({
              id: col?.id,
            })) || [],
          script: null,
          file: null,
        },
      });

      const { scriptAddress, fileAddress } = await UploadFile({
        name: template?.data?.createTemplate?.slug,
        script: inputs?.template?.script,
        file: inputs?.template?.file,
      });

      await updateTemplate({
        variables: {
          id: template?.data?.createTemplate?.id,
          collaborators: template?.data?.createTemplate?.collaborators.map(
            (col) => ({
              id: col?.id,
            })
          ),
          scriptAddress,
          fileAddress,
        },
      });

      // create a new task with connection to the new template
      await createTask({
        variables: {
          templateId: template?.data?.createTemplate?.id,
          collaborators:
            inputs?.collaborators?.map((col) => ({ id: col?.id })) || [],
          template: null,
        },
      });
    }
    redirect({ area });
  }

  return (
    <ComponentForm
      user={user}
      inputs={inputs}
      handleChange={handleChange}
      handleMultipleUpdate={handleMultipleUpdate}
      handleSubmit={handleSubmit}
      submitBtnName={t("common.create")}
      loading={templateLoading || taskLoading}
      error={templateError || taskError}
      isTemplateAuthor={true}
    />
  );
}
