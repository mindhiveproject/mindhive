import { useQuery } from "@apollo/client";
import { MY_TASKS } from "../../Queries/Task";
import TaskCard from "./TaskCard";

export default function DevelopTaskBank({ user, taskType }) {
  const { data, error, loading } = useQuery(MY_TASKS, {
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
