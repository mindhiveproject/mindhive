"use client";

import styled from "styled-components";
import clsx from "clsx";
import { createContext, useContext, useMemo } from "react";
import type { LinkProps } from "next/link";

import RawTooltip from "./Tooltip";

// Tooltip is still plain JS; TS 4.9 mis-infers its destructured props param from
// the JSDoc. Assert its real contract here until DesignSystem/Tooltip is on TS.
const Tooltip = RawTooltip as unknown as React.FC<{
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
  delayMs?: number;
  maxWidth?: number;
  className?: string;
}>;

/**
 * Class names here stay the legacy `navbar-container` / `navbar-item` (not the
 * usual `DesignSystem-<Name>` scoping) because they're targeted from outside
 * this file (ConnectNavigationBar, StyledMenuBar, StyledBuilder, StyledProject,
 * StyledClass, ManageOrganization, NetworkDetail) via `styled(Navbar)` wrappers
 * and ancestor `styled.div`s. Renaming them would silently break those
 * overrides — grep for a class name before changing it.
 */
const StyledNavbar = styled.div`
  .navbar-container {
    display: flex;
    list-style: none;
    margin: 0px;
    padding: 0px;
    gap: 8px;
    padding: 4px 0;
    li {
      display: flex;
    }
  }

  .navbar-item {
    display: flex;
    text-decoration: none;
    border: 0px;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: 24px;
    padding-right: 24px;
    border-radius: 24px;
    align-items: center;
    gap: 8px;
    opacity: 1;
    background: none;
    cursor: pointer;

    color: black;
    /* MH-Type/label/base */
    font: var(--MH-Type-Label-Large);
    letter-spacing: 0;
    font-style: normal;

    &:hover {
      background-color: var(--MH-Theme-Accent-Light, #fdf2d0);
      opacity: 1;
    }

    &.has-icon {
      padding-left: 16px;
      padding-top: 8px;
      padding-bottom: 8px;

      svg {
        fill: currentColor;
      }
    }

    /* Mirror of has-icon: an icon at the end pulls that side in to 16px too. */
    &.has-trailing {
      padding-right: 16px;
    }

    &.selected,
    &:active {
      background-color: var(--MH-Theme-Accent-Medium, #f9d978);

    }

    .navbar-item-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      padding: 0px;
      svg {
        fill: currentColor;
      }
    }
  }
  .navbar-container.underline .navbar-item {
    border-radius: 0px;
    border-bottom: 3px solid transparent;
    background: none;

    &.selected,
    &:active {
      border-color: var(--MH-Theme-Accent-Base, #f2be42);
      background: none;
    }
    /* Hover is a background fill only — the resting rule stays put. */
    &:hover:not(.selected) {
      background-color: var(--MH-Theme-Accent-Light, #fdf2d0);
    }
  }

  .navbar-container.underline.show-rule .navbar-item:not(.selected):not(:hover) {
    border-bottom-width: 1px;
    border-color: var(--MH-Theme-Neutrals-Light, #e6e6e6);
  }

  /* Hover-underline — rules the tab in the text color on hover instead of a
     background fill. A surface only ever gets one hover treatment; this swaps
     which one the underline variant uses. MH-Theme/neutrals/dark, matching
     the rest of the design system's secondary-text color. */
  .navbar-container.underline.hover-underline .navbar-item:hover:not(.selected) {
    background: none;
    border-color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    border-bottom-width: 2px;
  }

  /* Dense — for a tab bar embedded in a fixed-height chrome strip that already
     supplies its own padding (e.g. a builder page's second-line navigation).
     Drops the container's own padding/gap and tightens each item's horizontal
     padding; vertical padding and icon/label gap stay at the base scale. */
  .navbar-container.dense {
    padding: 0;
    gap: 4px;
  }

  .navbar-container.dense .navbar-item,
  .navbar-container.dense .navbar-item.has-icon {
    padding-left: 8px;
    padding-right: 8px;
  }

  /* Items butt directly against each other. Pairs with the underline variant to
     read as one continuous rule broken only by the selected tab. Row gap is
     kept so a wrapped bar still separates its lines. */
  .navbar-container.gapless {
    column-gap: 0px;
  }

  /* Vertical orientation — sidebars and menu rails. */
  .navbar-container.vertical {
    flex-direction: column;
    align-items: stretch;
    padding: 0px;
    gap: 8px;

    li {
      display: flex;
      flex-direction: column;
    }

    /* Sidebar text sits a touch lighter than pure black. */
    .navbar-item {
      width: 100%;
      justify-content: flex-start;
      padding-left: 16px;
      padding-right: 24px;
      /* Square edges — the hover fill and the selected right rule both need to
         reach the corners. Rounded pills are the tonal variant's job only. */
      border-radius: 0px;
      color: var(--MH-Theme-Accent-Dark, #5d5763);
      /* Reserved so the label doesn't shift when the item becomes selected. */
      border-right: 3px solid transparent;

      /* Selected: an accent rule down the right edge, no fill. */
      &.selected,
      &:active {
        background: none;
        border-right-color: var(--MH-Theme-Accent-Base, #f2be42);
      }

      /* Only the glyph recolors — svgs inherit currentColor. */
      &.selected .navbar-item-icon {
        color: var(--MH-Theme-Accent-Base, #f2be42);
      }
    }

    /* Items sit 8px apart via the container gap; a section heading opens a
       wider 32px channel above itself to separate it from the group before. */
    li:not(:first-child) > .navbar-section-label,
    li:not(:first-child) > .navbar-section-rule {
      margin-top: 24px;
    }
  }

  /* Collapsed rail — icons only. Labels are dropped by NavbarItem itself and
     re-attached as accessible names, rather than being hidden with CSS. */
  .navbar-container.vertical.collapsed {
    align-items: center;

    .navbar-item {
      width: auto;
      justify-content: center;
      padding: 8px;

      /* A right-edge rule reads oddly on a centered icon button; the collapsed
         rail marks the selected item with a fill instead. */
      &.selected,
      &:active {
        border-right-color: transparent;
        background: var(--MH-Theme-Accent-Light, #fdf2d0);
      }
    }
  }

  /* Collapsed horizontal items — icon only. Triggered either by the whole bar
     collapsing (container .collapsed) or by a single item collapsing while its
     siblings stay expanded (item .collapsed), e.g. a selected tab that keeps its
     label while the rest compress. */
  .navbar-container:not(.vertical).collapsed .navbar-item,
  .navbar-container:not(.vertical) .navbar-item.collapsed {
    justify-content: center;
    padding: 8px;
  }

  .navbar-item-trailing {
    display: flex;
    align-items: center;
    margin-left: auto;
  }

  .navbar-section-label {
    /* MH-Type/label/large */
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    margin: 0;
    padding: 0;
  }

  .navbar-section-rule {
    height: 1px;
    width: 100%;
    background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border: 0;
    margin: 0;
  }
`;

