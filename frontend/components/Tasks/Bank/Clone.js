import { useQuery } from "@apollo/client";
import { PUBLIC_TASKS } from "../../Queries/Task";
import TaskCard from "./TaskCard";

import { StyledSelector } from "../../styles/StyledSelector";
import { StyledBank } from "../../styles/StyledBank";

export default function CloneTaskBank({ taskType }) {
  const { data, error, loading } = useQuery(PUBLIC_TASKS, {
    variables: {
      where: { taskType: { equals: taskType.toUpperCase() } },
    },
  });
  const tasks = data?.tasks || [];

  return (
    <StyledSelector>
      <div className="selectionBody">
        <div className="selectHeader">
          <h1>Clone & modify a {taskType}</h1>
          <p>Select which {taskType} you would like to clone below.</p>
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
