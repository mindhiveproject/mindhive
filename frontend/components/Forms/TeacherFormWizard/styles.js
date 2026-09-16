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

/** In-flow panel for matching-round create/edit (not a modal or viewport takeover). */
export const PageShell = styled.section`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: min(60vh, 640px);
  max-height: calc(100vh - 220px);
  box-sizing: border-box;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  overflow: hidden;
`;

export const PageHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 10px 14px;
  border-bottom: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

export const PageTitle = styled.h2`
  margin: 0;
  font: var(--MH-Type-Title-Base);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  min-width: 0;
`;

export const PageBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 12px 14px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  box-sizing: border-box;
`;

export const PageFooter = styled.footer`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  padding: 10px 14px;
  border-top: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

/**
 * Footer action row: secondary action (preview) on the left, save/close on the
 * right. Full width so it lays out the same inside `PageFooter` and the
 * DesignSystem Modal actions slot.
 */
export const FooterActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;

  .footer-actions-left,
  .footer-actions-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .footer-actions-right {
    margin-left: auto;
  }
`;

export const StepMeta = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Grey-2, #5f6871);
`;

export const FieldStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .field-hint {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Grey-2, #5f6871);
  }

  input,
  textarea {
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    border: 2px solid #d3dae0;
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

export const BuilderColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

export const QuestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;

  /* Must not shrink: anything after it in this column would otherwise land on
     top of the overflowing questions. */
  .smooth-dnd-container {
    min-height: 4px;
    flex: 0 0 auto;
  }

  .smooth-dnd-draggable-wrapper {
    overflow: visible;
  }

  /* Add question scrolls with the questions instead of pinning to the panel. */
  .question-list-add {
    display: flex;
    flex: 0 0 auto;
    margin-top: 10px;
  }
`;

export const QuestionBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

export const QuestionCard = styled.div`
  border: 1px solid #d3dae0;
  border-radius: 12px;
  padding: 12px 14px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const QuestionCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .question-title-block {
    flex: 0 0 auto;
    min-width: 0;
  }

  /* Type dropdown shares the header row so the card has no separate picker. */
  .question-type-select {
    flex: 1 1 140px;
    min-width: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
`;

/** Icon + label + hint row inside the question-type dropdown options. */
export const TypeOption = styled.span`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;

  .type-option-icon {
    flex-shrink: 0;
    margin-top: 1px;
    color: currentColor;
  }

  .type-option-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .type-option-label {
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .type-option-hint {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Grey-2, #5f6871);
  }
`;

/** Long answer / Required switches sit on one wrapping row. */
export const TogglesRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

export const DragHandle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  cursor: grab;
  touch-action: none;
  user-select: none;

  &:hover {
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  &:active {
    cursor: grabbing;
  }

  &[aria-disabled="true"] {
    opacity: 0.35;
    cursor: default;
    pointer-events: none;
  }

  svg {
    display: block;
  }
`;

/**
 * Collapsed rail between two questions. It stays a thin hit strip so the list
 * keeps its density, and expands to reveal the insert ButtonGroup on hover or
 * keyboard focus.
 */
export const InsertRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 12px;
  overflow: hidden;
  opacity: 0;
  transition: height 0.12s ease, opacity 0.12s ease;

  &:hover,
  &:focus-within {
    height: 40px;
    opacity: 1;
  }
`;

/**
 * Title + optional note block above the question list. Compact on purpose: it
 * stays pinned while questions scroll, so it has to stay out of the way in the
 * narrow milestone review-form panel.
 */
export const MetaHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;

  && {
    label {
      gap: 4px;
    }

    .field-label-block {
      gap: 0;
    }

    span.label-text {
      font: var(--MH-Type-Title-Small);
      letter-spacing: 0;
    }

    input[type="text"],
    textarea {
      padding: 7px 10px;
    }

    textarea {
      min-height: 0;
      resize: vertical;
    }
  }
`;

export const MetaActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const PreviewStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 14px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-Soft, #f7f9f8);

  /* Keep the stack itself scrollable; only the rendered fields are inert. */
  > * {
    pointer-events: none;
  }
`;

export const ErrorText = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;
  color: #b42318;
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
  border: 1px solid #d3dae0;
  border-radius: 10px;
  background: #fff;
  padding: 10px 12px;
  cursor: pointer;

  .clone-title {
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
    color: #171717;
  }

  .clone-desc {
    margin-top: 4px;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: #5f6871;
  }
`;
