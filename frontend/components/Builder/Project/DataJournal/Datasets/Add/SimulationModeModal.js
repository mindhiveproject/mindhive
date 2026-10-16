// Add/SimulationModeModal.js
import { useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../../DesignSystem/Button";
import ButtonGroup from "../../../../../DesignSystem/ButtonGroup";
import Modal from "../../../../../DesignSystem/Modal";
import {
  SIMULATION_MODES,
  SIMULATION_MODE_PARAMS,
  previewSimulationSetting,
  switchSimulationMode,
  validateSimulationSetting,
} from "../../../../../../lib/simulateStudyDataset";
import { useSimulationModeCopy } from "./simulationModeCopy";
import { StyledSimulationModeModal } from "./StyledSimulated";

const PREFIX = "dataJournal.datasetForm.simulated.modal";
const PREVIEW_DRAWS = 1000;

export default function SimulationModeModal({
  variableName,
  blockName,
  blockVariableCount,
  setting,
  onClose,
  onSave,
}) {
  const { t } = useTranslation("builder");
  const copy = useSimulationModeCopy();
  const [draft, setDraft] = useState(setting);
  const [applyToBlock, setApplyToBlock] = useState(false);

  const errorKey = validateSimulationSetting(draft);
  const preview = useMemo(
    () => previewSimulationSetting(draft, { draws: PREVIEW_DRAWS }),
    [draft],
  );
  const peak = preview ? Math.max(...preview.bins, 1) : 1;

  const handleParamChange = (param) => (e) => {
    setDraft((prev) => ({ ...prev, [param]: e.target.value }));
  };

  const handleSave = () => {
    if (errorKey) return;
    onSave(draft, applyToBlock);
  };

  return (
    <Modal
      open
      onClose={onClose}
      maxWidth={600}
      title={t(
        `${PREFIX}.title`,
        { name: variableName },
        { default: "How should {{name}} be simulated?" },
      )}
      actions={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            {t("dataJournal.datasetForm.actions.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button
            variant="filled"
            type="button"
            onClick={handleSave}
            disabled={Boolean(errorKey)}
          >
            {t(`${PREFIX}.apply`, {}, { default: "Apply" })}
          </Button>
        </>
      }
    >
      <StyledSimulationModeModal>
        <ButtonGroup
          fullWidth
          size="XSmall"
          aria-label={t(`${PREFIX}.modeLabel`, {}, { default: "Mode" })}
          items={SIMULATION_MODES.map((mode) => ({
            value: mode,
            label: copy.modes[mode].shortLabel,
          }))}
          value={draft.mode}
          onChange={(mode) => setDraft((prev) => switchSimulationMode(prev, mode))}
        />
        <p className="MH-Type-Body-Base simulationModeModalDescription">
          {copy.modes[draft.mode]?.description}
        </p>

        <div
          className="simulationModeModalParams"
          style={{
            gridTemplateColumns: `repeat(${SIMULATION_MODE_PARAMS[draft.mode].length}, minmax(0, 1fr))`,
          }}
        >
          {SIMULATION_MODE_PARAMS[draft.mode].map((param) => (
            <label key={param} className="MH-Type-Label-Base">
              {copy.params[param]}
              <input
                className="MH-Type-Body-Base"
                type="number"
                step={draft.mode === "integer" ? 1 : "any"}
                min={param === "sd" ? 0 : undefined}
                value={draft[param] ?? ""}
                onChange={handleParamChange(param)}
              />
            </label>
          ))}
        </div>

        {errorKey && (
          <p className="MH-Type-Body-Base simulationError">{copy.errors[errorKey]}</p>
        )}

        <section className="simulationPreview" aria-live="polite">
          <div className="simulationPreviewHeader MH-Type-Label-Base">
            {t(`${PREFIX}.previewTitle`, { count: PREVIEW_DRAWS }, {
              default: "Preview of {{count}} draws",
            })}
          </div>
          {preview ? (
            <>
              <div className="simulationPreviewChart" aria-hidden="true">
                {preview.bins.map((count, index) => (
                  <span
                    key={index}
                    className="simulationPreviewBar"
                    style={{ height: `${(count / peak) * 100}%` }}
                  />
                ))}
              </div>
              <div className="simulationPreviewAxis MH-Type-Body-Base">
                <span>{draft.min}</span>
                <span>{draft.max}</span>
              </div>
              <p className="MH-Type-Body-Base simulationPreviewStats">
                {t(`${PREFIX}.previewStats`, preview, {
                  default:
                    "Mean {{mean}} · SD {{sd}} · Lowest {{min}} · Highest {{max}}",
                })}
              </p>
            </>
          ) : (
            <p className="MH-Type-Body-Base simulationPreviewStats">
              {t(`${PREFIX}.previewUnavailable`, {}, {
                default: "Fix the values above to see a preview.",
              })}
            </p>
          )}
        </section>

        {blockVariableCount > 1 && (
          <label className="MH-Type-Body-Base simulationApplyAll">
            <input
              type="checkbox"
              checked={applyToBlock}
              onChange={(e) => setApplyToBlock(e.target.checked)}
            />
            {t(
              `${PREFIX}.applyToBlock`,
              { count: blockVariableCount, block: blockName },
              { default: "Apply to all {{count}} variables in {{block}}" },
            )}
          </label>
        )}
      </StyledSimulationModeModal>
    </Modal>
  );
}
