import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../DesignSystem/Chip";
import InfoTooltip from "../../../../DesignSystem/InfoTooltip";
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

function buildPathSequence(path) {
  let taskStep = 0;
  const sequence = [];

  path?.forEach((block, blockIndex) => {
    if (block?.type === "branching") {
      sequence.push({
        kind: "branch",
        block,
        key: `branch-${block?.conditionLabel || blockIndex}-${blockIndex}`,
      });
      return;
    }
    if (block?.type === "task") {
      taskStep += 1;
      sequence.push({
        kind: "task",
        block,
        step: taskStep,
        key: block?.testId || `task-${blockIndex}`,
      });
    }
  });

  return sequence;
}

export default function StudyTasks({ study }) {
  const { t } = useTranslation("builder");
  const flow = study?.flow;
  const [paths, setPaths] = useState({});
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());

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
        setExpandedKeys(new Set());
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

      const firstKey = Object.entries(nextPaths)
        .filter(([, { path }]) => path?.some((block) => block?.type === "task"))
        .sort(([, a], [, b]) => b.frequency - a.frequency)[0]?.[0];
      setExpandedKeys(firstKey ? new Set([firstKey]) : new Set());
    }
    findPossiblePaths();
  }, [study]);

  const togglePath = (pathKey) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(pathKey)) {
        next.delete(pathKey);
      } else {
        next.add(pathKey);
      }
      return next;
    });
  };

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

  const sortedPaths = Object.entries(paths)
    .filter(([, { path }]) => path?.some((block) => block?.type === "task"))
    .sort(([, a], [, b]) => b.frequency - a.frequency)
    .map(([pathKey, value]) => ({ pathKey, ...value }));

  const probabilityInfo = t(
    "selector.studyDesign.conditionProbabilityInfo",
    {},
    {
      default:
        "The probability that a participant is in this between-subjects condition (based on a simulated run of the study for 100 times).",
    }
  );

  return (
    <StyledTasksPreview>
      <p className="studyFlowLegend">
        {t("studyFlow.preview.legend", {}, {
          default:
            "Simulated over 100 participant runs. Paths are sorted by how often they occur.",
        })}
      </p>
      <div className="studyTasksPreview">
        {sortedPaths.map(({ pathKey, frequency, path, label }, index) => {
          const displayLabel =
            label?.trim() ||
            t("studyFlow.preview.defaultPath", {}, {
              default: "Default path",
            });
          const isTourTarget = index === 0;
          const isExpanded = expandedKeys.has(pathKey);
          const sequence = buildPathSequence(path);
          const taskCount = sequence.filter(
            (item) => item.kind === "task"
          ).length;

          return (
            <div
              className={
                isExpanded ? "condition conditionExpanded" : "condition"
              }
              key={pathKey || `path-${index}`}
            >
              <div
                className="firstLine"
                id={isTourTarget ? "firstLine" : undefined}
              >
                <button
                  type="button"
                  className="conditionToggle"
                  aria-expanded={isExpanded}
                  aria-label={t(
                    isExpanded
                      ? "studyFlow.preview.collapseAria"
                      : "studyFlow.preview.expandAria",
                    { name: displayLabel },
                    {
                      default: isExpanded
                        ? "Collapse path {{name}}"
                        : "Expand path {{name}}",
                    }
                  )}
                  onClick={() => togglePath(pathKey)}
                >
                  <span
                    className={
                      isExpanded
                        ? "conditionChevron conditionChevronOpen"
                        : "conditionChevron"
                    }
                    aria-hidden="true"
                  >
                    <img
                      src="/assets/icons/builder/medium-chevron-down.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </span>
                  <h3 className="conditionLabel">{displayLabel}</h3>
                  {!isExpanded && (
                    <span className="taskCount">
                      {t(
                        "studyFlow.preview.taskCount",
                        { count: taskCount },
                        { default: "{{count}} tasks" }
                      )}
                    </span>
                  )}
                </button>
                <div className="probability">
                  <Chip
                    label={`${frequency}%`}
                    shape="pill"
                    style={{
                      height: 28,
                      fontSize: 12,
                      lineHeight: "16px",
                      paddingLeft: 10,
                      paddingRight: 10,
                    }}
                    ariaLabel={t(
                      "studyFlow.preview.probabilityAria",
                      { frequency },
                      { default: "{{frequency}} percent of simulated runs" }
                    )}
                  />
                  <InfoTooltip
                    content={probabilityInfo}
                    position="bottomRight"
                    portal
                    tooltipStyle={{ width: 280, fontSize: 14 }}
                  />
                </div>
              </div>

              {isExpanded && (
                <div
                  className="taskBlocks"
                  id={isTourTarget ? "taskBlocks" : undefined}
                >
                  {sequence.map((item) => {
                    if (item.kind === "branch") {
                      return (
                        <div className="branchStep" key={item.key}>
                          <span className="stepSpacer" aria-hidden="true" />
                          <Chip
                            label={item.block?.conditionLabel || ""}
                            leading={
                              <img
                                src="/assets/icons/builder/medium-branch.svg"
                                alt=""
                                width={20}
                                height={20}
                              />
                            }
                            shape="square"
                            style={{
                              height: 28,
                              fontSize: 14,
                              fontWeight: 500,
                              lineHeight: "16px",
                              width: "fit-content",
                            }}
                          />
                        </div>
                      );
                    }

                    return (
                      <div className="taskStep" key={item.key}>
                        <span className="stepNumber" aria-hidden="true">
                          {item.step}
                        </span>
                        <TaskBlock task={item.block} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </StyledTasksPreview>
  );
}
