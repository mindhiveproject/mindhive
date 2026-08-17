"use client";

import { useState } from "react";

// The box is 20x20 but sits in a 24x24 target so it lines up with the 24px
// icons everywhere else in a row of controls.
const TARGET_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  flexShrink: 0,
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

// The colour families the box can be painted in, matching Button's `tone`.
const TONES = {
  primary: {
    main: "var(--MH-Theme-Primary-Dark, #336F8A)",
    hover: "var(--MH-Theme-Primary-Base, #337C84)",
  },
  accent: {
    main: "var(--MH-Theme-Additional-Accent-Base, #6F26CE)",
    hover: "var(--MH-Theme-Additional-Accent-Dark, #3F288F)",
  },
};

const BOX_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  width: 20,
  height: 20,
  borderRadius: 4,
  background: "transparent",
  color: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  transition: "background-color 0.2s, border-color 0.2s",
};

const BOX_DISABLED_STYLE = {
  borderColor: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  background: "transparent",
  cursor: "default",
};

const BOX_DISABLED_CHECKED_STYLE = {
  borderColor: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  background: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
};

const CHECK = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
    <path
      d="M1.5 7.5L5 11L12.5 3"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const INDETERMINATE = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
    <path
      d="M2.5 7H11.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

const FOCUS_VISIBLE_STYLE = `
.DesignSystem-Checkbox:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);
  outline-offset: 2px;
  border-radius: 4px;
}
`;

/**
 * Design System checkbox. Renders a `role="checkbox"` button rather than a
 * native input so the box can be styled directly; the label, when there is one,
 * lives outside it (rows in the mockups put the description on the left and the
 * control on the right).
 *
 * @param {boolean} checked - Current state (controlled).
 * @param {(next: boolean) => void} onChange - Called with the toggled value.
 * @param {"primary"|"accent"} [tone="primary"] - Colour family for the box.
 * @param {boolean} [indeterminate=false] - Draws a dash instead of a tick.
 * @param {boolean} [disabled=false] - Disabled state.
 * @param {string} [ariaLabel] - Accessible name when no visible label is tied to it.
 * @param {string} [ariaLabelledBy] - Id of the element naming this checkbox.
 * @param {React.CSSProperties} [style] - Override for the 24px target.
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
  style = {},
}) {
  const [hovered, setHovered] = useState(false);
  const palette = TONES[tone] || TONES.primary;

  // Checked is a fill, not a fill plus a heavier outline — the border colour is
  // already the fill colour, so the box simply solidifies.
  let boxStyle = { ...BOX_STYLE, border: `2px solid ${palette.main}` };
  if (checked || indeterminate) boxStyle = { ...boxStyle, background: palette.main };
  if (!disabled && hovered) boxStyle = { ...boxStyle, borderColor: palette.hover };
  if (disabled) {
    boxStyle = {
      ...boxStyle,
      ...(checked || indeterminate
        ? BOX_DISABLED_CHECKED_STYLE
        : BOX_DISABLED_STYLE),
    };
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOCUS_VISIBLE_STYLE }} />
      <button
        type="button"
        role="checkbox"
        className="DesignSystem-Checkbox"
        aria-checked={indeterminate ? "mixed" : checked}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        style={{ ...TARGET_STYLE, ...(disabled ? { cursor: "default" } : null), ...style }}
        onClick={() => !disabled && onChange?.(!checked)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={boxStyle}>
          {indeterminate ? INDETERMINATE : checked ? CHECK : null}
        </span>
      </button>
    </>
  );
}
