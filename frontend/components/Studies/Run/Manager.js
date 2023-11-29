import { useState } from "react";
import TaskRun from "../../Tasks/Run/Main";
import Prompt from "./Prompt/Main";

export default function Manager({
  user,
  study,
  task,
  version,
  studiesInfo,
  info,
}) {
  const { path } = info;
  const currentStep = path[path.length - 1];

  const [page, setPage] = useState("test"); // two pages: test and post
  const [token, setToken] = useState(undefined); // token is used to find saved data in the dataset to modify them if needed
  const [nextStep, setNextStep] = useState(undefined); // next task for participant

  const closePrompt = () => {
    setPage(undefined);
  };

  const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  };

  const selectCondition = ({ conditions }) => {
    // select condition based on the probability
    const rand = getRandomInt(0, conditions?.length);
    return conditions[rand]?.label;
  };

  const getNextStep = ({ currentFlow, currentPosition, path, nextStep }) => {
    if (!currentFlow || currentFlow.length === 0) {
      return nextStep;
    }

    const currentStage = currentFlow[currentPosition];
    if (!currentStage) {
      return nextStep;
    }

    // registration
    if (currentStage?.type === "my-anchor") {
      return getNextStep({
        currentFlow,
        currentPosition: 1,
        path,
        nextStep,
      });
    }

    // task
    if (currentStage?.type === "my-node") {
      // check whether the task is completed or not (is in the path or not)
      const isInPath = path.map((step) => step?.id).includes(currentStage?.id);

      if (isInPath) {
        // continue searching
        return getNextStep({
          currentFlow,
          currentPosition: currentPosition + 1,
          path,
          nextStep,
        });
      } else {
        return currentStage;
      }
    }

    // between-subjects conditions block
    if (currentStage?.type === "design") {
      // check whether the assignment to a condition is completed or not (is in the path or not)
      const isInPath = path.map((step) => step?.id).includes(currentStage?.id);
      let conditionLabel;
      if (isInPath) {
        // continue searching inside of the condition branch
        conditionLabel = path
          .filter((step) => step?.id === currentStage?.id)
          .map((step) => step?.conditionLabel)[0];
      } else {
        // choose condition
        conditionLabel = selectCondition({
          conditions: currentStage?.conditions,
        });
      }
      const [branchedFlow] = currentStage?.conditions
        .filter((c) => c?.label === conditionLabel)
        .map((c) => c.flow);
      return getNextStep({
        currentFlow: branchedFlow,
        currentPosition: 0,
        path,
        nextStep,
      });
    }
  };

  const findNextStep = () => {
    const { flow } = study;

    const nextStep = getNextStep({
      currentFlow: flow,
      currentPosition: 0,
      path,
      nextStep: undefined,
    });

    return nextStep;
  };

  const onTaskFinish = ({ token }) => {
    if (task) {
      // if a task was retaken, redirect to the main study page without prompt after the task
      const redirectPage =
        user.type === "GUEST"
          ? `/studies/${study?.slug}?guest=${user?.publicId}`
          : `/dashboard/discover/studies?name=${study?.slug}`;
      window.location = redirectPage;
    } else {
      setPage("post");
      setToken(token);
      // find the next task
      setNextStep(findNextStep());
    }
  };

  if (page === "test") {
    return (
      <TaskRun
        user={user}
        study={study}
        id={task || currentStep?.componentID}
        testVersion={version || currentStep?.testId}
        onFinish={onTaskFinish}
        isSavingData
      />
    );
  }

  if (page === "post") {
    return (
      <Prompt
        user={user}
        study={study}
        studiesInfo={studiesInfo}
        info={info}
        nextStep={nextStep}
        closePrompt={closePrompt}
        token={token}
      />
    );
  }
}
