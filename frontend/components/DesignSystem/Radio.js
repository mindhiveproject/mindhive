"use client";

import { useState } from "react";

// Material spec (Figma node 1096:604): a 48px touch target holding a 40px
// circular state-layer, itself holding the 20px ring — matching Checkbox's
// touch-target sizing so the two line up in mixed lists.
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

// Unlike the checkbox, a selected radio keeps its ring and gains a dot — that
// is what distinguishes "one of these" from "this is on".
const RING_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "transparent",
};

const DOT_STYLE = {
  width: 10,
  height: 10,
  borderRadius: "50%",
};

// Figma is explicit that pressed lightens the ring/dot itself (Dark -> Base),
// on top of the halo — the one control here where interaction recolours the
// glyph rather than only adding a state layer behind it.
const COLOR_BASE = "var(--MH-Theme-Primary-Dark, #336F8A)";
const COLOR_PRESSED = "var(--MH-Theme-Primary-Base, #69BBC4)";
const COLOR_DISABLED = "var(--MH-Theme-Neutrals-Medium, #A1A1A1)";

const HALO_UNSELECTED_HOVER = "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)";
const HALO_SELECTED_HOVER = "var(--MH-Theme-Tertiary-Light, #F6F9F8)";
const HALO_PRESSED = "var(--MH-Theme-Primary-Light, #DEF8FB)";

const FOCUS_VISIBLE_STYLE = `
.DesignSystem-Radio:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);
  outline-offset: 2px;
  border-radius: 50%;
}
`;

/**
 * Design System radio. A single `role="radio"` button; group them yourself in a
 * container with `role="radiogroup"` — in the mockups each option is a whole
 * card, so the group wrapper belongs to the caller, not here.
 *
 * @param {boolean} checked - Whether this option is the selected one.
 * @param {() => void} onChange - Called when the user picks this option.
 * @param {boolean} [disabled=false] - Disabled state.
 * @param {string} [ariaLabel] - Accessible name when no visible label is tied to it.
 * @param {string} [ariaLabelledBy] - Id of the element naming this radio.
 * @param {React.CSSProperties} [style] - Override for the 48px target.
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
  style = {},
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const active = !disabled && pressed;
  const color = disabled ? COLOR_DISABLED : active ? COLOR_PRESSED : COLOR_BASE;

  let stateLayerStyle = { ...STATE_LAYER_STYLE };
  if (active) {
    stateLayerStyle = { ...stateLayerStyle, background: HALO_PRESSED };
  } else if (!disabled && hovered) {
    stateLayerStyle = {
      ...stateLayerStyle,
      background: checked ? HALO_SELECTED_HOVER : HALO_UNSELECTED_HOVER,
    };
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOCUS_VISIBLE_STYLE }} />
      <button
        type="button"
        role="radio"
        className="DesignSystem-Radio"
        aria-checked={checked}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        style={{ ...TARGET_STYLE, ...(disabled ? { cursor: "default" } : null), ...style }}
        onClick={() => !disabled && !checked && onChange?.()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onMouseDown={() => !disabled && setPressed(true)}
        onMouseUp={() => setPressed(false)}
      >
        <span style={stateLayerStyle}>
          <span style={{ ...RING_STYLE, border: `2px solid ${color}` }}>
            {checked ? <span style={{ ...DOT_STYLE, background: color }} /> : null}
          </span>
        </span>
      </button>
    </>
  );
}
