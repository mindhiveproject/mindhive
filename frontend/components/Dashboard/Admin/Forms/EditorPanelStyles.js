// Shared styled-components used by CardEditor + FieldEditor. Kept in
// one file so the two editors stay visually consistent.
import styled from "styled-components";

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
    font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
    letter-spacing: 0;
    color: #171717;
  }

  .flash {
    color: #1d6b3a;
    font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
  }
`;

export const FieldRow = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
  letter-spacing: 0;
  color: #5f6871;

  span.label-text {
    color: #171717;
    font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
  }

  span.hint {
    color: #888;
    font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
  }

  input[type="text"],
  input[type="number"],
  textarea,
  select {
    border: 1px solid #d3dae0;
    border-radius: 8px;
    padding: 8px 10px;
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
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
    font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
    color: #171717;
  }
`;

export const PillCheckbox = styled.button`
  padding: 4px 12px;
  border-radius: 100px;
  font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  cursor: pointer;
  border: 1px solid
    ${({ $checked }) => ($checked ? "#336f8a" : "#d3dae0")};
  background: ${({ $checked }) => ($checked ? "#336f8a" : "#ffffff")};
  color: ${({ $checked }) => ($checked ? "#ffffff" : "#5f6871")};
`;
