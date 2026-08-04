// Shared styled-components for the customizable-forms renderer.
import styled from "styled-components";

export const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }

  .card-description {
    color: #5f6871;
    font-size: 14px;
    margin: 0;
  }
`;

export const Row = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: ${({ $cols }) => $cols || "1fr"};

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

export const FieldShell = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: "Lato", sans-serif;
  font-size: 14px;
  color: #5f6871;

  span.label-text {
    font-weight: 600;
    color: #171717;
  }

  span.hint {
    color: #888;
    font-size: 12px;
  }

  span.required {
    color: #c0392b;
    margin-left: 2px;
  }

  span.error {
    color: #c0392b;
    font-size: 12px;
  }

  input[type="text"],
  input[type="number"],
  input[type="date"],
  input[type="url"],
  textarea {
    border: 1px solid ${({ $hasError }) => ($hasError ? "#c0392b" : "#d3dae0")};
    border-radius: 8px;
    padding: 10px 12px;
    font-family: "Lato", sans-serif;
    font-size: 14px;
    color: #171717;
    background: #ffffff;

    &:focus {
      outline: 2px solid ${({ $hasError }) => ($hasError ? "#c0392b" : "#336f8a")};
      outline-offset: -1px;
      border-color: ${({ $hasError }) => ($hasError ? "#c0392b" : "#336f8a")};
    }

    &:disabled {
      background: #f7f9f8;
      color: #888;
    }
  }

  textarea {
    min-height: 80px;
    resize: vertical;
  }

  .checkbox-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #171717;
    cursor: pointer;
  }

  /* Read-only / preview: list select & multiselect options instead of an
     empty disabled Semantic Dropdown. */
  .select-options-preview {
    list-style: none;
    margin: 0;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border: 1px solid #d3dae0;
    border-radius: 8px;
    background: #f7f9f8;
  }

  .select-option-preview {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0;
    padding: 6px 4px;
    font-size: 14px;
    line-height: 1.4;
    color: #5f6871;
  }

  .select-option-preview.is-selected {
    color: #171717;
    font-weight: 600;
  }

  .select-option-marker {
    flex: none;
    width: 16px;
    height: 16px;
    margin-top: 2px;
    box-sizing: border-box;
    border: 1.5px solid #a1a1a1;
    background: #ffffff;
  }

  .select-option-marker.single {
    border-radius: 50%;
  }

  .select-option-marker.multi {
    border-radius: 4px;
  }

  .select-option-preview.is-selected .select-option-marker {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    background: var(--MH-Theme-Primary-Dark, #336f8a);
    box-shadow: inset 0 0 0 2px #ffffff;
  }
`;

export const ReadOnlyBanner = styled.div`
  padding: 16px;
  border-radius: 12px;
  background: #eef5f9;
  border: 1px solid #cfdfe7;
  color: #171717;
  font-size: 14px;
  line-height: 1.5;
`;

export function fieldShellErrorProps(error) {
  return {
    $hasError: Boolean(error),
    "data-field-error": error ? "true" : undefined,
  };
}
