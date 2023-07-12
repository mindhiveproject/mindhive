import { useQuery } from "@apollo/client";
import { MY_TASKS } from "../../Queries/Task";
import TaskCard from "./TaskCard";

export default function DevelopTaskBank({ user, taskType }) {
  const { data, error, loading } = useQuery(MY_TASKS, {
    variables: { id: user?.id, taskType },
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
        />
      ))}
    </div>
  );
}
