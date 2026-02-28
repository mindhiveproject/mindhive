"use client";

import { useState } from "react";

const CLOSE_ICON = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, display: "block" }}
    aria-hidden
  >
    <path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
      fill="currentColor"
    />
  </svg>
);

const BORDER_RADIUS = {
  square: "8px",
  pill: "100px",
};

const CHIP_BASE_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  height: "32px",
  paddingLeft: "12px",
  paddingRight: "12px",
  paddingTop: "6px",
  paddingBottom: "6px",
  border: "1px solid #a1a1a1",
  background: "#ffffff",
  backgroundColor: "#ffffff",
  color: "#171717",
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "20px",
  boxSizing: "border-box",
  transition: "background-color 0.2s, border-color 0.2s",
};

const CHIP_SELECTED_STYLE = {
  ...CHIP_BASE_STYLE,
  background: "#def8fb",
  backgroundColor: "#def8fb",
  border: "none",
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

/**
 * Reusable input chip (pill) for tags, filters, and removable tokens.
 * Matches Figma Basic Chips: label-only, label + icon/avatar, optional close and trailing actions.
 *
 * @param {React.ReactNode} label - Main text (required).
 * @param {boolean} [selected=false] - Visual selected state (primary light background when true).
 * @param {boolean} [disabled=false] - Disabled state (greyed, not clickable).
 * @param {() => void} [onClick] - Fired when the chip body is clicked; not fired when close or trailing is clicked.
 * @param {() => void} [onClose] - If provided, a close (X) icon is shown and this is called when it is clicked.
 * @param {React.ReactNode} [leading] - Optional leading content (icon or avatar, typically 24px).
 * @param {React.ReactNode} [trailing] - Optional trailing content (e.g. star for favorite); rendered before the close icon.
 * @param {"square"|"pill"} [shape="pill"] - Corner radius: "square" (8px) or "pill" (100px).
 * @param {React.CSSProperties} [style] - Optional override for the root chip container.
 * @param {string} [className] - Optional class for the root (e.g. for parent layout).
 *
 * @example
 * // Removable chip
 * <Chip label="Filter A" onClose={() => remove('A')} />
 *
 * @example
 * // Selectable chip with icon
 * <Chip label="Option" selected={isSelected} onClick={() => toggle()} leading={<Icon />} />
 *
 * @example
 * // Chip with favorite star (trailing) and close
 * <Chip label="Tag" trailing={<StarIcon onClick={toggleFav} />} onClose={onRemove} />
 */
export default function Chip({
  label,
  selected = false,
  disabled = false,
  onClick,
  onClose,
  leading,
  trailing,
  shape = "pill",
  style = {},
  className,
}) {
  const [hovered, setHovered] = useState(false);

  const hasLeading = leading != null;
  const hasClose = typeof onClose === "function";
  const borderRadius = BORDER_RADIUS[shape] ?? BORDER_RADIUS.pill;

  let rootStyle = { ...CHIP_BASE_STYLE };
  if (disabled) {
    rootStyle = { ...CHIP_DISABLED_STYLE };
  } else if (selected) {
    rootStyle = { ...CHIP_SELECTED_STYLE };
    if (hovered) {
      rootStyle = { ...rootStyle, backgroundColor: "#e6e6e6" };
    }
  } else {
    if (hovered) {
      rootStyle = { ...rootStyle, backgroundColor: "#f3f3f3" };
    }
  }
  if (hasLeading) {
    rootStyle = { ...rootStyle, ...CHIP_WITH_LEADING };
  }
  if (hasClose) {
    rootStyle = { ...rootStyle, ...CHIP_WITH_CLOSE };
  }
  rootStyle = { ...rootStyle, borderRadius, ...style };

  const isClickable = !disabled && onClick;
  const handleRootClick = (e) => {
    if (disabled || !onClick) return;
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
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={className}
      style={{
        ...rootStyle,
        cursor: disabled ? "default" : isClickable ? "pointer" : "default",
      }}
      onClick={handleRootClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {leading && <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{leading}</span>}
      <span style={{ flexShrink: 0 }}>{label}</span>
      {trailing != null && (
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
          {CLOSE_ICON}
        </button>
      )}
    </div>
  );
}
