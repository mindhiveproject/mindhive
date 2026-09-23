import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { TASK_TO_PARTICIPATE } from "../../Queries/Task";
import DynamicExperimentWindow from "../../Labjs/Run/Wrapper";

import Labjs from "../../Global/Labjs";

export default function TaskRun({
  user,
  study,
  id,
  testVersion,
  currentStep,
  isTaskRetaken,
  onFinish,
  isSavingData,
}) {
  const { data, error, loading } = useQuery(TASK_TO_PARTICIPATE, {
    variables: { id },
  });

  const task = data?.task || undefined;
  const [script, setScript] = useState(undefined);

  // populate task with script
  useEffect(() => {
    async function fetchFile() {
      const url = `/api/templates/${task?.template?.slug}/script`;
      const res = await fetch(url);
      const data = await res.text();
      setScript(data);
    }
    if (task) {
      fetchFile();
    }
  }, [task]);

  if (task && script) {
    return (
      <Labjs>
        <DynamicExperimentWindow
          user={user}
          study={study}
          task={{ ...task, template: { ...task.template, script } }}
          testVersion={testVersion}
          currentStep={currentStep}
          isTaskRetaken={isTaskRetaken}
          onFinish={onFinish}
          isSavingData={isSavingData}
        />
      </Labjs>
    );
  }
}