/** Visual style for a horizontal {@link Navbar}. Ignored when `orientation="vertical"`. */
export type NavbarVariant = "underline" | "tonal";

/** Layout direction for {@link Navbar}. */
export type NavbarOrientation = "horizontal" | "vertical";

/**
 * Set once by Navbar so items know whether they are rendering as a collapsed
 * rail. Only state lives here — visual styling still cascades through CSS.
 */
const NavbarContext = createContext<{ collapsed: boolean }>({
  collapsed: false,
});

/**
 * Props for {@link Navbar}.
 *
 * @example
 * <Navbar variant="underline">
 *   <NavbarItem href="/studies" selected>Studies</NavbarItem>
 *   <NavbarItem href="/people">People</NavbarItem>
 * </Navbar>
 *
 * @example
 * <Navbar orientation="vertical" collapsed={collapsed}>
 *   <NavbarSection label="Projects">
 *     <NavbarItem as={Link} href="/develop" leadingIcon={<BuilderIcon />}>
 *       Develop
 *     </NavbarItem>
 *   </NavbarSection>
 * </Navbar>
 */
export interface NavbarProps
  extends Omit<React.ComponentPropsWithoutRef<"nav">, "children"> {
  /** Visual style for a horizontal bar. Ignored when orientation is "vertical". @default "underline" */
  variant?: NavbarVariant;
  /** Layout direction. @default "horizontal" */
  orientation?: NavbarOrientation;
  /** Renders an icon-only rail; item labels become accessible names instead of visible text. Works in both orientations. @default false */
  collapsed?: boolean;
  /** Underline variant only. Gives unselected items a resting 1px divider line instead of a transparent one. @default false */
  showRule?: boolean;
  /** Removes the horizontal gap between items so they sit flush against each other. With the underline variant this reads as one continuous rule broken only by the selected tab. Row gap is kept, so a wrapped bar still separates its lines. @default false */
  gapless?: boolean;
  /** Drops the container's own padding/gap and tightens item horizontal padding, for a bar embedded in a chrome strip that already supplies its own spacing. @default false */
  dense?: boolean;
  /** Underline variant only. Hovering an unselected item previews the accent underline instead of a background fill. @default false */
  hoverUnderline?: boolean;
  /** NavbarItem and NavbarSection elements. */
  children: React.ReactNode;
}

