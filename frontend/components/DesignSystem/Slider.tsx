"use client";

import { useState } from "react";
import styled from "styled-components";

/** Colour family for a {@link Slider} track and thumb, matching Button's `tone`. */
export type SliderTone = "primary" | "accent";

/** Props for {@link Slider}. */
export interface SliderProps {
  /** Current value (controlled). */
  value: number;
  /** Called with the new number. */
  onChange?: (next: number) => void;
  /** Low end of the range. @default 0 */
  min?: number;
  /** High end of the range. @default 1 */
  max?: number;
  /** Increment; defaults to 1/100th of the range. */
  step?: number;
  /** Colour family. @default "primary" */
  tone?: SliderTone;
  /** Disabled state. @default false */
  disabled?: boolean;
  /** Accessible name when no visible label names it. */
  ariaLabel?: string;
  /** Optional style override for the root row. */
  style?: React.CSSProperties;
}

// The colour families the track and thumb can be painted in, matching Button's
// `tone` so a slider sits inside a toned group without standing out.
const TONES: Record<SliderTone, string> = {
  primary: "var(--MH-Theme-Primary-Dark, #336F8A)",
  accent: "var(--MH-Theme-Additional-Accent-Base, #6F26CE)",
};

const StyledRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
`;

// The range input's own chrome is replaced wholesale: a 4px track with the
// filled portion painted by a gradient, and a 20px thumb over it. Both vendor
// thumb pseudo-elements have to be written out — a shared selector list is
// dropped entirely by each browser that doesn't recognise the other's half.
const StyledTrack = styled.input`
  -webkit-appearance: none;
  appearance: none;
  flex: 1 1 0%;
  min-width: 0;
  height: 20px;
  margin: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }
  &::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: var(--slider-track);
  }
  &::-moz-range-track {
    height: 4px;
    border-radius: 2px;
    background: var(--slider-track);
  }
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    margin-top: -8px;
    border: none;
    border-radius: 100px;
    background: var(--slider-thumb);
  }
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 100px;
    background: var(--slider-thumb);
  }
  &:focus-visible {
    outline: 2px solid var(--slider-thumb);
    outline-offset: 4px;
    border-radius: 4px;
  }
`;

// The readout is fixed-width rather than shrink-to-fit so the track doesn't
// twitch sideways as the digits change while you drag.
const StyledReadout = styled.input`
  flex-shrink: 0;
  box-sizing: border-box;
  width: 72px;
  height: 40px;
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font-family: Inter, sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  text-align: right;
  outline: none;

  &:disabled {
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    border-color: var(--MH-Theme-Neutrals-Light, #e6e6e6);
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
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
  style,
}: SliderProps) {
  // What the readout shows while it is being typed into. Committing on every
  // keystroke would round-trip through the parent and erase a half-typed
  // number, so the field owns its text until it is blurred.
  const [draft, setDraft] = useState<string | null>(null);

  const paint = TONES[tone] ?? TONES.primary;
  const span = max - min || 1;
  const current = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
  const filled = ((current - min) / span) * 100;

  const trackColors = {
    "--slider-thumb": disabled ? "var(--MH-Theme-Neutrals-Medium, #A1A1A1)" : paint,
    "--slider-track": `linear-gradient(to right, ${
      disabled ? "var(--MH-Theme-Neutrals-Medium, #A1A1A1)" : paint
    } ${filled}%, var(--MH-Theme-Neutrals-Light, #E6E6E6) ${filled}%)`,
  } as React.CSSProperties;

  function commit(text: string) {
    setDraft(null);
    const next = Number(text);
    if (text.trim() === "" || !Number.isFinite(next)) return;
    onChange?.(Math.min(max, Math.max(min, next)));
  }

  return (
    <StyledRow className="DesignSystem-Slider-Row" style={style}>
      <StyledTrack
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
      <StyledReadout
        type="text"
        inputMode="decimal"
        className="DesignSystem-Slider-Readout"
        value={draft ?? String(round(current))}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
        }}
      />
    </StyledRow>
  );
}

// Three decimals is enough to show a 0-to-1 range moving without turning the
// readout into floating point noise.
function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
