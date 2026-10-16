// Add/SimulatedSourceConfig.js
import { useState } from "react";
import clsx from "clsx";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../../DesignSystem/Chip";
import IconButton from "../../../../../DesignSystem/IconButton";
import TaskBlock from "../../../../../Dashboard/Review/Board/StudyOverview/Blocks/TaskBlock";
import {
  MAX_SIMULATED_PARTICIPANTS,
  SIMULATION_MODE_PARAMS,
  defaultSimulationSetting,
  simulationVariableKey,
  validateSimulationSetting,
} from "../../../../../../lib/simulateStudyDataset";
import SimulationModeModal from "./SimulationModeModal";
import { useSimulationModeCopy } from "./simulationModeCopy";
import { StyledSimulatedConfig } from "./StyledSimulated";

const PREFIX = "dataJournal.datasetForm.simulated";

const PARAM_COLUMN = { mean: 1, sd: 2, min: 3, max: 4 };

function VariableRow({ node, variable, setting, onChange, onOpenSettings }) {
  const { t } = useTranslation("builder");
  const copy = useSimulationModeCopy();
  const errorKey = validateSimulationSetting(setting);
  const params = SIMULATION_MODE_PARAMS[setting.mode] || SIMULATION_MODE_PARAMS.normal;

  const handleParam = (param) => (e) =>
    onChange({ ...setting, [param]: e.target.value });

  return (
    <div>
      <div className={clsx("simulatedVariableRow", errorKey && "hasError")}>
        <div className="simulatedVariableName" title={variable.varDesc || undefined}>
          <span className="MH-Type-Label-Base">{variable.varName}</span>
          <span className="MH-Type-Body-Base simulatedVariableMode">
            {copy.modes[setting.mode]?.label}
          </span>
        </div>
        <div className="simulatedParams">
          {params.map((param) => (
            <label
              key={param}
              className="MH-Type-Body-Base simulatedParam"
              style={{ gridColumn: PARAM_COLUMN[param] }}
            >
              <span title={copy.params[param]}>{copy.params[param]}</span>
              <input
                type="number"
                step={setting.mode === "integer" ? 1 : "any"}
                min={param === "sd" ? 0 : undefined}
                value={setting[param] ?? ""}
                onChange={handleParam(param)}
                aria-label={`${variable.varName} — ${copy.params[param]}`}
              />
            </label>
          ))}
        </div>
        <IconButton
          variant="neutral"
          icon={<img src="/assets/icons/settings.svg" alt="" width={24} height={24} />}
          ariaLabel={t(`${PREFIX}.modeSettingsAria`, { name: variable.varName }, {
            default: "Simulation mode for {{name}}",
          })}
          title={t(`${PREFIX}.modeSettings`, {}, { default: "Simulation mode" })}
          onClick={() => onOpenSettings(node, variable)}
        />
      </div>
      {errorKey && (
        <p className="MH-Type-Body-Base simulationError">{copy.errors[errorKey]}</p>
      )}
    </div>
  );
}