/**
 * Design System Navbar. Renders a `<nav>` landmark wrapping a `<ul>` of
 * {@link NavbarItem}.
 *
 * Horizontal bars take a visual `variant`: underline (bottom-border tabs, the
 * default) or tonal (rounded pills — legacy, kept for the study builder block
 * menu). Vertical bars ignore `variant` and always render the sidebar style: an
 * accent rule down the right edge of the selected item.
 *
 * Variant and orientation are set once here and cascade to every item via CSS,
 * so items themselves take no variant or orientation prop.
 */
export default function Navbar({
  variant = "underline",
  orientation = "horizontal",
  collapsed = false,
  showRule = false,
  gapless = false,
  dense = false,
  hoverUnderline = false,
  children,
  className,
  ...props
}: NavbarProps) {
  const isVertical = orientation == "vertical";
  const context = useMemo(() => ({ collapsed }), [collapsed]);

  return (
    <NavbarContext.Provider value={context}>
      <StyledNavbar as="nav" className={className} {...props}>
        <ul
          className={clsx(
            "navbar-container",
            !isVertical && variant,
            isVertical && "vertical",
            collapsed && "collapsed",
            showRule && "show-rule",
            gapless && "gapless",
            dense && "dense",
            hoverUnderline && "hover-underline",
          )}
        >
          {children}
        </ul>
      </StyledNavbar>
    </NavbarContext.Provider>
  );
}

/**
 * Navbar for tab bars that sit inside the page body rather than at the window
 * edge. The design system's 24px container inset suits edge-anchored nav; a
 * section tab bar runs flush with the heading above it instead.
 */
export const SectionNavbar = styled(Navbar)`
  .navbar-container {
    padding: 4px 0px;
  }
`;

/** Props for {@link NavbarSection}. */
export interface NavbarSectionProps {
  /** Section heading, e.g. "Projects". */
  label?: string;
  /** NavbarItem elements. */
  children: React.ReactNode;
}

/**
 * A labelled group of NavbarItems. Renders the label as a presentational `<li>`
 * so the surrounding `<ul>` stays valid, followed by the items themselves.
 *
 * When the parent Navbar is collapsed the label would have no room, so it is
 * replaced by a horizontal rule that keeps the visual grouping intact.
 */
export function NavbarSection({ label, children }: NavbarSectionProps) {
  const { collapsed } = useContext(NavbarContext);

  return (
    <>
      {label && (
        <li aria-hidden={collapsed ? "true" : undefined}>
          {collapsed ? (
            <span className="navbar-section-rule" />
          ) : (
            <span className="navbar-section-label">{label}</span>
          )}
        </li>
      )}
      {children}
    </>
  );
}

/**
 * Props for {@link NavbarItem}. Any extra prop (onClick, aria-*, disabled, …)
 * is forwarded to the rendered element.
 *
 * @example
 * <NavbarItem href="/settings" leadingIcon={<GearIcon />}>Settings</NavbarItem>
 * @example
 * <NavbarItem onClick={() => setTab("overview")} selected>Overview</NavbarItem>
 * @example
 * <NavbarItem as={Link} href="/studies">Studies</NavbarItem>
 */
