"use client";

import { useState } from "react";

const BASE_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "40px",
  height: "40px",
  padding: "8px",
  borderRadius: "100px",
  boxSizing: "border-box",
  border: "none",
  cursor: "pointer",
  transition:
    "background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s, opacity 0.2s",
};

// --- Filled (Figma Icon Button 1049:4895)
const FILLED_BASE = {
  ...BASE_STYLE,
  background: "var(--MH-Theme-Primary-Dark, #336F8A)",
  color: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
};
const FILLED_HOVER = {
  background: "var(--MH-Theme-Accent-Medium, #F9D978)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  boxShadow: "var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0,0,0,0.1))",
};
const FILLED_PRESSED = {
  background: "var(--MH-Theme-Primary-Medium, #A3D6DB)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};
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
  color: "var(--MH-Theme-Primary-Base, #69BBC4)",
  border: "1px solid var(--MH-Theme-Primary-Base, #69BBC4)",
};
const OUTLINE_HOVER = {
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  border: "1px solid var(--MH-Theme-Primary-Base, #69BBC4)",
  opacity: 0.8,
};
const OUTLINE_PRESSED = {
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  border: "1px solid var(--MH-Theme-Primary-Base, #69BBC4)",
  opacity: 1,
};
const OUTLINE_DISABLED = {
  background: "transparent",
  color: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  cursor: "default",
  opacity: 1,
};

// --- Tonal (Primary Light — Icon Button DS, not Accent)
const TONAL_BASE = {
  ...BASE_STYLE,
  background: "var(--MH-Theme-Primary-Light, #DEF8FB)",
  color: "var(--MH-Theme-Primary-Dark, #336F8A)",
};
const TONAL_HOVER = {
  background: "var(--MH-Theme-Primary-Light, #DEF8FB)",
  boxShadow: "var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0,0,0,0.1))",
};
const TONAL_PRESSED = {
  background: "#F4F8F7",
  boxShadow: "none",
};
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
  color: "var(--MH-Theme-Primary-Dark, #336F8A)",
};
const TEXT_HOVER = {
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
};
const TEXT_PRESSED = {
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};
const TEXT_DISABLED = {
  background: "transparent",
  color: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  cursor: "default",
};

function getVariantStyles(variant) {
  switch (variant) {
    case "outline":
      return {
        base: OUTLINE_BASE,
        hover: OUTLINE_HOVER,
        pressed: OUTLINE_PRESSED,
        disabled: OUTLINE_DISABLED,
      };
    case "tonal":
      return {
        base: TONAL_BASE,
        hover: TONAL_HOVER,
        pressed: TONAL_PRESSED,
        disabled: TONAL_DISABLED,
      };
    case "text":
      return {
        base: TEXT_BASE,
        hover: TEXT_HOVER,
        pressed: TEXT_PRESSED,
        disabled: TEXT_DISABLED,
      };
    case "filled":
    default:
      return {
        base: FILLED_BASE,
        hover: FILLED_HOVER,
        pressed: FILLED_PRESSED,
        disabled: FILLED_DISABLED,
      };
  }
}

const FOCUS_VISIBLE_STYLE =
  ".DesignSystem-IconButton:focus-visible {" +
  "outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);" +
  "outline-offset: 2px;" +
  "}" +
  ".DesignSystem-IconButton-Icon svg {" +
  "display: block;" +
  "width: 24px;" +
  "height: 24px;" +
  "}" +
  ".DesignSystem-IconButton-Icon img {" +
  "display: block;" +
  "width: 24px;" +
  "height: 24px;" +
  "}";

const ICON_WRAPPER_STYLE = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  color: "currentColor",
};

/**
 * Design System Icon Button. Circular 40px control for icon-only actions.
 * Four variants: filled, outline, tonal, text. Matches Figma (node 1049-4895).
 *
 * @param {"filled"|"outline"|"tonal"|"text"} [variant="filled"] - Visual style.
 * @param {React.ReactNode} icon - 24px icon (required).
 * @param {boolean} [disabled=false] - Disabled state.
 * @param {"button"|"submit"|"reset"} [type="button"] - Native button type.
 * @param {function} [onClick] - Click handler.
 * @param {string} [ariaLabel] - Accessible name (required for icon-only buttons).
 * @param {string} [title] - Optional native tooltip.
 * @param {string} [className] - Optional root class.
 * @param {object} [style] - Optional style override (e.g. type-colored Add).
 * @param {object} [rest] - Remaining props forwarded to button.
 */
export default function IconButton({
  variant = "filled",
  icon = null,
  disabled = false,
  type = "button",
  onClick,
  ariaLabel,
  title,
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
  } else if (pressed) {
    buttonStyle = { ...buttonStyle, ...styles.pressed };
  } else if (hovered) {
    buttonStyle = { ...buttonStyle, ...styles.hover };
  }

  buttonStyle = { ...buttonStyle, ...style };

  const buttonClassName = className
    ? "DesignSystem-IconButton " + className
    : "DesignSystem-IconButton";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOCUS_VISIBLE_STYLE }} />
      <button
        type={type}
        className={buttonClassName}
        style={buttonStyle}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        title={title}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        {...rest}
      >
        <span
          className="DesignSystem-IconButton-Icon"
          style={ICON_WRAPPER_STYLE}
          aria-hidden
        >
          {icon}
        </span>
      </button>
    </>
  );
}
