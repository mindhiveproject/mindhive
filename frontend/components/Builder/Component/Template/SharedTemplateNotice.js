import { useState } from "react";
import { useApolloClient, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import MessageCard from "../../../DesignSystem/MessageCard";
import { TEMPLATE_USAGE } from "../../../Queries/TaskShare";
import { MY_TASK } from "../../../Queries/Task";
import {
  FORK_TASK_TEMPLATE,
  SWITCH_TASK_TEMPLATE,
  DISCARD_TEMPLATE,
} from "../../../Mutations/TaskShare";

/**
 * On a template's page, for its authors: how many other people's tasks run
 * this template (shared copies, study copies), since changing its code or
 * files changes theirs too. Offers to give this task a brand-new template of
 * its own first, leaving everyone else on the current one.
 *
 * @param {object} task - The task being edited (`id`, `template { id }`).
 * @param {(template: object) => void} onForked - Gets the task's new template.
 */
export default function SharedTemplateNotice({ task, onForked }) {
  const { t } = useTranslation("builder");
  const client = useApolloClient();
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState(null);
  const [forked, setForked] = useState(false);

  const templateId = task?.template?.id;
  const { data, refetch } = useQuery(TEMPLATE_USAGE, {
    variables: { templateId },
    skip: !templateId,
    fetchPolicy: "network-only",
  });
  const usage = data?.templateUsage;

  const makeOwnTemplate = async () => {
    if (
      !window.confirm(
        t("templateShared.confirm", {}, {
          default:
            "Make a new template just for this task? It starts as a copy of the template as last saved, so save any changes first. Everyone else keeps the current template.",
        })
      )
    ) {
      return;
    }
    setWorking(true);
    setProblem(null);
    let newTemplateId = null;
    try {
      const { data: forkData } = await client.mutate({
        mutation: FORK_TASK_TEMPLATE,
        variables: { taskId: task.id },
      });
      const fork = forkData?.forkTaskTemplate;
      newTemplateId = fork?.templateId;
      if (!fork?.slug || !fork?.sourceSlug) {
        throw new Error("The new template could not be created.");
      }

      // The runtime loads a template's files by its slug, so they are copied
      // before the task moves to the new template.
      const res = await fetch("/api/templates/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: fork.sourceSlug, to: fork.slug }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "The template's files could not be copied.");
      }

      await client.mutate({
        mutation: SWITCH_TASK_TEMPLATE,
        variables: { taskId: task.id, templateId: fork.templateId },
      });
      newTemplateId = null; // in use now: keep it

      const { data: fresh } = await client.query({
        query: MY_TASK,
        variables: { id: task.id },
        fetchPolicy: "network-only",
      });
      setForked(true);
      onForked?.(fresh?.task?.template);
      refetch();
    } catch (error) {
      if (newTemplateId) {
        await client
          .mutate({ mutation: DISCARD_TEMPLATE, variables: { id: newTemplateId } })
          .catch(() => {});
      }
      setProblem(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          t("templateShared.error", {}, {
            default: "The template could not be copied. Please try again.",
          })
      );
    } finally {
      setWorking(false);
    }
  };

  if (forked) {
    return (
      <div style={{ margin: "16px 24px 0" }}>
        <MessageCard
          variant="success"
          message={t("templateShared.done", {}, {
            default:
              "This task now has its own template. Changes you make here only reach this task (and blocks in your studies that use it).",
          })}
        />
      </div>
    );
  }

  if (!usage?.otherTasks) return null;

  return (
    <div style={{ margin: "16px 24px 0", display: "grid", gap: 8 }}>
      <MessageCard
        variant="warning"
        message={
          <span style={{ display: "grid", gap: 12, justifyItems: "start" }}>
            <strong>
              {t("templateShared.title", {}, {
                default: "Other people's tasks run this template",
              })}
            </strong>
            <span>
              {t(
                "templateShared.message",
                {
                  tasks: t("templateShared.tasks", { count: usage.otherTasks }, {
                    default:
                      usage.otherTasks === 1 ? "1 task" : `${usage.otherTasks} tasks`,
                  }),
                  people: t("templateShared.people", { count: usage.otherPeople }, {
                    default:
                      usage.otherPeople === 1
                        ? "1 other person"
                        : `${usage.otherPeople} other people`,
                  }),
                },
                {
                  default:
                    "{{tasks}} by {{people}} run this template. Changing its code or files here changes their tasks too. If your changes are only for this task, make it its own template first.",
                }
              )}
            </span>
            <Button
              variant="outline"
              type="button"
              onClick={makeOwnTemplate}
              disabled={working}
            >
              {working
                ? t("templateShared.working", {}, { default: "Copying the template…" })
                : t("templateShared.action", {}, {
                    default: "Make a template just for this task",
                  })}
            </Button>
          </span>
        }
      />
      {problem && <MessageCard variant="warning" message={problem} />}
    </div>
  );
}
