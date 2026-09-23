"use client";

import { useState } from "react";
import styled from "styled-components";
import clsx from "clsx";

/** Props for {@link Input}. Extra props are forwarded to the input/textarea (aria-*, name, min…). */
export interface InputProps
  extends Omit<React.ComponentPropsWithoutRef<"input">, "onChange" | "value" | "type" | "id"> {
  /** Text above the field. Wires up `htmlFor`/`id`. */
  label?: React.ReactNode;
  /** Small helper text below the field. */
  hint?: React.ReactNode;
  /** Current value (controlled). */
  value?: string;
  /** Called with the new string. */
  onChange?: (next: string) => void;
  /** Render a textarea instead of an input. @default false */
  multiline?: boolean;
  /** Textarea rows; `multiline` only. */
  rows?: number;
  /** Disabled state. @default false */
  disabled?: boolean;
  /** Paints the border in the warning colour. @default false */
  invalid?: boolean;
  /** Native input type; single line only. @default "text" */
  type?: string;
  /** Explicit id; one is generated when a label is given. */
  id?: string;
  /** Optional style override for the field box. */
  style?: React.CSSProperties;
  /** Optional style override for the label+field column. */
  wrapperStyle?: React.CSSProperties;
  /** Optional class on the field. */
  className?: string;
}

// MH-Type/body/base — the field text and the label share it, which is what
// makes a stacked label + field read as one control rather than two.
const BODY_BASE_STYLE: React.CSSProperties = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: "16px",
  lineHeight: "24px",
};

const WRAPPER_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "4px",
  width: "100%",
};

const LABEL_STYLE: React.CSSProperties = {
  ...BODY_BASE_STYLE,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const HINT_STYLE: React.CSSProperties = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: "14px",
  lineHeight: "20px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

/**
 * Design System text field. Single line by default; `multiline` renders a
 * textarea with the same box. Matches Figma "Basic Input" (40px, 8px radius,
 * Inter Regular 16/24).
 */
const StyledField = styled.input`
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  margin: 0;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 4px;
  padding-bottom: 4px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: Inter, sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;

  &::placeholder {
    color: var(--MH-Theme-Neutrals-Medium, #a1a1a1);
    opacity: 1;
  }

  /* A textarea grows instead of being pinned to the 40px row, and its text
     needs to start at the top of the box rather than be vertically centred by
     the single-line height. */
  &.DesignSystem-Input--multiline {
    height: auto;
    min-height: 100px;
    padding-top: 8px;
    padding-bottom: 8px;
    resize: vertical;
  }

  &.DesignSystem-Input--invalid {
    border-color: var(--MH-Theme-Warning-Base, #b9261a);
  }

  &:focus {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    box-shadow: 0 0 0 1px var(--MH-Theme-Primary-Dark, #336f8a);
  }

  &:disabled {
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    border-color: var(--MH-Theme-Neutrals-Light, #e6e6e6);
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    cursor: default;
  }
`;

let inputIdCounter = 0;

/**
 * @example
 * <Input label="Name" value={name} onChange={setName} />
 * @example
 * <Input label="Description" multiline value={desc} onChange={setDesc} />
 */
export default function Input({
  label,
  hint,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows,
  disabled = false,
  invalid = false,
  type = "text",
  id,
  style,
  wrapperStyle,
  className,
  ...rest
}: InputProps) {
  const [generatedId] = useState(() => `ds-input-${++inputIdCounter}`);
  const fieldId = id || (label ? generatedId : undefined);

  return (
    <div className="DesignSystem-Input-Wrapper" style={{ ...WRAPPER_STYLE, ...wrapperStyle }}>
      {label ? (
        <label htmlFor={fieldId} style={LABEL_STYLE}>
          {label}
        </label>
      ) : null}
      <StyledField
        as={multiline ? "textarea" : "input"}
        id={fieldId}
        className={clsx(
          "DesignSystem-Input",
          multiline && "DesignSystem-Input--multiline",
          invalid && "DesignSystem-Input--invalid",
          className,
        )}
        style={style}
        value={value ?? ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={multiline ? rows : undefined}
        type={multiline ? undefined : type}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      {hint ? <span style={HINT_STYLE}>{hint}</span> : null}
    </div>
  );
}
