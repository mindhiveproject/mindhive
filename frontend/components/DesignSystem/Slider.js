"use client";

import { useState } from "react";

// The colour families the track and thumb can be painted in, matching Button's
// `tone` so a slider sits inside a toned group without standing out.
const TONES = {
  primary: "var(--MH-Theme-Primary-Dark, #336F8A)",
  accent: "var(--MH-Theme-Additional-Accent-Base, #6F26CE)",
};

const ROOT_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  minWidth: 0,
};

// The readout is fixed-width rather than shrink-to-fit so the track doesn't
// twitch sideways as the digits change while you drag.
const READOUT_STYLE = {
  flexShrink: 0,
  boxSizing: "border-box",
  width: 72,
  height: 40,
  padding: "4px 12px",
  borderRadius: 8,
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: "24px",
  textAlign: "right",
  outline: "none",
};

// The range input's own chrome is replaced wholesale: a 4px track with the
// filled portion painted by a gradient, and a 20px thumb over it. Both vendor
// thumb pseudo-elements have to be written out — a shared selector list is
// dropped entirely by each browser that doesn't recognise the other's half.
const TRACK_STYLE = `
.DesignSystem-Slider {
  -webkit-appearance: none;
  appearance: none;
  flex: 1 1 0%;
  min-width: 0;
  height: 20px;
  margin: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.DesignSystem-Slider:disabled { cursor: default; }
.DesignSystem-Slider::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: var(--slider-track);
}
.DesignSystem-Slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: var(--slider-track);
}
.DesignSystem-Slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  margin-top: -8px;
  border: none;
  border-radius: 100px;
  background: var(--slider-thumb);
}
.DesignSystem-Slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 100px;
  background: var(--slider-thumb);
}
.DesignSystem-Slider:focus-visible {
  outline: 2px solid var(--slider-thumb);
  outline-offset: 4px;
  border-radius: 4px;
}
`;

/**
 * Design System slider: a track with a numeric readout beside it, for a value
 * that has a known range. Where a plain number field asks the author to know
 * what a good value is, this shows them where in the range they are.
 *
 * The readout is editable, so a value can still be typed exactly. It is a text
 * field rather than a number input on purpose — typing "0." or "-" mid-entry
 * has to survive, and a number input reports those as empty.
 *
 * @param {number} value - Current value (controlled).
 * @param {(next: number) => void} onChange - Called with the new number.
 * @param {number} [min=0] - Low end of the range.
 * @param {number} [max=1] - High end of the range.
 * @param {number} [step] - Increment; defaults to 1/100th of the range.
 * @param {"primary"|"accent"} [tone="primary"] - Colour family.
 * @param {boolean} [disabled=false] - Disabled state.
 * @param {string} [ariaLabel] - Accessible name when no visible label names it.
 * @param {React.CSSProperties} [style] - Override for the root row.
 *
 * @example
 * <Slider value={size} onChange={setSize} min={0} max={100} tone="accent" />
 */
export default function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step,
  tone = "primary",
  disabled = false,
  ariaLabel,
  style = {},
}) {
  // What the readout shows while it is being typed into. Committing on every
  // keystroke would round-trip through the parent and erase a half-typed
  // number, so the field owns its text until it is blurred.
  const [draft, setDraft] = useState(null);

  const paint = TONES[tone] || TONES.primary;
  const span = max - min || 1;
  const current = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
  const filled = ((current - min) / span) * 100;

  const trackColors = {
    "--slider-thumb": disabled
      ? "var(--MH-Theme-Neutrals-Medium, #A1A1A1)"
      : paint,
    "--slider-track": `linear-gradient(to right, ${
      disabled ? "var(--MH-Theme-Neutrals-Medium, #A1A1A1)" : paint
    } ${filled}%, var(--MH-Theme-Neutrals-Light, #E6E6E6) ${filled}%)`,
  };

  function commit(text) {
    setDraft(null);
    const next = Number(text);
    if (text.trim() === "" || !Number.isFinite(next)) return;
    onChange?.(Math.min(max, Math.max(min, next)));
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TRACK_STYLE }} />
      <div className="DesignSystem-Slider-Row" style={{ ...ROOT_STYLE, ...style }}>
        <input
          type="range"
          className="DesignSystem-Slider"
          style={trackColors}
          min={min}
          max={max}
          step={step ?? span / 100}
          value={current}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(e) => onChange?.(Number(e.target.value))}
        />
        <input
          type="text"
          inputMode="decimal"
          className="DesignSystem-Slider-Readout"
          style={{
            ...READOUT_STYLE,
            ...(disabled
              ? {
                  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
                  borderColor: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
                  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
                }
              : null),
          }}
          value={draft ?? String(round(current))}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(e.currentTarget.value);
          }}
        />
      </div>
    </>
  );
}

// Three decimals is enough to show a 0-to-1 range moving without turning the
// readout into floating point noise.
function round(value) {
  return Math.round(value * 1000) / 1000;
}
