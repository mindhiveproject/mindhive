import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";

import TaskRun from "../../Tasks/Run/Main";
import Prompt from "./Prompt/Main";

import { UPDATE_USER_STUDY_INFO } from "../../Mutations/User";
import { UPDATE_GUEST_STUDY_INFO } from "../../Mutations/Guest";
import { UPDATE_STUDY } from "../../Mutations/Study";

import { CURRENT_USER_QUERY } from "../../Queries/User";
import { GET_GUEST } from "../../Queries/Guest";
import { STUDY_COMPONENTS } from "../../Queries/Study";

export default function Manager({
  user,
  study,
  task,
  version,
  studiesInfo,
  info,
}) {
  // get the latest state of components (participants' conditions) with a query
  const { data: studyComponentsData } = useQuery(STUDY_COMPONENTS, {
    variables: { studyId: study?.id },
  });
  const components = { ...studyComponentsData?.study?.components } || {};

  const { path } = info;
  const [currentStep, setCurrentStep] = useState({});

  // find out the current step
  useEffect(() => {
    async function findCurrentStep() {
      if (task && version) {
        let step = {};
        const steps =
          path.filter(
            (step) => step?.componentID === task && step?.testId === version
          ) || [];
        if (steps.length) {
          step = steps[0];
        }
        setCurrentStep(step);
      } else {
        setCurrentStep(path[path.length - 1]);
      }
    }
    if (info) {
      findCurrentStep();
    }
  }, [info]);

  const [page, setPage] = useState("test"); // two pages: test and post
  const [token, setToken] = useState(undefined); // token is used to find saved data in the dataset to modify them if needed
  const [nextStep, setNextStep] = useState(undefined); // next task for participant

  const [updateUserStudyInfo] = useMutation(UPDATE_USER_STUDY_INFO, {
    variables: { id: user?.id },
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const [updateGuestStudyInfo] = useMutation(UPDATE_GUEST_STUDY_INFO, {
    variables: { id: user?.id },
    refetchQueries: [
      { query: GET_GUEST, variables: { publicId: user?.publicId } },
    ],
  });

  const [
    updateStudyConditionsInfo,
    { data: studyData, loading: studyLoading, error: studyError },
  ] = useMutation(UPDATE_STUDY, {
    refetchQueries: [
      { query: STUDY_COMPONENTS, variables: { studyId: study?.id } },
    ],
  });

  const closePrompt = () => {
    setPage(undefined);
  };

  const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  };

  const selectCondition = ({ conditions }) => {
    let probabilities = conditions
      .map((condition, num) => {
        const placesTaken = components[condition?.label] || 0;
        let placesLeft =
          parseInt(condition?.probability) - parseInt(placesTaken);
        if (placesLeft < 0) placesLeft = 0;
        return Array.from(`${num}`.repeat(placesLeft));
      })
      .flat();

    let multiplier = 2;
    while (probabilities?.length === 0) {
      probabilities = conditions
        .map((condition, num) => {
          const placesTaken = components[condition?.label] || 0;
          let placesLeft =
            parseInt(condition?.probability * multiplier) -
            parseInt(placesTaken);
          if (placesLeft < 0) placesLeft = 0;
          return Array.from(`${num}`.repeat(placesLeft));
        })
        .flat();
      multiplier++;
    }

    const rand = getRandomInt(0, probabilities.length);
    const conditionNumber = parseInt(probabilities[rand]);
    return {
      conditionName: conditions[conditionNumber]?.name,
      conditionLabel: conditions[conditionNumber]?.label,
    };
  };

  const getNextSteps = ({ currentFlow, currentPosition, path, nextSteps }) => {
    if (!currentFlow || currentFlow.length === 0) {
      return nextSteps;
    }

    const currentStage = currentFlow[currentPosition];
    if (!currentStage) {
      return nextSteps;
    }

    // registration
    if (currentStage?.type === "my-anchor") {
      return getNextSteps({
        currentFlow,
        currentPosition: 1,
        path,
        nextSteps,
      });
    }

    // task
    if (currentStage?.type === "my-node") {
      // check whether the task is completed or not (is in the path or not)
      if (path.map((step) => step?.id).includes(currentStage?.id)) {
        // continue searching
        return getNextSteps({
          currentFlow,
          currentPosition: currentPosition + 1,
          path,
          nextSteps,
        });
      } else {
        nextSteps.push({
          ...currentStage,
          type: "task",
          timestampAssigned: Date.now(),
        });
        return nextSteps;
      }
    }

    // between-subjects conditions block
    if (currentStage?.type === "design") {
      // check whether the assignment to a condition is completed or not (is in the path or not)
      let label;
      if (path.map((step) => step?.id).includes(currentStage?.id)) {
        // continue searching inside of the condition branch
        label = path
          .filter((step) => step?.id === currentStage?.id)
          .map((step) => step?.conditionLabel)[0];
      } else {
        const { conditionName, conditionLabel } = selectCondition({
          conditions: currentStage?.conditions,
        });
        label = conditionLabel;
        nextSteps.push({
          ...currentStage,
          type: "branching",
          timestampRun: Date.now(),
          conditionName,
          conditionLabel,
        });
      }
      const [branchedFlow] = currentStage?.conditions
        .filter((c) => c?.label === label)
        .map((c) => c.flow);
      return getNextSteps({
        currentFlow: branchedFlow,
        currentPosition: 0,
        path,
        nextSteps,
      });
    }
  };

  const findNextSteps = () => {
    const { flow } = study;

    const nextSteps = getNextSteps({
      currentFlow: flow,
      currentPosition: 0,
      path,
      nextSteps: [],
    });

    return nextSteps;
  };

  const onTaskFinish = async ({ token, currentStep, isTaskRetaken }) => {
    let updatedPath = path.map((step) => {
      if (step?.id === currentStep?.id) {
        if (isTaskRetaken) {
          return {
            ...step,
            timestampsRetakeFinished: step?.timestampsRetakeFinished?.length
              ? step?.timestampsRetakeFinished.concat(Date.now())
              : [Date.now()],
          };
        } else {
          return {
            ...step,
            finished: true,
            timestampFinished: Date.now(),
          };
        }
      } else {
        return step;
      }
    });

    // if the task is not retaken, try to find next steps
    if (!isTaskRetaken) {
      // find the next task
      const nextSteps = findNextSteps();
      // update the path with the information about the next task
      if (nextSteps.length > 0) {
        setNextStep(nextSteps[nextSteps.length - 1]);
        updatedPath = updatedPath.concat(nextSteps);
      } else {
        setNextStep(undefined);
        updatedPath = updatedPath.concat({ type: "end" });
        // update the study information with the condition name(s) that was used for this participant
        const takenConditions = updatedPath
          .filter((stage) => stage?.type === "branching")
          .map((stage) => stage?.conditionLabel);
        if (takenConditions?.length) {
          takenConditions.map((taken) => {
            components[taken] = components[taken] + 1 || 1;
          });
          // save study info
          await updateStudyConditionsInfo({
            variables: {
              id: study?.id,
              input: {
                components,
              },
            },
          });
        }
      }
    }

    // update user information
    const updatedStudiesInfo = {
      ...studiesInfo,
      [study?.id]: {
        ...studiesInfo[study?.id],
        info: { path: updatedPath },
      },
    };
    if (user.type === "GUEST") {
      await updateGuestStudyInfo({
        variables: { studiesInfo: updatedStudiesInfo },
      });
    } else {
      await updateUserStudyInfo({
        variables: { studiesInfo: updatedStudiesInfo },
      });
    }

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
    }
  };

  if (page === "test" && (task || currentStep?.componentID)) {
    return (
      <TaskRun
        user={user}
        study={study}
        id={task || currentStep?.componentID}
        testVersion={version || currentStep?.testId}
        currentStep={currentStep}
        isTaskRetaken={task && version}
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
        currentStep={currentStep}
        nextStep={nextStep}
        closePrompt={closePrompt}
        token={token}
      />
    );
  }
}
