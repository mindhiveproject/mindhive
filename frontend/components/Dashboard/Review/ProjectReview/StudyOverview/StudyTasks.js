import { useEffect, useState } from "react";
import TaskBlock from "./Blocks/TaskBlock";
import { Popup } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { StyledTasksPreview } from "../../../../styles/StyledStudyPage";

export default function StudyTasks({ study }) {
  const { t } = useTranslation("builder");
  const flow = study?.flow || {};

  const [paths, setPaths] = useState([]);

  const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  };

  const selectCondition = ({ conditions }) => {
    const probabilities = conditions
      .map((condition, num) =>
        Array.from(`${num}`.repeat(parseInt(condition?.probability)))
      )
      .flat();
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
      });
      return getNextStep({
        stages,
        currentFlow,
        currentPosition: currentPosition + 1,
      });
    }

    // between-subjects conditions block
    if (currentStage?.type === "design") {
      const { conditionName, conditionLabel } = selectCondition({
        conditions: currentStage?.conditions,
      });
      stages.push({
        ...currentStage,
        type: "branching",
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

  const findPath = () => {
    const path = getNextStep({
      stages: [],
      currentFlow: flow,
      currentPosition: 0,
    });
    return path;
  };

  // get the study task
  useEffect(() => {
    function findPossiblePaths() {
      let paths = {};
      // simulate for 100 times
      for (let i = 0; i < 100; i++) {
        let path = findPath();
        paths[path?.map((p) => p?.testId).join("-")] = {
          frequency:
            paths[path?.map((p) => p?.testId).join("-")]?.frequency + 1 || 1,
          path: path,
          label: path
            ?.filter((p) => p?.type === "branching")
            .map((p) => p?.conditionLabel)
            .join("-"),
        };
      }
      setPaths(paths);
    }
    if (study) {
      findPossiblePaths();
    }
  }, [study]);

  if (Object.values(paths).length === 0) {
    return <p>{t("selector.studyDesign.noTasksFound")}</p>;
  }

  return (
    <StyledTasksPreview>
      <div className="studyTasksPreview">
        {Object.values(paths).map(({ frequency, path, label }) => (
          <div className="condition">
            {path?.filter((block) => block?.type === "task").length > 0 && (
              <div className="firstLine">
                <div>{label}</div>
                <Popup
                  content={t("selector.studyDesign.conditionProbabilityInfo")}
                  trigger={<div>{frequency}%</div>}
                  size="huge"
                />
              </div>
            )}

            <div className="taskBlocks">
              {path?.map((block) => {
                if (block?.type === "task") {
                  return <TaskBlock task={block} />;
                }
              })}
            </div>
          </div>
        ))}
      </div>
    </StyledTasksPreview>
  );
}
