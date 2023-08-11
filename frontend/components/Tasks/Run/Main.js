import { useQuery } from "@apollo/client";
import { TASK_TO_PARTICIPATE } from "../../Queries/Task";
import DynamicExperimentWindow from "../../Labjs/Run/Wrapper";

export default function TaskRun({ user, id }) {
  const { data, error, loading } = useQuery(TASK_TO_PARTICIPATE, {
    variables: { id },
  });

  const task = data?.task || undefined;

  if (task) {
    return <DynamicExperimentWindow user={user} task={task} />;
  }
}
