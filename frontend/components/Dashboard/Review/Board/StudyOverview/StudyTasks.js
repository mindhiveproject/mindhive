import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { Popup } from "semantic-ui-react";

import TaskBlock from "./Blocks/TaskBlock";
import { StyledTasksPreview } from "../../../../styles/StyledStudyPage";

function hasInterpretableFlow(flow) {
  return Array.isArray(flow) && flow.length > 0;
}

function pathsHaveTasks(paths) {
  return Object.values(paths).some(({ path }) =>
    path?.some((block) => block?.type === "task")
  );
}

export default function StudyTasks({ study }) {
  const { t } = useTranslation("builder");
  const flow = study?.flow;
  const [paths, setPaths] = useState({});

  const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
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
    return getNextStep({
      stages: [],
      currentFlow: flow,
      currentPosition: 0,
    });
  };

  useEffect(() => {
    function findPossiblePaths() {
      if (!hasInterpretableFlow(flow)) {
        setPaths({});
        return;
      }

      let nextPaths = {};
      for (let i = 0; i < 100; i++) {
        let path = findPath();
        const key = path?.map((p) => p?.testId).join("-") || "";
        nextPaths[key] = {
          frequency: nextPaths[key]?.frequency + 1 || 1,
          path: path,
          label: path
            ?.filter((p) => p?.type === "branching")
            .map((p) => p?.conditionLabel)
            .join("-"),
        };
      }
      setPaths(nextPaths);
    }
    findPossiblePaths();
  }, [study]);

  if (!hasInterpretableFlow(flow)) {
    return (
      <div className="studyFlowEmpty">
        <h3>
          {t("studyFlow.empty.title", {}, {
            default: "No study flow yet",
          })}
        </h3>
        <p>
          {t("studyFlow.empty.description", {}, {
            default:
              "Add blocks to the canvas and connect them to see how participants move through your study.",
          })}
        </p>
      </div>
    );
  }

  if (!pathsHaveTasks(paths)) {
    return (
      <div className="studyFlowEmpty">
        <h3>
          {t("studyFlow.noTasks.title", {}, {
            default: "No tasks in this flow",
          })}
        </h3>
        <p>
          {t("studyFlow.noTasks.description", {}, {
            default:
              "Connect tasks or surveys to your study flow to preview them here.",
          })}
        </p>
      </div>
    );
  }

  return (
    <StyledTasksPreview>
      <div className="studyTasksPreview">
        {Object.values(paths).map(({ frequency, path, label }, index) => (
          <div className="condition" key={label || `path-${index}`}>
            {path?.filter((block) => block?.type === "task").length > 0 && (
              <div className="firstLine" id="firstLine">
                <div>{label}</div>
                <Popup
                  content={t(
                    "selector.studyDesign.conditionProbabilityInfo",
                    {},
                    {
                      default:
                        "The probability that a participant is in this between-subjects condition (based on a simulated run of the study for 100 times).",
                    }
                  )}
                  trigger={<div>{frequency}%</div>}
                  size="huge"
                />
              </div>
            )}

            <div className="taskBlocks" id="taskBlocks">
              {path?.map((block, blockIndex) => {
                if (block?.type === "task") {
                  return (
                    <TaskBlock
                      key={block?.testId || `task-${blockIndex}`}
                      task={block}
                    />
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    </StyledTasksPreview>
  );
}
