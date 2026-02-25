"use client";

import { useState } from "react";

// Shared base: 40px height, 8px vertical padding, 24px horizontal, pill radius, Inter Semi Bold 14/20
const BASE_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  height: "40px",
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "24px",
  paddingRight: "24px",
  borderRadius: "100px",
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "20px",
  boxSizing: "border-box",
  border: "none",
  cursor: "pointer",
  transition: "background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s",
};

// With leading icon: left padding 16px (Figma spec)
const WITH_LEADING_ICON = {
  paddingLeft: "16px",
};

// --- Filled
const FILLED_BASE = {
  ...BASE_STYLE,
  background: "var(--MH-Theme-Primary-Dark, #336F8A)",
  color: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
};
const FILLED_HOVER = { boxShadow: "var(--MH-Theme-Elevation-High, 2px 2px 12px rgba(0,0,0,0.15))" };
const FILLED_PRESSED = { background: "var(--MH-Theme-Primary-Base, #69BBC4)" };
const FILLED_DISABLED = {
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
  cursor: "default",
  boxShadow: "none",
};

// --- Outline
const OUTLINE_BASE = {
  ...BASE_STYLE,
  background: "transparent",
  color: "var(--MH-Theme-Primary-Dark, #336F8A)",
  border: "1px solid var(--MH-Theme-Primary-Dark, #336F8A)",
};
const OUTLINE_HOVER = { background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)" };
const OUTLINE_PRESSED = { background: "var(--MH-Theme-Primary-Light, #DEF8FB)" };
const OUTLINE_DISABLED = {
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  color: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  background: "transparent",
  cursor: "default",
};

// --- Tonal
const TONAL_BASE = {
  ...BASE_STYLE,
  background: "var(--MH-Theme-Accent-Medium, #F9D978)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};
const TONAL_HOVER = { boxShadow: "var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0,0,0,0.1))" };
const TONAL_PRESSED = { background: "var(--MH-Theme-Accent-Light, #FDF2D0)" };
const TONAL_DISABLED = {
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
  cursor: "default",
  boxShadow: "none",
};

// --- Text
const TEXT_BASE = {
  ...BASE_STYLE,
  background: "transparent",
  color: "var(--MH-Theme-Primary-Base, #69BBC4)",
};
const TEXT_HOVER = { background: "#F3F3F3" };
const TEXT_PRESSED = { background: "#E6E6E6" };
const TEXT_DISABLED = {
  color: "#A1A1A1",
  background: "transparent",
  cursor: "default",
};

function getVariantStyles(variant) {
  switch (variant) {
    case "outline":
      return { base: OUTLINE_BASE, hover: OUTLINE_HOVER, pressed: OUTLINE_PRESSED, disabled: OUTLINE_DISABLED };
    case "tonal":
      return { base: TONAL_BASE, hover: TONAL_HOVER, pressed: TONAL_PRESSED, disabled: TONAL_DISABLED };
    case "text":
      return { base: TEXT_BASE, hover: TEXT_HOVER, pressed: TEXT_PRESSED, disabled: TEXT_DISABLED };
    case "filled":
    default:
      return { base: FILLED_BASE, hover: FILLED_HOVER, pressed: FILLED_PRESSED, disabled: FILLED_DISABLED };
  }
}

const FOCUS_VISIBLE_STYLE = `
.DesignSystem-Button:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);
  outline-offset: 2px;
}
`;

const LEADING_ICON_WRAPPER_STYLE = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  color: "currentColor",
};

/**
 * Design System Button. Four variants: filled, outline, tonal, text.
 * Optional leading icon (24px). States: enabled, hover, pressed, disabled.
 * Matches Figma Design System (node 1049-3662).
 *
 * @param {"filled"|"outline"|"tonal"|"text"} [variant="filled"] - Visual style.
 * @param {React.ReactNode} children - Button label (required).
 * @param {React.ReactNode} [leadingIcon] - Optional 24px icon left of label.
 * @param {boolean} [disabled=false] - Disabled state.
 * @param {"button"|"submit"|"reset"} [type="button"] - Native button type.
 * @param {(e: React.MouseEvent<HTMLButtonElement>) => void} [onClick] - Click handler.
 * @param {string} [className] - Optional root class.
 * @param {React.CSSProperties} [style] - Optional style override.
 * @param {object} [rest] - Remaining props (e.g. aria-*, id) forwarded to <button>.
 *
 * @example
 * <Button variant="text">Cancel</Button>
 * @example
 * <Button variant="filled" leadingIcon={<CheckIcon />}>Save</Button>
 * @example
 * <Button variant="outline" disabled>Submit</Button>
 */
export default function Button({
  variant = "filled",
  children,
  leadingIcon = null,
  disabled = false,
  type = "button",
  onClick,
  className,
  style = {},
  ...rest
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const styles = getVariantStyles(variant);
  let buttonStyle = { ...styles.base };

  if (disabled) {
    buttonStyle = { ...buttonStyle, ...styles.disabled };
  } else {
    if (pressed) {
      buttonStyle = { ...buttonStyle, ...styles.pressed };
    } else if (hovered) {
      buttonStyle = { ...buttonStyle, ...styles.hover };
    }
  }

  if (leadingIcon != null) {
    buttonStyle = { ...buttonStyle, ...WITH_LEADING_ICON };
  }

  buttonStyle = { ...buttonStyle, ...style };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOCUS_VISIBLE_STYLE }} />
      <button
        type={type}
        className={className ? `DesignSystem-Button ${className}` : "DesignSystem-Button"}
        style={buttonStyle}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        {...rest}
      >
        {leadingIcon != null && (
          <span style={LEADING_ICON_WRAPPER_STYLE} aria-hidden>
            {leadingIcon}
          </span>
        )}
        {children}
      </button>
    </>
  );
}
