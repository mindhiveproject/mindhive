"use client";

import { useState } from "react";

// Material spec (Figma node 1096:10): a 48px touch target holding a 40px
// circular state-layer, itself holding the 18px box — the halo is what
// communicates hover/press, the box's own colour never shifts.
const TARGET_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 48,
  height: 48,
  flexShrink: 0,
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

const STATE_LAYER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "transparent",
};

// The colour families the box can be painted in, matching Button's `tone`.
// Figma only specifies `primary` (Dark border / Base fill); `accent` keeps a
// single hue for both since there's no lighter accent shade to fill with.
const TONES = {
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

const BOX_STYLE = {
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
const GLYPH_STYLE = {
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

const FOCUS_VISIBLE_STYLE = `
.DesignSystem-Checkbox:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);
  outline-offset: 2px;
  border-radius: 50%;
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
 * @param {React.CSSProperties} [style] - Override for the 48px target.
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
  const [pressed, setPressed] = useState(false);
  const palette = TONES[tone] || TONES.primary;
  const filled = checked || indeterminate;

  let stateLayerStyle = { ...STATE_LAYER_STYLE };
  if (!disabled && pressed) {
    stateLayerStyle = { ...stateLayerStyle, background: HALO_PRESSED };
  } else if (!disabled && hovered) {
    stateLayerStyle = { ...stateLayerStyle, background: HALO_HOVER };
  }

  const color = disabled ? DISABLED_COLOR : filled ? palette.fill : palette.border;
  const boxStyle = filled
    ? { ...BOX_STYLE, background: color }
    : { ...BOX_STYLE, border: `2px solid ${color}` };

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
        onMouseLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onMouseDown={() => !disabled && setPressed(true)}
        onMouseUp={() => setPressed(false)}
      >
        <span style={stateLayerStyle}>
          <span style={boxStyle}>
            {indeterminate ? (
              <span style={GLYPH_STYLE}>{INDETERMINATE}</span>
            ) : checked ? (
              <span style={GLYPH_STYLE}>{CHECK}</span>
            ) : null}
          </span>
        </span>
      </button>
    </>
  );
}
