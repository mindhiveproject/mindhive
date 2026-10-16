import styled from "styled-components";

export const StyledSimulatedConfig = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;

  .simulatedStudyHeader {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: var(--MH-Theme-Tertiary-Dark, #0d3944);
  }

  .simulatedHint {
    margin: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .simulatedParticipants {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 200px;
  }

  input[type="number"] {
    width: 100%;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid #cbd5e0;
    outline: none;
    box-sizing: border-box;
  }

  .simulatedFlow {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .simulatedBranch {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 12px;
    border-left: 2px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  }

  .simulatedConditionHeader {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .simulatedVariables {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
  }

  .simulatedVariableRow {
    display: grid;
    grid-template-columns: minmax(160px, 1fr) auto auto;
    align-items: end;
    gap: 12px;
  }

  .simulatedParams {
    display: grid;
    grid-template-columns: repeat(4, 112px);
    gap: 8px;
  }

  .simulatedVariableName {
    display: flex;
    flex-direction: column;
    min-width: 0;
    align-self: center;
  }

  .simulatedVariableName span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .simulatedVariableMode {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .simulatedParam {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .simulatedParam span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .simulatedVariableRow.hasError input {
    border-color: var(--MH-Theme-Error, #b3261e);
  }

  .simulatedNoVariables {
    margin: 8px 0 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .simulationError {
    margin: 0;
    color: var(--MH-Theme-Error, #b3261e);
  }
`;

export const StyledSimulationModeModal = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .simulationModeModalDescription {
    margin: 0 0 4px;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .simulationModeModalParams {
    display: grid;
    gap: 12px;
  }

  .simulationPreview {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 4px;
    padding: 12px;
    border-radius: 8px;
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }

  .simulationPreviewHeader {
    color: var(--MH-Theme-Tertiary-Dark, #0d3944);
  }

  .simulationPreviewChart {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 96px;
  }

  .simulationPreviewBar {
    flex: 1 1 0;
    min-height: 1px;
    border-radius: 2px 2px 0 0;
    background: var(--MH-Theme-Primary-Dark, #336f8a);
  }

  .simulationPreviewAxis {
    display: flex;
    justify-content: space-between;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .simulationPreviewStats {
    margin: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .simulationApplyAll {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .simulationModeModalParams label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  input[type="number"] {
    width: 100%;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid #cbd5e0;
    outline: none;
    box-sizing: border-box;
  }

  .simulationError {
    margin: 0;
    color: #c53030;
  }
`;
