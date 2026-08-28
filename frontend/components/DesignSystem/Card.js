"use client";

import { createElement, useState } from "react";
import Link from "next/link";

/**
 * Card surface (Figma Design System node 1143:2619). Owns the container look
 * (12px radius, background, border) and the Material 3 interaction states; the
 * card's content and layout live in the calling component.
 *
 * Two modes:
 *  - static (no `href`): a plain container. No hover or pressed styling.
 *  - interactive (`href` set): the whole card is a link. A full-bleed <Link> is
 *    rendered as the last child, painted over the content; anything in the
 *    content marked as an interactive island (`<a>`, `<button>`, or
 *    `[data-card-action]`) is lifted above that link with `z-index`, so it keeps
 *    its own click without triggering the card. The islands stay plain siblings
 *    in the DOM — no nested anchors, natural tab order.
 *
 * Hover is deliberately quiet, per the interaction spec: elevated cards change
 * elevation only; filled and outline cards take a whisper of extra tint plus a
 * small shadow. Pressed is one gentle step further.
 *
 * @param {"elevated"|"filled"|"outline"} [variant="elevated"] - Surface style.
 * @param {string|object} [href] - When set, the whole card links here.
 * @param {(e) => void} [onClick] - Passed to the card link (interactive only).
 * @param {string} [ariaLabel] - Accessible name for the card link.
 * @param {number|string} [padding=16] - Inner padding. Pass 0 for image-topped cards.
 * @param {string} [as="article"] - Root element tag.
 * @param {string} [className] - Optional extra class on the root.
 * @param {object} [style] - Optional root style override.
 * @param {React.ReactNode} children - Card content.
 */
// Fallback matches IconButton's Elevation Medium so cards and their buttons cast
// the same shadow.
const ELEVATION = "var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0, 0, 0, 0.1))";
const ELEVATION_SM =
  "var(--MH-Theme-Elevation-Small, 1px 1px 4px rgba(0, 0, 0, 0.08))";
const OUTLINE_BORDER = "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)";

const VARIANTS = {
  elevated: {
    base: { background: "#FFFFFF" },
    // Elevation only — no colour shift.
    hover: { background: "#FFFFFF", boxShadow: ELEVATION },
    pressed: { background: "#FFFFFF", boxShadow: ELEVATION_SM },
  },
  filled: {
    base: { background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)" },
    hover: { background: "#EFEFEF", boxShadow: ELEVATION_SM },
    pressed: { background: "#EBEBEB", boxShadow: "none" },
  },
  outline: {
    base: { background: "#FFFFFF", border: OUTLINE_BORDER },
    hover: { background: "#FAFAFA", border: OUTLINE_BORDER, boxShadow: ELEVATION_SM },
    pressed: { background: "#F4F4F4", border: OUTLINE_BORDER, boxShadow: "none" },
  },
};

const ROOT_STYLE = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  boxSizing: "border-box",
  borderRadius: "12px",
  transition: "background-color 0.2s, box-shadow 0.2s",
  // Not clipped: the hover shadow paints outside the box, and interactive cards
  // host overflowing children (e.g. a settings dropdown). Cards clip their own
  // top media to the radius instead.
  overflow: "visible",
};

const CONTENT_STYLE = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minHeight: 0,
};

const CARD_CSS = `
.DesignSystem-Card-link {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 12px;
  font-size: 0;
}
.DesignSystem-Card-link:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);
  outline-offset: 2px;
}
/* Interactive islands sit above the card link so their own click wins. */
.DesignSystem-Card--interactive > .DesignSystem-Card-content a,
.DesignSystem-Card--interactive > .DesignSystem-Card-content button,
.DesignSystem-Card--interactive > .DesignSystem-Card-content [data-card-action] {
  position: relative;
  z-index: 1;
}
/* Some pages fade every link/button on hover; that must not dim card internals. */
.DesignSystem-Card a:hover,
.DesignSystem-Card button:hover {
  opacity: 1;
}
`;

export default function Card({
  variant = "elevated",
  href = null,
  onClick,
  ariaLabel,
  padding = 16,
  as = "article",
  className,
  style = {},
  children,
  ...rest
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const interactive = href != null;
  const tokens = VARIANTS[variant] || VARIANTS.elevated;

  let rootStyle = { ...ROOT_STYLE, ...tokens.base };
  if (interactive && pressed) {
    rootStyle = { ...rootStyle, ...tokens.pressed };
  } else if (interactive && hovered) {
    rootStyle = { ...rootStyle, ...tokens.hover };
  }
  rootStyle = { ...rootStyle, ...style };

  const rootClass = [
    "DesignSystem-Card",
    interactive ? "DesignSystem-Card--interactive" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Pressing an island (star, settings) shouldn't flash the card's pressed
  // state — that reads as "the card was clicked".
  const isIsland = (target) =>
    !!target?.closest?.("a, button, [data-card-action]");

  const interactionHandlers = interactive
    ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => {
          setHovered(false);
          setPressed(false);
        },
        onMouseDown: (e) => {
          if (!isIsland(e.target)) setPressed(true);
        },
        onMouseUp: () => setPressed(false),
      }
    : {};

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CARD_CSS }} />
      {createElement(
        as,
        { className: rootClass, style: rootStyle, ...interactionHandlers, ...rest },
        <div
          className="DesignSystem-Card-content"
          style={{ ...CONTENT_STYLE, padding }}
        >
          {children}
        </div>,
        interactive ? (
          <Link
            href={href}
            onClick={onClick}
            aria-label={ariaLabel}
            className="DesignSystem-Card-link"
          >
            <span
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
                whiteSpace: "nowrap",
                border: 0,
              }}
            >
              {ariaLabel}
            </span>
          </Link>
        ) : null
      )}
    </>
  );
}
