import { useQuery } from "@apollo/client";
import { GET_USER_STUDIES } from "../../Queries/User";
import Manager from "./Manager";

import { StyledStudyRun } from "../../styles/StyledStudyPage";

// idea: have one landing page to run the study
// the function should check what is the status of the user (new, ongoing)
// and assign correct task to show
export default function RunStudy({ user, study }) {
  const { data: userData } = useQuery(GET_USER_STUDIES);

  const { flow } = study;
  const studiesInfo = userData?.authenticatedItem?.studiesInfo || {};
  let info = studiesInfo[study?.id];

  const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  };

  const selectCondition = ({ conditions }) => {
    // console.log({ conditions });
    // TODO select condition based on the probability
    const rand = getRandomInt(0, conditions?.length);

    return {
      conditionName: conditions[rand]?.name,
      conditionLabel: conditions[rand]?.label,
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

  // TODO locate where the user should be
  if (!info) {
    info = {};
    info.path = [];
    const nextSteps = getNextStep({
      stages: [],
      currentFlow: flow,
      currentPosition: 0,
    });
    info.path = info.path.concat(nextSteps);
  }

  // console.log({ info });

  return (
    <StyledStudyRun>
      <Manager
        user={user}
        study={study}
        studiesInfo={studiesInfo}
        info={info}
      />
    </StyledStudyRun>
  );
}
