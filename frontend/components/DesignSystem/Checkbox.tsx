"use client";

import styled from "styled-components";

/** Colour family for a {@link Checkbox} box, matching Button's `tone`. */
export type CheckboxTone = "primary" | "accent";

/** Props for {@link Checkbox}. */
export interface CheckboxProps {
  /** Current state (controlled). */
  checked?: boolean;
  /** Called with the toggled value. */
  onChange?: (next: boolean) => void;
  /** Colour family for the box. @default "primary" */
  tone?: CheckboxTone;
  /** Draws a dash instead of a tick. @default false */
  indeterminate?: boolean;
  /** Disabled state. @default false */
  disabled?: boolean;
  /** Accessible name when no visible label is tied to it. */
  ariaLabel?: string;
  /** Id of the element naming this checkbox. */
  ariaLabelledBy?: string;
  /** Optional style override for the 48px target. */
  style?: React.CSSProperties;
}

// The colour families the box can be painted in. Figma only specifies
// `primary` (Dark border / Base fill); `accent` keeps a single hue for both
// since there's no lighter accent shade to fill with.
const TONES: Record<CheckboxTone, { border: string; fill: string }> = {
  primary: {
    border: "var(--MH-Theme-Primary-Dark, #336F8A)",
    fill: "var(--MH-Theme-Primary-Base, #69BBC4)",
  },
  accent: {
    border: "var(--MH-Theme-Additional-Accent-Base, #6F26CE)",
    fill: "var(--MH-Theme-Additional-Accent-Base, #6F26CE)",
  },
};

const HALO_HOVER = "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)";
const HALO_PRESSED = "var(--MH-Theme-Neutrals-Light, #E6E6E6)";
const DISABLED_COLOR = "var(--MH-Theme-Neutrals-Medium, #A1A1A1)";

// Material spec (Figma node 1096:10): a 48px touch target holding a 40px
// circular state-layer, itself holding the 18px box — the halo is what
// communicates hover/press, the box's own colour never shifts with it.
const StyledCheckbox = styled.button`
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

  .DesignSystem-Checkbox-Halo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: transparent;
  }
  &:not(:disabled):hover .DesignSystem-Checkbox-Halo {
    background: ${HALO_HOVER};
  }
  &:not(:disabled):active .DesignSystem-Checkbox-Halo {
    background: ${HALO_PRESSED};
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
    border-radius: 50%;
  }
`;

const BOX_STYLE: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  width: 18,
  height: 18,
  borderRadius: 2,
  background: "transparent",
};

// Figma overlays the glyph as a full 24px icon centered on the 18px box, so
// it deliberately overflows the box edges by 3px on each side.
const GLYPH_STYLE: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  width: 24,
  height: 24,
  transform: "translate(-50%, -50%)",
  color: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
};

const CHECK = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M10 16.4L6 12.4L7.4 11L10 13.6L16.6 7L18 8.4L10 16.4Z" fill="currentColor" />
  </svg>
);

const INDETERMINATE = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M6 13V11H18V13H6Z" fill="currentColor" />
  </svg>
);

/**
 * Design System checkbox. Renders a `role="checkbox"` button rather than a
 * native input so the box can be styled directly; the label, when there is one,
 * lives outside it (rows in the mockups put the description on the left and the
 * control on the right).
 *
 * @example
 * <Checkbox checked={normalize} onChange={setNormalize} ariaLabel="Normalize" />
 */
export default function Checkbox({
  checked = false,
  onChange,
  tone = "primary",
  indeterminate = false,
  disabled = false,
  ariaLabel,
  ariaLabelledBy,
  style,
}: CheckboxProps) {
  const palette = TONES[tone] ?? TONES.primary;
  const filled = checked || indeterminate;
  const color = disabled ? DISABLED_COLOR : filled ? palette.fill : palette.border;
  const boxStyle: React.CSSProperties = filled
    ? { ...BOX_STYLE, background: color }
    : { ...BOX_STYLE, border: `2px solid ${color}` };

  return (
    <StyledCheckbox
      type="button"
      role="checkbox"
      className="DesignSystem-Checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      style={style}
      onClick={() => !disabled && onChange?.(!checked)}
    >
      <span className="DesignSystem-Checkbox-Halo">
        <span style={boxStyle}>
          {indeterminate ? (
            <span style={GLYPH_STYLE}>{INDETERMINATE}</span>
          ) : checked ? (
            <span style={GLYPH_STYLE}>{CHECK}</span>
          ) : null}
        </span>
      </span>
    </StyledCheckbox>
  );
}
