"use client";

import { useState } from "react";

import { CloseIcon } from "./Icons";

// MH-Type/label/base (Inter Medium 14/20). Vertical padding is 6px to hit
// Figma's fixed 32px chip height with this line-height — not on the 4px grid,
// but pixel-precise, so left as-is. Corner radius is a fixed 8px for every
// chip (Figma "Basic Chips" + Material 3), so there is no shape option.
const CHIP_BASE_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  height: "32px",
  paddingLeft: "12px",
  paddingRight: "12px",
  paddingTop: "6px",
  paddingBottom: "6px",
  borderRadius: "8px",
  border: "1px solid #a1a1a1",
  background: "#ffffff",
  backgroundColor: "#ffffff",
  color: "#171717",
  boxSizing: "border-box",
  transition: "background-color 0.2s, border-color 0.2s",
};

const CHIP_SELECTED_STYLE = {
  ...CHIP_BASE_STYLE,
  background: "var(--MH-Theme-Primary-Light, #def8fb)",
  backgroundColor: "var(--MH-Theme-Primary-Light, #def8fb)",
  border: "1px solid var(--MH-Theme-Primary-Base, #69bbc4)",
};

const CHIP_DISABLED_STYLE = {
  ...CHIP_BASE_STYLE,
  background: "#f3f3f3",
  backgroundColor: "#f3f3f3",
  color: "#a1a1a1",
  border: "1px solid #e6e6e6",
  cursor: "default",
  pointerEvents: "none",
};

// Non-interactive display chip — Figma "Non-Interactive" state: filled, no
// border, no hover, no trailing/close affordance. Used for read-only tags,
// statuses and metadata. `tone` swaps the fill/text pair for semantic statuses;
// toned chips stay fill-only (no outline), matching the Figma treatment.
const CHIP_STATIC_STYLE = {
  ...CHIP_BASE_STYLE,
  border: "none",
  cursor: "default",
};

const CHIP_TONES = {
  default: {
    background: "var(--MH-Theme-Primary-Light, #def8fb)",
    color: "#171717",
  },
  neutral: {
    // Figma's Non-Interactive chip labels in Neutrals/Black; keep that here so a
    // neutral static chip reads as quiet-but-active, not disabled (Neutrals/Dark
    // #6a6a6a on this fill is ~3.9:1 — below AA and too close to the disabled grey).
    background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
    color: "var(--MH-Theme-Neutrals-Black, #171717)",
  },
  success: {
    background: "var(--MH-Theme-Success, #e3f4ec)",
    color: "var(--MH-Theme-Success-Dark, #1d6b3a)",
  },
  warning: {
    background: "var(--MH-Theme-Warning-Light, #fdf6e8)",
    color: "var(--MH-Theme-Warning-Dark, #8a6d3b)",
  },
  info: {
    background: "var(--MH-Theme-Primary-Light, #def8fb)",
    color: "var(--MH-Theme-Primary-Dark, #336f8a)",
  },
  danger: {
    background: "var(--MH-Theme-Danger-Light, #fdecea)",
    color: "var(--MH-Theme-Danger-Dark, #b3261e)",
  },
};

const CHIP_WITH_LEADING = {
  paddingLeft: "4px",
};
const CHIP_WITH_CLOSE = {
  paddingRight: "8px",
};

const CLOSE_BUTTON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  padding: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  borderRadius: "4px",
  flexShrink: 0,
};

const CHIP_FOCUS_STYLE = `
.DesignSystem-Chip:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
  outline-offset: 2px;
}
.DesignSystem-Chip [data-chip-close]:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
  outline-offset: 2px;
}
`;

/**
 * Reusable chip for tags, filters, statuses and removable tokens.
 * Matches Figma "Basic Chips": fixed 32px height, 8px corners, Inter Medium
 * 14/20 label, label-only / label + icon / label + avatar, optional close.
 *
 * Two variants:
 *  - "interactive" (default): white + 1px border; hover fills grey; `selected`
 *    fills primary-light with a 2px primary border; supports `onClick`,
 *    `onClose`, `disabled`.
 *  - "static": non-interactive display chip — primary-light fill, no border,
 *    no hover, no close/trailing. For read-only tags and statuses.
 *
 * @param {React.ReactNode} label - Main text (required).
 * @param {"interactive"|"static"} [variant="interactive"] - Interaction model (see above).
 * @param {"default"|"neutral"|"success"|"warning"|"info"|"danger"} [tone="default"] - Static chips only: semantic fill/text pair for statuses.
 * @param {boolean} [selected=false] - Selected state (interactive only): primary-light fill + primary border.
 * @param {boolean} [pressed] - Optional toggle pressed state; when provided, sets aria-pressed.
 * @param {boolean} [disabled=false] - Disabled state (interactive only): greyed, not clickable.
 * @param {() => void} [onClick] - Fired when the chip body is clicked; ignored for static chips and when close/trailing is clicked.
 * @param {() => void} [onClose] - If provided (interactive only), a close (X) icon is shown and this is called when it is clicked.
 * @param {React.ReactNode} [leading] - Optional leading content (icon or avatar, typically 24px).
 * @param {React.ReactNode} [trailing] - Optional trailing content (interactive only); rendered before the close icon.
 * @param {React.CSSProperties} [style] - Optional override for the root chip container.
 * @param {string} [className] - Optional class for the root (e.g. for parent layout).
 * @param {string} [ariaLabel] - Optional accessible name (e.g. icon-only chips).
 * @param {string} [title] - Optional native tooltip on the root.
 * @param {number} [labelLines=1] - Max lines for label text (1 = single line, no wrap).
 *
 * @example
 * // Read-only tag
 * <Chip label="Biology" variant="static" />
 *
 * @example
 * // Removable filter chip
 * <Chip label="Filter A" onClose={() => remove('A')} />
 *
 * @example
 * // Selectable chip with icon
 * <Chip label="Option" selected={isSelected} onClick={() => toggle()} leading={<Icon />} />
 */
