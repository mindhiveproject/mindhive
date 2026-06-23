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
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }

  .flash {
    color: #1d6b3a;
    font-size: 13px;
  }
`;

export const FieldRow = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: "Lato", sans-serif;
  font-size: 13px;
  color: #5f6871;

  span.label-text {
    font-weight: 600;
    color: #171717;
    font-size: 13px;
  }

  span.hint {
    color: #888;
    font-size: 12px;
  }

  input[type="text"],
  input[type="number"],
  textarea,
  select {
    border: 1px solid #d3dae0;
    border-radius: 8px;
    padding: 8px 10px;
    font-family: "Lato", sans-serif;
    font-size: 14px;
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
    font-weight: 600;
    color: #171717;
  }
`;

export const PrimaryButton = styled.button`
  padding: 8px 20px;
  border-radius: 100px;
  background: #336f8a;
  color: #ffffff;
  border: none;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled.button`
  padding: 8px 16px;
  border-radius: 100px;
  background: #ffffff;
  border: 1px solid #d3dae0;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PillCheckbox = styled.button`
  padding: 4px 12px;
  border-radius: 100px;
  font-family: "Nunito", sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid
    ${({ $checked }) => ($checked ? "#336f8a" : "#d3dae0")};
  background: ${({ $checked }) => ($checked ? "#336f8a" : "#ffffff")};
  color: ${({ $checked }) => ($checked ? "#ffffff" : "#5f6871")};
`;
