import styled from "styled-components";
import clsx from "clsx";
import { createContext, useContext, useMemo } from "react";

import Tooltip from "./Tooltip";

export const StyledNavbar = styled.div`
  .navbar-container {
    display: flex;
    list-style: none;
    margin: 0px;
    padding: 0px;
    gap: 8px;
    padding: 4px 24px;
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
    /* MH-Type/label/large */
    font: var(--MH-Type-Label-Large);
    letter-spacing: 0;
    font-style: normal;

    &:hover {
      background-color: var(--MH-Theme-Neutrals-Light, #e6e6e6);
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
    border-bottom: 2px solid transparent;
    background: none;

    &.selected,
    &:active {
      border-color: var(--MH-Theme-Accent-Medium, #f9d978);
      background: none;
    }
    &:hover:not(.selected) {
      border-bottom-width: 2px;
      border-color: var(--MH-Theme-Neutrals-Medium, #a1a1a1);
      background: none;
    }
  }

  .navbar-container.underline.show-rule .navbar-item:not(.selected):not(:hover) {
    border-bottom-width: 1px;
    border-color: var(--MH-Theme-Neutrals-Light, #e6e6e6);
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

    .navbar-item {
      width: 100%;
      justify-content: flex-start;
      padding-left: 16px;
      padding-right: 24px;
    }

    /* Items sit 8px apart via the container gap; a section heading opens a
       wider 32px channel above itself to separate it from the group before. */
    li:not(:first-child) > .navbar-section-label,
    li:not(:first-child) > .navbar-section-rule {
      margin-top: 24px;
    }
  }
  .navbar-container.soft .navbar-item {
    &.selected,
    &:active {
      background-color: var(--MH-Theme-Tertiary-Medium, #D3E0E3);
      color: #0D3944;
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

/**
 * Set once by Navbar so items know whether they are rendering as a collapsed
 * rail. Only state lives here — visual styling still cascades through CSS.
 */
const NavbarContext = createContext({ collapsed: false });

/**
 * Design System Navbar. Renders a <nav> landmark wrapping a <ul> of NavbarItem.
 *
 * Two visual variants: tonal (pill background) and underline (bottom border).
 * Two orientations: horizontal (default, for tab bars) and vertical (for
 * sidebars and menu rails).
 *
 * Variant and orientation are set once here and cascade to every item via CSS,
 * so items themselves take no variant or orientation prop.
 *
 * @param {"tonal"|"underline"} [variant="tonal"] - Visual style for all items.
 * @param {"horizontal"|"vertical"} [orientation="horizontal"] - Layout direction.
 * @param {boolean} [collapsed=false] - Renders an icon-only rail; item labels
 *   become accessible names instead of visible text. Works in both orientations.
 * @param {boolean} [showRule=false] - Underline variant only. Gives unselected
 *   items a resting 1px divider line instead of a transparent one.
 * @param {boolean} [gapless=false] - Removes the horizontal gap between items so
 *   they sit flush against each other. With the underline variant this reads as
 *   one continuous rule broken only by the selected tab. Row gap is kept, so a
 *   wrapped bar still separates its lines.
 * @param {React.ReactNode} children - NavbarItem and NavbarSection elements.
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
export default function Navbar({
  variant = "tonal",
  orientation = "horizontal",
  collapsed = false,
  showRule = false,
  gapless = false,
  children,
  className,
  ...props
}) {
  const isVertical = orientation == "vertical";
  const context = useMemo(() => ({ collapsed }), [collapsed]);

  return (
    <NavbarContext.Provider value={context}>
      <StyledNavbar as="nav" className={className} {...props}>
        <ul
          className={clsx(
            "navbar-container",
            variant,
            isVertical && "vertical",
            collapsed && "collapsed",
            showRule && "show-rule",
            gapless && "gapless",
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

/**
 * A labelled group of NavbarItems. Renders the label as a presentational <li>
 * so the surrounding <ul> stays valid, followed by the items themselves.
 *
 * When the parent Navbar is collapsed the label would have no room, so it is
 * replaced by a horizontal rule that keeps the visual grouping intact.
 *
 * @param {string} [label] - Section heading, e.g. "Projects".
 * @param {React.ReactNode} children - NavbarItem elements.
 */
export function NavbarSection({ label, children }) {
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
 * A single Navbar entry. Must be rendered inside a Navbar, which supplies the
 * variant and orientation styling; the item inherits them and needs no props of
 * its own for either.
 *
 * The underlying element is chosen for you: `href` renders an <a>, otherwise a
 * <button> (typed "button", so it won't submit a surrounding form). Pass `as`
 * to override — most commonly `as={Link}` for Next.js routing.
 *
 * @param {boolean} [selected=false] - Marks the active entry; also sets aria-current="page".
 * @param {boolean} [collapsed] - Overrides the parent Navbar's collapsed state
 *   for this one item, so a bar can mix expanded and icon-only items (e.g. keep
 *   the selected tab's label while its siblings compress).
 * @param {string} [href] - Destination. Its presence selects <a> over <button>.
 * @param {React.ElementType} [as] - Override the rendered element, e.g. Next's Link.
 * @param {React.ReactNode} [leadingIcon] - Optional 24px icon left of the label; inherits text color.
 * @param {React.ReactNode} [trailingContent] - Optional slot pinned to the far end, e.g. a count badge.
 * @param {React.ReactNode} children - Item label.
 * @param {string} [className] - Additional classes on the interactive element.
 * @param {React.ReactNode} [tooltipContent] - Optional Design System Tooltip on
 *   the item. When the item is `disabled`, the trigger wraps the control so
 *   hover still works (disabled buttons do not receive pointer events).
 * @param {object} [props] - Remaining props (onClick, aria-*, disabled, …)
 *   forwarded to that element.
 *
 * @example
 * <NavbarItem href="/settings" leadingIcon={<GearIcon />}>Settings</NavbarItem>
 * @example
 * <NavbarItem onClick={() => setTab("overview")} selected>Overview</NavbarItem>
 * @example
 * <NavbarItem as={Link} href="/studies">Studies</NavbarItem>
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
}) {
  const Component = as ?? (href ? "a" : "button");
  const { collapsed: collapsedContext } = useContext(NavbarContext);
  const collapsed = collapsedProp ?? collapsedContext;

  // Collapsed rails drop the visible label, so it has to survive as the
  // element's accessible name instead of disappearing from the tree entirely.
  const collapsedLabel =
    collapsed && typeof children == "string" ? children : undefined;

  const hasTooltip =
    tooltipContent != null && tooltipContent !== "";
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