export default function Chip({
  label,
  variant = "interactive",
  tone = "default",
  selected = false,
  pressed,
  disabled = false,
  onClick,
  onClose,
  leading,
  trailing,
  style = {},
  className,
  ariaLabel,
  title,
  labelLines = 1,
}) {
  const [hovered, setHovered] = useState(false);

  const isStatic = variant === "static";
  const isInteractive = !isStatic && !disabled;
  const isClickable = isInteractive && typeof onClick === "function";
  const hasLeading = leading != null;
  const hasTrailing = isInteractive && trailing != null;
  const hasClose = isInteractive && typeof onClose === "function";
  // Figma only shows a hover state for chips you can actually act on.
  const canHover = isInteractive && (isClickable || hasClose);
  const isPressed = typeof pressed === "boolean" ? pressed : selected;

  let rootStyle = { ...CHIP_BASE_STYLE };
  if (isStatic) {
    const toneStyle = CHIP_TONES[tone] ?? CHIP_TONES.default;
    rootStyle = {
      ...CHIP_STATIC_STYLE,
      background: toneStyle.background,
      backgroundColor: toneStyle.background,
      color: toneStyle.color,
    };
  } else if (disabled) {
    rootStyle = { ...CHIP_DISABLED_STYLE };
  } else if (selected || isPressed) {
    rootStyle = { ...CHIP_SELECTED_STYLE };
    if (hovered && canHover) {
      // Deepen the primary-light fill on hover rather than dropping to grey —
      // same move as Button's tonal hover (one step past Primary Light, short
      // of Primary Medium), so a selected chip stays on-theme while hovered.
      rootStyle = { ...rootStyle, backgroundColor: "#C0EAEF" };
    }
  } else if (hovered && canHover) {
    rootStyle = { ...rootStyle, backgroundColor: "#f3f3f3" };
  }
  if (hasLeading) {
    rootStyle = { ...rootStyle, ...CHIP_WITH_LEADING };
  }
  if (hasClose) {
    rootStyle = { ...rootStyle, ...CHIP_WITH_CLOSE };
  }
  const multilineLabel = labelLines > 1;
  if (multilineLabel) {
    rootStyle = {
      ...rootStyle,
      display: "flex",
      width: "100%",
      height: "auto",
      minHeight: 32,
      alignItems: "center",
    };
  }
  rootStyle = { ...rootStyle, ...style };

  const labelStyle = multilineLabel
    ? {
        flex: 1,
        minWidth: 0,
        display: "-webkit-box",
        WebkitLineClamp: labelLines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        whiteSpace: "normal",
        overflowWrap: "break-word",
      }
    : { flexShrink: 0 };

  const handleRootClick = (e) => {
    if (!isClickable) return;
    const target = e.target;
    const isClose = target.closest?.("[data-chip-close]");
    const isTrailing = target.closest?.("[data-chip-trailing]");
    if (isClose || isTrailing) return;
    onClick(e);
  };

  const handleKeyDown = (e) => {
    if (!isClickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const target = e.target;
      const isClose = target.closest?.("[data-chip-close]");
      const isTrailing = target.closest?.("[data-chip-trailing]");
      if (!isClose && !isTrailing) onClick(e);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CHIP_FOCUS_STYLE }} />
      <div
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={ariaLabel}
        aria-pressed={isClickable && typeof pressed === "boolean" ? pressed : undefined}
        title={title}
        className={
          className
            ? `DesignSystem-Chip MH-Type-Label-Base ${className}`
            : "DesignSystem-Chip MH-Type-Label-Base"
        }
        style={{
          ...rootStyle,
          cursor: isClickable ? "pointer" : "default",
        }}
        onClick={handleRootClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={canHover ? () => setHovered(true) : undefined}
        onMouseLeave={canHover ? () => setHovered(false) : undefined}
      >
        {leading && (
          <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{leading}</span>
        )}
        <span style={labelStyle}>{label}</span>
        {hasTrailing && (
          <span
            data-chip-trailing
            style={{ flexShrink: 0, display: "inline-flex", alignItems: "center" }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {trailing}
          </span>
        )}
        {hasClose && (
          <button
            type="button"
            data-chip-close
            style={CLOSE_BUTTON_STYLE}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <CloseIcon width={18} height={18} style={{ display: "block" }} />
          </button>
        )}
      </div>
    </>
  );
}
