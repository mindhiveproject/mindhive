import styled from "styled-components";

export const WizardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  overflow: hidden;
`;

export const StepMeta = styled.p`
  margin: 0;
  font-family: Inter, sans-serif;
  font-size: 13px;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
`;

export const FieldStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-family: Lato, sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .field-hint {
    font-family: Inter, sans-serif;
    font-size: 12px;
    line-height: 1.4;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  }

  input,
  textarea {
    font-family: Inter, sans-serif;
    font-size: 14px;
    border: 2px solid var(--MH-Theme-Neutrals-Light, #d3dae0);
    border-radius: 8px;
    padding: 9px 11px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    box-sizing: border-box;

    /* Color-only focus — no outer ring for overflow:hidden wizard/modal bodies. */
    &:focus {
      outline: none;
      border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    }
  }

  textarea {
    min-height: 88px;
    resize: vertical;
  }
`;

export const Split = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  flex: 1 1 auto;
  min-height: 0;
  align-items: stretch;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
    overflow: auto;
  }
`;

export const EditorColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

export const QuestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
`;

export const QuestionCard = styled.div`
  border: 1px solid var(--MH-Theme-Neutrals-Light, #d3dae0);
  border-radius: 12px;
  padding: ${({ $collapsed }) => ($collapsed ? "8px 10px" : "12px 14px")};
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const QuestionCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;

  .question-meta {
    font-family: Inter, sans-serif;
    font-size: 12px;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
`;

export const QuestionSummary = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;

  .summary-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1 1 auto;
    margin: 0;
    padding: 4px 0;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  .summary-main strong {
    font-family: Lato, sans-serif;
    font-size: 14px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .summary-type {
    font-family: Inter, sans-serif;
    font-size: 12px;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  }

  .summary-prompt {
    font-family: Inter, sans-serif;
    font-size: 13px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .summary-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }
`;

export const TypePicker = styled.div`
  display: ${({ $compact }) => ($compact ? "inline-flex" : "grid")};
  ${({ $compact }) =>
    $compact
      ? `
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  `
      : `
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;

    @media (max-width: 900px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: 720px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `}
`;

export const TypeTile = styled.button`
  text-align: ${({ $compact }) => ($compact ? "center" : "left")};
  border-radius: ${({ $compact }) => ($compact ? "10px" : "12px")};
  border: 2px solid
    ${({ $active }) =>
      $active
        ? "var(--MH-Theme-Primary-Dark, #336f8a)"
        : "var(--MH-Theme-Neutrals-Light, #d3dae0)"};
  background: ${({ $active }) =>
    $active ? "var(--MH-Theme-Primary-Light, #def8fb)" : "#fff"};
  color: ${({ $active }) =>
    $active
      ? "var(--MH-Theme-Primary-Dark, #336f8a)"
      : "var(--MH-Theme-Neutrals-Dark, #5f6871)"};
  padding: ${({ $compact }) => ($compact ? "6px" : "10px 10px 8px")};
  width: ${({ $compact }) => ($compact ? "36px" : "auto")};
  height: ${({ $compact }) => ($compact ? "36px" : "auto")};
  min-width: ${({ $compact }) => ($compact ? "36px" : "0")};
  display: ${({ $compact }) => ($compact ? "inline-flex" : "flex")};
  flex-direction: ${({ $compact }) => ($compact ? "row" : "column")};
  align-items: ${({ $compact }) => ($compact ? "center" : "flex-start")};
  justify-content: ${({ $compact }) => ($compact ? "center" : "flex-start")};
  gap: ${({ $compact }) => ($compact ? "0" : "6px")};
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .type-icon {
    flex-shrink: 0;
    display: block;
  }

  .type-label {
    display: block;
    font-family: Lato, sans-serif;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.25;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .type-hint {
    display: block;
    font-family: Inter, sans-serif;
    font-size: 11px;
    line-height: 1.3;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  }

  &.active .type-label {
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

export const MetaHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
`;

export const MetaActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PreviewPane = styled.div`
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-Soft, #f7f9f8);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  min-height: 0;
  height: 100%;
  overflow: auto;
`;

export const ErrorText = styled.p`
  margin: 0;
  font-family: Inter, sans-serif;
  font-size: 13px;
  color: #b42318;
`;

export const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: Inter, sans-serif;
  font-size: 13px;
  font-weight: 400 !important;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  cursor: pointer;

  input {
    margin: 0;
  }
`;

export const CloneList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow: auto;
`;

export const CloneRow = styled.button`
  text-align: left;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #d3dae0);
  border-radius: 10px;
  background: #fff;
  padding: 10px 12px;
  cursor: pointer;

  .clone-title {
    font-family: Lato, sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #171717;
  }

  .clone-desc {
    margin-top: 4px;
    font-family: Inter, sans-serif;
    font-size: 12px;
    color: #5f6871;
  }
`;
