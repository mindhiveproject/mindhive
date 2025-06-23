import { useQuery } from "@apollo/client";
import { PUBLIC_TASKS } from "../../Queries/Task";
import TaskCard from "./TaskCard";
import useTranslation from "next-translate/useTranslation";

import { StyledSelector } from "../../styles/StyledSelector";
import { StyledBank } from "../../styles/StyledBank";

export default function CloneTaskBank({ taskType }) {
  const { t } = useTranslation("builder");
  const { data, error, loading } = useQuery(PUBLIC_TASKS, {
    variables: {
      where: {
        taskType: { equals: taskType.toUpperCase() },
        public: { equals: true },
      },
    },
  });
  const tasks = data?.tasks || [];

  return (
    <StyledSelector>
      <div className="selectionBody">
        <div className="selectHeader">
          <h1>{t("cloneAndModify", { taskType })}</h1>
          <p>{t("selectWhichToClone", { taskType })}</p>
        </div>
        <StyledBank>
          {tasks.map((task) => (
            <TaskCard
              key={task?.id}
              task={task}
              url={`/builder/cloneof${task?.taskType?.toLowerCase()}/`}
              id="slug"
              name="selector"
            />
          ))}
        </StyledBank>
      </div>
    </StyledSelector>
  );
}
