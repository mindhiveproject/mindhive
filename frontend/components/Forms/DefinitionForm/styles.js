// Shared styled-components for the customizable-forms renderer.
import styled from "styled-components";

export const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${(p) => (p.$quiet ? "16px" : "20px")};
  padding: ${(p) => (p.$quiet ? "0" : "28px")};
  border-radius: ${(p) => (p.$quiet ? "0" : "16px")};
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  box-shadow: ${(p) =>
    p.$quiet ? "none" : "0px 4px 24px rgba(0, 0, 0, 0.05)"};
  border: ${(p) =>
    p.$quiet ? "none" : "1px solid transparent"};

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .card-description {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
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
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);

  .field-label-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  span.label-text {
    font-weight: 600;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  span.hint {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
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
    border: 2px solid ${({ $hasError }) => ($hasError ? "#c0392b" : "var(--MH-Theme-Neutrals-Medium, #a1a1a1)")};
    border-radius: 8px;
    padding: 9px 11px;
    font-family: "Lato", sans-serif;
    font-size: 14px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    width: 100%;
    box-sizing: border-box;
    min-width: 0;

    /* Color-only focus — outer outlines/shadows clip under overflow:hidden modals. */
    &:focus {
      outline: none;
      border-color: ${({ $hasError }) => ($hasError ? "#c0392b" : "var(--MH-Theme-Primary-Dark, #336f8a)")};
    }

    &:disabled {
      background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
      color: var(--MH-Theme-Neutrals-Black, #171717);
      border-color: var(--MH-Theme-Neutrals-Medium, #a1a1a1);
      opacity: 1;
      cursor: default;
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
    color: var(--MH-Theme-Neutrals-Black, #171717);
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
    border: 1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1);
    border-radius: 8px;
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    min-width: 0;
  }

  .select-option-preview {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0;
    padding: 6px 4px;
    font-size: 14px;
    line-height: 1.4;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .select-option-preview.is-selected {
    color: var(--MH-Theme-Neutrals-Black, #171717);
    font-weight: 600;
  }

  .select-option-marker {
    flex: none;
    width: 16px;
    height: 16px;
    margin-top: 2px;
    box-sizing: border-box;
    border: 1.5px solid var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    background: var(--MH-Theme-Neutrals-White, #ffffff);
  }

  .select-option-marker.single {
    border-radius: 50%;
  }

  .select-option-marker.multi {
    border-radius: 4px;
  }

  .select-option-preview.is-selected .select-option-marker {
    border-color: var(--MH-Theme-Neutrals-Black, #171717);
    background: var(--MH-Theme-Neutrals-Black, #171717);
    box-shadow: inset 0 0 0 2px var(--MH-Theme-Neutrals-White, #ffffff);
  }

  ${(p) =>
    p.$readOnlyInline
      ? `
    display: grid;
    grid-template-columns: minmax(12rem, 1fr) minmax(0, 2fr);
    gap: 12px 16px;
    align-items: start;

    .field-label-block {
      grid-column: 1;
    }

    .field-control-block,
    .select-options-preview,
    input,
    textarea {
      grid-column: 2;
    }

    span.error {
      grid-column: 2;
    }

    @media (max-width: 700px) {
      grid-template-columns: 1fr;

      .field-label-block,
      .field-control-block,
      .select-options-preview,
      input,
      textarea,
      span.error {
        grid-column: 1;
      }
    }
  `
      : ""}
`;

export const ReadOnlyBanner = styled.div`
  padding: 16px;
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font-size: 14px;
  line-height: 1.5;
`;

export function fieldShellErrorProps(error) {
  return {
    $hasError: Boolean(error),
    "data-field-error": error ? "true" : undefined,
  };
}

export function fieldShellLayoutProps({ error, readOnlyInline = false } = {}) {
  return {
    ...fieldShellErrorProps(error),
    $readOnlyInline: Boolean(readOnlyInline),
  };
}
