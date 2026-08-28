"use client";

import { useState } from "react";

import { StarFilledIcon, StarIcon } from "./Icons";

/**
 * Star toggle used on cards (Figma Design System node 5082:1655). A 40px circle:
 *
 *  - inactive: Neutrals/Lighter fill behind a black outline star.
 *  - active:   Accent/Light fill behind a filled Accent star.
 *
 * Hover deepens whichever fill is showing — "more ink, same hue", no drop
 * shadow — so the on/off read stays clear across a grid of cards.
 *
 * Controlled and data-free: the caller owns `active` and `onToggle`. It also
 * stops the event so the button can sit on top of a clickable card without
 * triggering the card's link.
 *
 * @param {boolean} [active=false] - Whether the item is favorited.
 * @param {(e) => void} [onToggle] - Fired on click (event already stopped).
 * @param {string} addLabel - Accessible name when inactive ("Add to favorites").
 * @param {string} removeLabel - Accessible name when active ("Remove from favorites").
 * @param {boolean} [disabled=false] - Disabled state.
 * @param {string} [className] - Optional extra class on the root.
 * @param {object} [rest] - Forwarded to the button (e.g. data-card-action).
 */
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
  transition: "background-color 0.2s, color 0.2s",
};

const INACTIVE = {
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};
const INACTIVE_HOVER = { background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)" };

const ACTIVE = {
  background: "var(--MH-Theme-Accent-Light, #FDF2D0)",
  color: "var(--MH-Theme-Accent-Base, #F2BE42)",
};
const ACTIVE_HOVER = { background: "#FBE9B8" };

const DISABLED = {
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  color: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  cursor: "default",
};

const FOCUS_STYLE = `
.DesignSystem-FavoriteButton:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);
  outline-offset: 2px;
}
.DesignSystem-FavoriteButton svg {
  display: block;
  width: 24px;
  height: 24px;
}
`;

export default function FavoriteButton({
  active = false,
  onToggle,
  addLabel,
  removeLabel,
  disabled = false,
  className,
  ...rest
}) {
  const [hovered, setHovered] = useState(false);

  let style = { ...BASE_STYLE, ...(active ? ACTIVE : INACTIVE) };
  if (disabled) {
    style = { ...style, ...DISABLED };
  } else if (hovered) {
    style = { ...style, ...(active ? ACTIVE_HOVER : INACTIVE_HOVER) };
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOCUS_STYLE }} />
      <button
        type="button"
        className={
          className
            ? "DesignSystem-FavoriteButton " + className
            : "DesignSystem-FavoriteButton"
        }
        style={style}
        disabled={disabled}
        aria-pressed={active}
        aria-label={active ? removeLabel : addLabel}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) onToggle?.(e);
        }}
        {...rest}
      >
        <span aria-hidden style={{ display: "flex", width: 24, height: 24 }}>
          {active ? <StarFilledIcon /> : <StarIcon />}
        </span>
      </button>
    </>
  );
}