function FlowSequence({ flow, variablesByTaskId, getSetting, setSetting, onOpenSettings }) {
  const { t } = useTranslation("builder");

  return (flow || []).map((stage, index) => {
    if (stage?.type === "my-node") {
      const variables = variablesByTaskId[stage.componentID] || [];
      return (
        <TaskBlock key={stage.id || index} task={stage} showPreview={false}>
          {variables.length > 0 ? (
            <div className="simulatedVariables">
              {variables.map((variable) => (
                <VariableRow
                  key={variable.varName}
                  node={stage}
                  variable={variable}
                  setting={getSetting(stage, variable)}
                  onChange={(next) => setSetting(stage, variable, next)}
                  onOpenSettings={onOpenSettings}
                />
              ))}
            </div>
          ) : (
            <p className="MH-Type-Body-Base simulatedNoVariables">
              {t(`${PREFIX}.noVariables`, {}, {
                default: "This block has no key variables to simulate.",
              })}
            </p>
          )}
        </TaskBlock>
      );
    }

    if (stage?.type === "design") {
      return (
        <div className="simulatedFlow" key={stage.id || index}>
          {(stage.conditions || []).map((condition, conditionIndex) => (
            <div className="simulatedBranch" key={condition?.label || conditionIndex}>
              <div className="simulatedConditionHeader">
                <Chip
                  variant="static"
                  tone="neutral"
                  label={condition?.label || condition?.name || ""}
                  leading={
                    <img
                      src="/assets/icons/builder/medium-branch.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                  }
                />
                {condition?.probability != null && condition?.probability !== "" && (
                  <span className="MH-Type-Body-Base simulatedHint">
                    {t(`${PREFIX}.conditionProbability`, {
                      probability: condition.probability,
                    }, { default: "{{probability}}% of participants" })}
                  </span>
                )}
              </div>
              <FlowSequence
                flow={condition?.flow}
                variablesByTaskId={variablesByTaskId}
                getSetting={getSetting}
                setSetting={setSetting}
                onOpenSettings={onOpenSettings}
              />
            </div>
          ))}
        </div>
      );
    }

    return null;
  });
}

export default function SimulatedSourceConfig({ source, config, onConfigChange }) {
  const { t } = useTranslation("builder");
  const [modalTarget, setModalTarget] = useState(null);
  const { study, flow, isLocked, variablesByTaskId, loading, error } = source;

  const getSetting = (node, variable) =>
    config.variables[simulationVariableKey(node.id, variable.varName)] ||
    defaultSimulationSetting();

  const setSetting = (node, variable, next) =>
    onConfigChange({
      ...config,
      variables: {
        ...config.variables,
        [simulationVariableKey(node.id, variable.varName)]: next,
      },
    });

  if (loading) {
    return (
      <p className="MH-Type-Body-Base">
        {t(`${PREFIX}.loading`, {}, { default: "Loading study flow…" })}
      </p>
    );
  }
  if (error) {
    return (
      <p className="MH-Type-Body-Base" style={{ color: "#c53030" }}>
        {t("dataJournal.datasetForm.errorLoadingStudy", {}, {
          default: "Error loading study:",
        })}{" "}
        {error.message}
      </p>
    );
  }

  const hasTasks = (flow || []).some(
    (stage) => stage?.type === "my-node" || stage?.type === "design",
  );

  return (
    <StyledSimulatedConfig>
      <div className="simulatedStudyHeader">
        <span className="MH-Type-Label-Large">{study?.title}</span>
        <Chip
          variant="static"
          tone={isLocked ? "success" : "warning"}
          label={
            isLocked
              ? t(`${PREFIX}.locked`, {}, { default: "Locked" })
              : t(`${PREFIX}.unlocked`, {}, { default: "Not locked" })
          }
        />
      </div>
      <p className="MH-Type-Body-Base simulatedHint">
        {isLocked
          ? t(`${PREFIX}.lockedHint`, {}, {
              default:
                "Data collection was submitted, so the study design will not change.",
            })
          : t(`${PREFIX}.unlockedHint`, {}, {
              default:
                "The study design can still change; regenerate the simulated data if it does.",
            })}
      </p>

      <label className="MH-Type-Label-Base simulatedParticipants">
        {t(`${PREFIX}.participants`, {}, { default: "Number of participants" })}
        <input
          className="MH-Type-Body-Base"
          type="number"
          min={1}
          max={MAX_SIMULATED_PARTICIPANTS}
          step={1}
          value={config.participants}
          onChange={(e) =>
            onConfigChange({ ...config, participants: e.target.value })
          }
        />
      </label>

      {hasTasks ? (
        <div className="simulatedFlow">
          <FlowSequence
            flow={flow}
            variablesByTaskId={variablesByTaskId}
            getSetting={getSetting}
            setSetting={setSetting}
            onOpenSettings={(node, variable) => setModalTarget({ node, variable })}
          />
        </div>
      ) : (
        <p className="MH-Type-Body-Base simulatedHint">
          {t(`${PREFIX}.emptyFlow`, {}, {
            default: "This study has no blocks in its flow yet.",
          })}
        </p>
      )}

      {modalTarget && (
        <SimulationModeModal
          key={simulationVariableKey(modalTarget.node.id, modalTarget.variable.varName)}
          variableName={modalTarget.variable.varName}
          blockName={modalTarget.node.name}
          blockVariableCount={
            (variablesByTaskId[modalTarget.node.componentID] || []).length
          }
          setting={getSetting(modalTarget.node, modalTarget.variable)}
          onClose={() => setModalTarget(null)}
          onSave={(next, applyToBlock) => {
            const targets = applyToBlock
              ? variablesByTaskId[modalTarget.node.componentID] || []
              : [modalTarget.variable];
            const nextVariables = { ...config.variables };
            targets.forEach((variable) => {
              nextVariables[
                simulationVariableKey(modalTarget.node.id, variable.varName)
              ] = { ...next };
            });
            onConfigChange({ ...config, variables: nextVariables });
            setModalTarget(null);
          }}
        />
      )}
    </StyledSimulatedConfig>
  );
}
