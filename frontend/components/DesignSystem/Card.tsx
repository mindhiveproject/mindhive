"use client";

import { useState } from "react";
import styled from "styled-components";
import clsx from "clsx";
import Link from "next/link";
import type { LinkProps } from "next/link";

/** Surface style for a {@link Card}. */
export type CardVariant = "elevated" | "filled" | "outline";

/** Props for {@link Card}. Any extra prop is spread onto the root element. */
export interface CardProps {
  /** Surface style. @default "elevated" */
  variant?: CardVariant;
  /** When set, the whole card becomes a link to this destination. */
  href?: LinkProps["href"] | null;
  /** Passed to the card link (interactive only). */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Accessible name for the card link. */
  ariaLabel?: string;
  /** Inner padding. Pass 0 for image-topped cards. @default 16 */
  padding?: number | string;
  /** Root element tag. @default "article" */
  as?: React.ElementType;
  /** Optional extra class on the root. */
  className?: string;
  /** Optional root style override. */
  style?: React.CSSProperties;
  /** Card content. */
  children: React.ReactNode;
  /** Extra props are spread onto the root element. */
  [key: string]: unknown;
}

/**
 * Card surface (Figma Design System node 1143:2619). Owns the container look
 * (12px radius, background, border) and the Material 3 interaction states; the
 * card's content and layout live in the calling component.
 *
 * Two modes:
 *  - static (no `href`): a plain container. No hover or pressed styling.
 *  - interactive (`href` set): the whole card is a link. A full-bleed `<Link>` is
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
 * Hover is plain CSS (`:hover`, scoped to the `--interactive` modifier class).
 * Pressed stays JS-driven (a `--pressed` class toggled from `pressed` state)
 * because native `:active` also fires for a click on a nested island (the star,
 * the settings menu) — see `isIsland` below — and CSS alone can't exclude that.
 */
// Fallback matches IconButton's Elevation Medium so cards and their buttons cast
// the same shadow.
const ELEVATION = "var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0, 0, 0, 0.1))";
const ELEVATION_SM =
  "var(--MH-Theme-Elevation-Small, 1px 1px 4px rgba(0, 0, 0, 0.08))";
const ELEVATION_HIGH =
  "var(--MH-Theme-Elevation-High, 2px 2px 12px rgba(0, 0, 0, 0.19))";
const OUTLINE_BORDER = "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)";

const StyledCard = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  transition: background-color 0.2s, box-shadow 0.2s;
  /* Not clipped: the hover shadow paints outside the box, and interactive cards
     host overflowing children (e.g. a settings dropdown). Cards clip their own
     top media to the radius instead. */
  overflow: visible;

  &.DesignSystem-Card--elevated {
    background: #ffffff;
    box-shadow: ${ELEVATION};
  }
  &.DesignSystem-Card--filled {
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }
  &.DesignSystem-Card--outline {
    background: #ffffff;
    border: ${OUTLINE_BORDER};
  }

  /* Hover: climbs to High elevation, or a whisper of extra tint + a small shadow. */
  &.DesignSystem-Card--interactive.DesignSystem-Card--elevated:hover {
    box-shadow: ${ELEVATION_HIGH};
  }
  &.DesignSystem-Card--interactive.DesignSystem-Card--filled:hover {
    background: #efefef;
    box-shadow: ${ELEVATION_SM};
  }
  &.DesignSystem-Card--interactive.DesignSystem-Card--outline:hover {
    background: #fafafa;
    box-shadow: ${ELEVATION_SM};
  }

  /* Pressed: one gentle step further than hover; wins over hover when both are
     true (declared after the hover rules, same specificity). */
  &.DesignSystem-Card--pressed.DesignSystem-Card--elevated {
    box-shadow: ${ELEVATION_SM};
  }
  &.DesignSystem-Card--pressed.DesignSystem-Card--filled {
    background: #ebebeb;
    box-shadow: none;
  }
  &.DesignSystem-Card--pressed.DesignSystem-Card--outline {
    background: #f4f4f4;
    box-shadow: none;
  }

  .DesignSystem-Card-link {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: 12px;
    font-size: 0;
  }
  .DesignSystem-Card-link:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }
  /* Interactive islands sit above the card link so their own click wins. */
  &.DesignSystem-Card--interactive > .DesignSystem-Card-content a,
  &.DesignSystem-Card--interactive > .DesignSystem-Card-content button,
  &.DesignSystem-Card--interactive > .DesignSystem-Card-content [data-card-action] {
    position: relative;
    z-index: 1;
  }
  /* Some pages fade every link/button on hover; that must not dim card internals. */
  a:hover,
  button:hover {
    opacity: 1;
  }
`;

const CONTENT_STYLE: React.CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minHeight: 0,
};

const VISUALLY_HIDDEN_STYLE: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function Card({
  variant = "elevated",
  href = null,
  onClick,
  ariaLabel,
  padding = 16,
  as = "article",
  className,
  style,
  children,
  ...rest
}: CardProps) {
  const [pressed, setPressed] = useState(false);
  const interactive = href != null;

  // Pressing an island (star, settings) shouldn't flash the card's pressed
  // state — that reads as "the card was clicked".
  const isIsland = (target: EventTarget | null) =>
    !!(target as Element | null)?.closest?.("a, button, [data-card-action]");

  const interactionHandlers: React.HTMLAttributes<HTMLElement> = interactive
    ? {
        onMouseDown: (e: React.MouseEvent) => {
          if (!isIsland(e.target)) setPressed(true);
        },
        onMouseUp: () => setPressed(false),
        onMouseLeave: () => setPressed(false),
      }
    : {};

  return (
    <StyledCard
      as={as}
      className={clsx(
        "DesignSystem-Card",
        `DesignSystem-Card--${variant}`,
        interactive && "DesignSystem-Card--interactive",
        interactive && pressed && "DesignSystem-Card--pressed",
        className,
      )}
      style={style}
      {...interactionHandlers}
      {...rest}
    >
      <div
        className="DesignSystem-Card-content"
        style={{ ...CONTENT_STYLE, padding }}
      >
        {children}
      </div>
      {interactive && (
        <Link
          href={href as LinkProps["href"]}
          onClick={onClick}
          aria-label={ariaLabel}
          className="DesignSystem-Card-link"
        >
          <span style={VISUALLY_HIDDEN_STYLE}>{ariaLabel}</span>
        </Link>
      )}
    </StyledCard>
  );
}
