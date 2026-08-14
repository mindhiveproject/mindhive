import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { MY_TASKS } from "../../Queries/Task";
import TaskCard from "./TaskCard";
import MessageCard from "../../DesignSystem/MessageCard";

const EMPTY_MESSAGE_BY_TYPE = {
  TASK: {
    key: "developTasks.emptyTask",
    default: "No tasks to show.",
  },
  SURVEY: {
    key: "developTasks.emptySurvey",
    default: "No surveys to show.",
  },
  BLOCK: {
    key: "developTasks.emptyBlock",
    default: "No blocks to show.",
  },
};

export default function DevelopTaskBank({ user, taskType }) {
  const { t } = useTranslation("builder");
  const { data } = useQuery(MY_TASKS, {
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
  });
  const tasks = data?.tasks || [];
  const emptyCopy =
    EMPTY_MESSAGE_BY_TYPE[taskType] || EMPTY_MESSAGE_BY_TYPE.TASK;

  if (tasks.length === 0) {
    return (
      <MessageCard
        variant="neutral"
        message={t(emptyCopy.key, {}, { default: emptyCopy.default })}
        style={{ marginTop: "24px" }}
      />
    );
  }

  return (
    <div className="cardBoard">
      {tasks.map((task) => (
        <TaskCard
          key={task?.id}
          task={task}
          url={`/builder/${taskType?.toLowerCase()}s/`}
          id="id"
          name="selector"
          domain="develop"
        />
      ))}
    </div>
  );
}
