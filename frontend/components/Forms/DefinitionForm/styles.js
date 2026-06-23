// Shared styled-components for the customizable-forms renderer. Visual
// tokens mirror the existing Connect editor (Card, Row, Field, etc.) so
// definition-driven forms look identical to the hardcoded ones during
// the dual-render cutover.
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
    border: 1px solid #d3dae0;
    border-radius: 8px;
    padding: 10px 12px;
    font-family: "Lato", sans-serif;
    font-size: 14px;
    color: #171717;
    background: #ffffff;

    &:focus {
      outline: 2px solid #336f8a;
      outline-offset: -1px;
      border-color: #336f8a;
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