export interface NavbarItemProps {
  /** Marks the active entry; also sets aria-current="page". @default false */
  selected?: boolean;
  /** Overrides the parent Navbar's collapsed state for this one item, so a bar can mix expanded and icon-only items (e.g. keep the selected tab's label while its siblings compress). */
  collapsed?: boolean;
  /** Destination. Its presence selects `<a>` over `<button>`. */
  href?: LinkProps["href"];
  /** Override the rendered element, e.g. Next's Link. */
  as?: React.ElementType;
  /** Optional 24px icon left of the label; inherits text color. */
  leadingIcon?: React.ReactNode;
  /** Optional slot pinned to the far end, e.g. a count badge. */
  trailingContent?: React.ReactNode;
  /** Item label. */
  children?: React.ReactNode;
  /** Additional classes on the interactive element. */
  className?: string;
  /** Optional Design System Tooltip on the item. When the item is `disabled`, the trigger wraps the control so hover still works (disabled buttons do not receive pointer events). */
  tooltipContent?: React.ReactNode;
  /** Disabled state. @default false */
  disabled?: boolean;
  /** Optional style override for the interactive element. */
  style?: React.CSSProperties;
  /** Remaining props (onClick, aria-*, disabled, …) forwarded to that element. */
  [key: string]: unknown;
}

/**
 * A single Navbar entry. Must be rendered inside a Navbar, which supplies the
 * variant and orientation styling; the item inherits them and needs no props of
 * its own for either.
 *
 * The underlying element is chosen for you: `href` renders an `<a>`, otherwise a
 * `<button>` (typed "button", so it won't submit a surrounding form). Pass `as`
 * to override — most commonly `as={Link}` for Next.js routing.
 */
export function NavbarItem({
  selected = false,
  collapsed: collapsedProp,
  href,
  as,
  leadingIcon = null,
  trailingContent = null,
  children,
  className,
  tooltipContent = null,
  disabled = false,
  style,
  ...props
}: NavbarItemProps) {
  const Component = as ?? (href ? "a" : "button");
  const { collapsed: collapsedContext } = useContext(NavbarContext);
  const collapsed = collapsedProp ?? collapsedContext;

  // Collapsed rails drop the visible label, so it has to survive as the
  // element's accessible name instead of disappearing from the tree entirely.
  const collapsedLabel =
    collapsed && typeof children == "string" ? children : undefined;

  const hasTooltip = tooltipContent != null && tooltipContent !== "";
  // Disabled controls do not fire mouse events; the Tooltip trigger must sit
  // outside and the control must not capture the pointer.
  const disabledWithTooltip = hasTooltip && disabled;

  const interactive = (
    <Component
      href={href}
      type={Component == "button" ? "button" : undefined}
      className={clsx(
        "navbar-item",
        selected && "selected",
        collapsed && "collapsed",
        leadingIcon && "has-icon",
        trailingContent && "has-trailing",
        className,
      )}
      aria-current={selected ? "page" : undefined}
      aria-label={collapsedLabel}
      title={hasTooltip ? undefined : collapsedLabel}
      disabled={disabled || undefined}
      style={{
        ...style,
        ...(disabledWithTooltip ? { pointerEvents: "none" } : null),
      }}
      {...props}
    >
      {leadingIcon && (
        <span className="navbar-item-icon" aria-hidden>
          {leadingIcon}
        </span>
      )}
      {!collapsed && children}
      {!collapsed && trailingContent && (
        <span className="navbar-item-trailing">{trailingContent}</span>
      )}
    </Component>
  );

  return (
    <li>
      {hasTooltip ? (
        <Tooltip
          content={tooltipContent}
          side="bottom"
          maxWidth={280}
          className="DesignSystem-Tooltip-trigger--fill"
        >
          <span
            className="navbar-item-tooltip-trigger"
            style={{
              display: "inline-flex",
              maxWidth: "100%",
              ...(disabledWithTooltip ? { cursor: "not-allowed" } : null),
            }}
          >
            {interactive}
          </span>
        </Tooltip>
      ) : (
        interactive
      )}
    </li>
  );
}
