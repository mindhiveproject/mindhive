import { useQuery } from "@apollo/client";
import { TASK_TO_PARTICIPATE } from "../../Queries/Task";
import DynamicExperimentWindow from "../../Labjs/Run/Wrapper";

import Labjs from "../../Global/Labjs";

export default function TaskRun({ user, study, id, onFinish, isSavingData }) {
  const { data, error, loading } = useQuery(TASK_TO_PARTICIPATE, {
    variables: { id },
  });

  const task = data?.task || undefined;

  if (task) {
    return (
      <Labjs>
        <DynamicExperimentWindow
          user={user}
          study={study}
          task={task}
          onFinish={onFinish}
          isSavingData={isSavingData}
        />
      </Labjs>
    );
  }
}
