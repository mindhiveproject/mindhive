import { useMutation } from "@apollo/client";

import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../lib/useForm";
import { runtimeAssetVariables } from "../../../lib/runtime/runtimeAsset";
import DisplayError from "../../ErrorMessage";

import { CREATE_TEMPLATE, UPDATE_TEMPLATE } from "../../Mutations/Template";
import { CREATE_TASK, CREATE_EXTERNAL_TASK } from "../../Mutations/Task";
import { MY_TASKS } from "../../Queries/Task";

import ComponentForm from "./Form";

import UploadFile from "./Template/UploadFile";
import { cleanI18nContent } from "../../../lib/i18nContent";

// Who may create jsPsych blocks (D10); Keystone checks the same on upload.
const JSPSYCH_ROLES = ["ADMIN", "TESTER"];

/**
 * Sends the zip to /api/runtime/upload/jspsych, which checks it and creates
 * the version. Returns the version, or null with the problems put back in
 * the form when the archive is refused.
 */
async function uploadJsPsychVersion({ jsPsych, fallbackTitle, onRefused }) {
  const { file } = jsPsych || {};
  const query = new URLSearchParams({
    title: jsPsych?.title || fallbackTitle || "",
    description: jsPsych?.description || "",
    filename: file.name,
  });
  const response = await fetch(`/api/runtime/upload/jspsych?${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/zip" },
    body: file,
  });
  const result = await response.json().catch(() => ({}));
  if (response.status === 422) {
    onRefused(result.problems || []);
    return null;
  }
  if (!response.ok) {
    throw new Error(result.error || "The experiment could not be uploaded.");
  }
  return result;
}

export default function AddComponent({ query, user, redirect, isExternal }) {
  const { area, runtime } = query;
  const taskType = area.slice(0, -1).toUpperCase();

  const { t } = useTranslation("classes");
  // Only "Create from a jsPsych experiment" (Develop → New → Task) opens
  // this page on jsPsych; every other entry is Lab.js.
  const isJsPsych =
    runtime === "jspsych" &&
    !isExternal &&
    (user?.permissions || []).some((role) =>
      JSPSYCH_ROLES.includes(role?.name)
    );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const { inputs, handleChange, handleMultipleUpdate, clearForm } = useForm({
    title: "",
    description: "",
    descriptionForParticipants: "",
    taskType,
    runtimeType: isJsPsych ? "JSPSYCH" : "LABJS",
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
    if (inputs.runtimeType === "JSPSYCH") {
      if (!inputs.jsPsych?.file) {
        setUploadError(
          new Error(
            t("create.jsPsychArchiveMissing", {}, {
              default: "Choose the experiment's zip file first.",
            })
          )
        );
        return;
      }
      setUploading(true);
      setUploadError(null);
      try {
        const version = await uploadJsPsychVersion({
          jsPsych: inputs.jsPsych,
          fallbackTitle: inputs.title,
          onRefused: (problems) =>
            handleMultipleUpdate({
              jsPsych: { ...inputs.jsPsych, problems },
            }),
        });
        if (!version) return;
        await createTask({
          variables: {
            ...runtimeAssetVariables({
              runtimeType: "JSPSYCH",
              jsPsychExperiment: { id: version.id },
            }),
            // A jsPsych experiment is always stored as a Task.
            taskType: "TASK",
            i18nContent: cleanI18nContent(inputs),
            collaborators:
              inputs?.collaborators?.map((col) => ({ id: col?.id })) || [],
            // Not GraphQL variables: the zip must not be uploaded twice.
            template: null,
            jsPsych: null,
          },
          // The list it lands on is Tasks, not this page's type.
          refetchQueries: [
            {
              query: MY_TASKS,
              variables: {
                where: {
                  AND: [
                    { taskType: { equals: "TASK" } },
                    {
                      OR: [
                        { author: { id: { equals: user?.id } } },
                        {
                          collaborators: { some: { id: { equals: user?.id } } },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        });
        redirect({ area: "tasks" });
      } catch (error) {
        setUploadError(error);
      } finally {
        setUploading(false);
      }
      return;
    }
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
          ...runtimeAssetVariables({
            runtimeType: "LABJS",
            templateId: template?.data?.createTemplate?.id,
          }),
          i18nContent: cleanI18nContent(inputs),
          collaborators:
            inputs?.collaborators?.map((col) => ({ id: col?.id })) || [],
          template: null,
          jsPsych: null,
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
      submitBtnName={t("create.newBlock")}
      loading={templateLoading || taskLoading || uploading}
      error={templateError || taskError || uploadError}
      isTemplateAuthor={true}
    />
  );
}
