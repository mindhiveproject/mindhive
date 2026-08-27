// Shared styled-components used by CardEditor + FieldEditor. Kept in
// one file so the two editors stay visually consistent.
import styled from "styled-components";

import Chip from "../../../DesignSystem/Chip";

export const EditorPanelShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  max-height: calc(100vh - 200px);
`;

export const Section = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  h2 {
    margin: 0;
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    color: #171717;
  }

  .flash {
    color: #1d6b3a;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
  }
`;

export const FieldRow = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;
  color: #5f6871;

  span.label-text {
    color: #171717;
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
  }

  span.hint {
    color: #888;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
  }

  input[type="text"],
  input[type="number"],
  textarea,
  select {
    border: 1px solid #d3dae0;
    border-radius: 8px;
    padding: 8px 10px;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: #171717;
    background: #ffffff;
  }

  textarea {
    min-height: 70px;
    resize: vertical;
  }

  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .checkbox-row {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: #171717;
  }
`;

// Toggle chip: selected = primary-light fill + primary border (DS Chip).
export const PillCheckbox = ({ $checked, children, onClick, ...rest }) => (
  <Chip
    selected={!!$checked}
    label={children}
    onClick={onClick}
    ariaLabel={rest["aria-label"]}
    title={rest.title}
  />
);
