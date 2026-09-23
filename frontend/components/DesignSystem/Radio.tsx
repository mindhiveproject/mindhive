"use client";

import styled from "styled-components";

/** Props for {@link Radio}. */
export interface RadioProps {
  /** Whether this option is the selected one. */
  checked?: boolean;
  /** Called when the user picks this option. */
  onChange?: () => void;
  /** Disabled state. @default false */
  disabled?: boolean;
  /** Accessible name when no visible label is tied to it. */
  ariaLabel?: string;
  /** Id of the element naming this radio. */
  ariaLabelledBy?: string;
  /** Optional style override for the 48px target. */
  style?: React.CSSProperties;
}

// Figma is explicit that pressed lightens the ring/dot itself (Dark -> Base),
// on top of the halo — the one control here where interaction recolours the
// glyph rather than only adding a state layer behind it.
const COLOR_BASE = "var(--MH-Theme-Primary-Dark, #336F8A)";
const COLOR_PRESSED = "var(--MH-Theme-Primary-Base, #69BBC4)";
const COLOR_DISABLED = "var(--MH-Theme-Neutrals-Medium, #A1A1A1)";

const HALO_UNSELECTED_HOVER = "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)";
const HALO_SELECTED_HOVER = "var(--MH-Theme-Tertiary-Light, #F6F9F8)";
const HALO_PRESSED = "var(--MH-Theme-Primary-Light, #DEF8FB)";

// Material spec (Figma node 1096:604): a 48px touch target holding a 40px
// circular state-layer, itself holding the 20px ring — matching Checkbox's
// touch-target sizing so the two line up in mixed lists.
const StyledRadio = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }

  .DesignSystem-Radio-Halo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: transparent;
  }
  &:not(:disabled):hover .DesignSystem-Radio-Halo {
    background: ${HALO_UNSELECTED_HOVER};
  }
  &.DesignSystem-Radio--checked:not(:disabled):hover .DesignSystem-Radio-Halo {
    background: ${HALO_SELECTED_HOVER};
  }
  &:not(:disabled):active .DesignSystem-Radio-Halo {
    background: ${HALO_PRESSED};
  }
  &:not(:disabled):active .DesignSystem-Radio-Ring {
    border-color: ${COLOR_PRESSED};
  }
  &:not(:disabled):active .DesignSystem-Radio-Dot {
    background: ${COLOR_PRESSED};
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
    border-radius: 50%;
  }
`;

// Unlike the checkbox, a selected radio keeps its ring and gains a dot — that
// is what distinguishes "one of these" from "this is on".
const RING_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  width: 20,
  height: 20,
  borderRadius: "50%",
};

const DOT_STYLE: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
};

/**
 * Design System radio. A single `role="radio"` button; group them yourself in a
 * container with `role="radiogroup"` — in the mockups each option is a whole
 * card, so the group wrapper belongs to the caller, not here.
 *
 * @example
 * <Radio checked={mode === "sandbox"} onChange={() => setMode("sandbox")} ariaLabel="Sandbox mode" />
 */
export default function Radio({
  checked = false,
  onChange,
  disabled = false,
  ariaLabel,
  ariaLabelledBy,
  style,
}: RadioProps) {
  const color = disabled ? COLOR_DISABLED : COLOR_BASE;

  return (
    <StyledRadio
      type="button"
      role="radio"
      className={checked ? "DesignSystem-Radio DesignSystem-Radio--checked" : "DesignSystem-Radio"}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      style={style}
      onClick={() => !disabled && !checked && onChange?.()}
    >
      <span className="DesignSystem-Radio-Halo">
        <span className="DesignSystem-Radio-Ring" style={{ ...RING_STYLE, border: `2px solid ${color}` }}>
          {checked ? <span className="DesignSystem-Radio-Dot" style={{ ...DOT_STYLE, background: color }} /> : null}
        </span>
      </span>
    </StyledRadio>
  );
}
