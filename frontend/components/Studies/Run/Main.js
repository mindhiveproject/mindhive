import Manager from "./Manager";

import { StyledStudyRun } from "../../styles/StyledStudyPage";
import { useState, useEffect } from "react";

// have one landing page to run the study
// the function should check what is the status of the user (new, ongoing)
// and assign correct task to show
export default function RunStudy({ user, study, task, version }) {
  const { flow } = study;

  // recorded number of participants in each condition
  const components = study?.components || {};

  const studiesInfo = user?.studiesInfo || {};

  const userInfo = studiesInfo[study?.id]?.info;

  const [info, setInfo] = useState(userInfo);

  // initiate a new path if there is no information about the user path
  useEffect(() => {
    async function initiateUserPath() {
      const nextStep = getNextStep({
        stages: [],
        currentFlow: flow,
        currentPosition: 0,
      });
      if (nextStep) {
        const updatedInfo = {
          ...info,
          path: nextStep,
        };
        setInfo(updatedInfo);
      }
    }
    if (!info || info?.path.length === 0) {
      initiateUserPath();
    }
  }, [user, study]);

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

  const getNextStep = ({ stages, currentFlow, currentPosition }) => {
    if (!currentFlow || currentFlow.length === 0) {
      return stages;
    }

    const currentStage = currentFlow[currentPosition];
    if (!currentStage) {
      return stages;
    }

    // registration
    if (currentStage?.type === "my-anchor") {
      stages.push({
        ...currentStage,
        type: "registration",
        timestampFinished: Date.now(),
      });
      return getNextStep({
        stages,
        currentFlow,
        currentPosition: 1,
      });
    }

    // task
    if (currentStage?.type === "my-node") {
      stages.push({
        ...currentStage,
        type: "task",
        timestampStarted: Date.now(),
      });
      return stages;
    }

    // between-subjects conditions block
    if (currentStage?.type === "design") {
      const { conditionName, conditionLabel } = selectCondition({
        conditions: currentStage?.conditions,
      });
      stages.push({
        ...currentStage,
        type: "branching",
        timestampRun: Date.now(),
        conditionName,
        conditionLabel,
      });
      const [branchedFlow] = currentStage?.conditions
        .filter((c) => c?.label === conditionLabel)
        .map((c) => c.flow);
      return getNextStep({
        stages,
        currentFlow: branchedFlow,
        currentPosition: 0,
      });
    }
  };

  // find any updates in the current structure of the study
  let blockWithNextTask = [];
  const findTask = ({ taskId, flow }) => {
    for (let stage of flow) {
      if (stage?.type === "my-node") {
        if (stage?.id === taskId) {
          if (blockWithNextTask.length === 0) {
            blockWithNextTask.push(...flow);
          }
        }
      }
      if (stage?.type === "design") {
        stage?.conditions?.forEach((condition) => {
          findTask({
            taskId: taskId,
            flow: condition?.flow,
          });
        });
      }
    }
  };
  const comparePathWithFlow = ({ path, flow }) => {
    let nextBlocks = [];
    const lastTaskId = path[path?.length - 2]?.id;
    // search for the lastTaskId in the study flow
    findTask({
      taskId: lastTaskId,
      flow: flow,
    });
    // get the index of the lastTaskId
    const indexLastTask = blockWithNextTask
      .map((task) => task?.id)
      .indexOf(lastTaskId);
    if (blockWithNextTask[indexLastTask + 1]) {
      const nextBlock = blockWithNextTask[indexLastTask + 1];
      if (nextBlock?.type === "design") {
        // assign condition
        const { conditionName, conditionLabel } = selectCondition({
          conditions: nextBlock?.conditions,
        });
        nextBlocks = [
          {
            ...nextBlock,
            type: "branching",
            timestampRun: Date.now(),
            conditionName,
            conditionLabel,
          },
        ];
        const [branchedFlow] = nextBlock?.conditions
          .filter((c) => c?.label === conditionLabel)
          .map((c) => c.flow);
        const remainingSteps = [];
        getNextStep({
          stages: remainingSteps,
          currentFlow: branchedFlow,
          currentPosition: 0,
        });
        nextBlocks = nextBlocks.concat(remainingSteps);
      } else {
        nextBlocks = nextBlocks.concat(nextBlock);
      }
    }
    return nextBlocks;
  };

  // if there there is a path already exists and the users does not repeat a task
  if (info && info?.path && !task) {
    const { path } = info;
    const nextTaskType = path[path?.length - 1]?.type;
    // if there is an update and a new task or between-subjects branching appeared after end
    // it should be added to the path
    if (nextTaskType === "end") {
      const nextSteps = comparePathWithFlow({ path: path, flow: study?.flow });
      if (nextSteps.length) {
        const updatedInfo = {
          ...info,
          path: info.path.concat(nextSteps),
        };
        setInfo(updatedInfo);
      }
    }
  }

  return (
    <StyledStudyRun>
      {info && user && (
        <Manager
          user={user}
          study={study}
          task={task}
          version={version}
          studiesInfo={studiesInfo}
          info={info}
        />
      )}
    </StyledStudyRun>
  );
}
