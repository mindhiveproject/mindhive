import styled from "styled-components";
import clsx from "clsx";

/**
 * Design System Split Button (Material 3 "split button", small size): a
 * leading button for the main action and a trailing icon button for a related
 * one, 2px apart. Outer corners are fully rounded; the inner corners are 4px
 * and round further on hover/focus, as in the M3 spec.
 *
 * @param {React.ReactNode} label - Leading button label (required).
 * @param {() => void} onClick - Leading (main) action.
 * @param {React.ReactNode} trailingIcon - Icon for the trailing button (~20px).
 * @param {() => void} onTrailingClick - Trailing action.
 * @param {string} trailingAriaLabel - Accessible name for the trailing button.
 * @param {"outline"|"filled"} [variant="outline"] - Visual style.
 * @param {boolean} [selected=false] - Marks the leading action as the active
 *   choice (sets aria-pressed); pair with variant="filled" to show it.
 * @param {boolean} [disabled=false]
 * @param {string} [className]
 * @param {string} [title] - Native tooltip on the leading button.
 *
 * @example
 * <SplitButton label="Board A" onClick={select} trailingIcon={<EditIcon />}
 *   onTrailingClick={edit} trailingAriaLabel="Edit Board A" />
 */
export default function SplitButton({
  label,
  onClick,
  trailingIcon,
  onTrailingClick,
  trailingAriaLabel,
  variant = "outline",
  selected = false,
  disabled = false,
  className,
  title,
}) {
  return (
    <StyledSplitButton
      className={clsx(
        "DesignSystem-SplitButton",
        `DesignSystem-SplitButton--${variant}`,
        className
      )}
    >
      <button
        type="button"
        className="DesignSystem-SplitButton-leading"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        title={title}
      >
        <span className="DesignSystem-SplitButton-label">{label}</span>
      </button>
      <button
        type="button"
        className="DesignSystem-SplitButton-trailing"
        onClick={onTrailingClick}
        disabled={disabled}
        aria-label={trailingAriaLabel}
        title={trailingAriaLabel}
      >
        {trailingIcon}
      </button>
    </StyledSplitButton>
  );
}

/* `&&&` beats legacy page-level `button` rules that restyle bare buttons. */
const StyledSplitButton = styled.div`
  display: inline-flex;
  align-items: stretch;
  gap: 2px;
  height: 40px;
  max-width: 100%;
  min-width: 0;

  &&& button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 40px;
    margin: 0;
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s, border-radius 0.2s;
  }

  &&& button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &&& button:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }

  &&& .DesignSystem-SplitButton-leading {
    min-width: 0;
    padding: 0 12px 0 16px;
    border-radius: 20px 4px 4px 20px;
  }

  &&& .DesignSystem-SplitButton-trailing {
    flex-shrink: 0;
    width: 40px;
    padding: 0 12px 0 10px;
    border-radius: 4px 20px 20px 4px;

    svg,
    img {
      width: 18px;
      height: 18px;
    }
  }

  &&& .DesignSystem-SplitButton-leading:hover:not(:disabled),
  &&& .DesignSystem-SplitButton-leading:focus-visible {
    border-radius: 20px 8px 8px 20px;
  }

  &&& .DesignSystem-SplitButton-trailing:hover:not(:disabled),
  &&& .DesignSystem-SplitButton-trailing:focus-visible {
    border-radius: 8px 20px 20px 8px;
  }

  .DesignSystem-SplitButton-label {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* Outline */
  &&&.DesignSystem-SplitButton--outline button {
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    color: var(--MH-Theme-Primary-Dark, #336f8a);
    border: 1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1);
  }

  &&&.DesignSystem-SplitButton--outline button:hover:not(:disabled) {
    background: var(--MH-Theme-Primary-Light, #def8fb);
  }

  /* Filled */
  &&&.DesignSystem-SplitButton--filled button {
    background: var(--MH-Theme-Primary-Dark, #336f8a);
    color: var(--MH-Theme-Neutrals-White, #ffffff);
    border: 1px solid var(--MH-Theme-Primary-Dark, #336f8a);
  }

  &&&.DesignSystem-SplitButton--filled button:hover:not(:disabled) {
    background: #2b5f77;
  }
`;
