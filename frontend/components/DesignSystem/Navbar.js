import styled from "styled-components";
import clsx from "clsx";
import { createContext, useContext, useMemo } from "react";

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
    font-family: "Inter";
    font-weight: 600;
    font-style: normal;
    line-height: 24px;
    font-size: 14px;


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
      /* MH-Theme/label/base — same size as buttons carry. */
      font-size: 14px;
      line-height: 20px;
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

  .navbar-item-trailing {
    display: flex;
    align-items: center;
    margin-left: auto;
  }

  .navbar-section-label {
    /* MH-Theme/label/base */
    font-family: "Inter";
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
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
 * @param {boolean} [collapsed=false] - Vertical only. Renders an icon-only rail;
 *   item labels become accessible names instead of visible text.
 * @param {boolean} [showRule=false] - Underline variant only. Gives unselected
 *   items a resting 1px divider line instead of a transparent one.
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
  children,
  className,
  ...props
}) {
  const isVertical = orientation == "vertical";
  const context = useMemo(
    () => ({ collapsed: isVertical && collapsed }),
    [isVertical, collapsed],
  );

  return (
    <NavbarContext.Provider value={context}>
      <StyledNavbar as="nav" className={className} {...props}>
        <ul
          className={clsx(
            "navbar-container",
            variant,
            isVertical && "vertical",
            isVertical && collapsed && "collapsed",
            showRule && "show-rule",
          )}
        >
          {children}
        </ul>
      </StyledNavbar>
    </NavbarContext.Provider>
  );
}

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
 * @param {string} [href] - Destination. Its presence selects <a> over <button>.
 * @param {React.ElementType} [as] - Override the rendered element, e.g. Next's Link.
 * @param {React.ReactNode} [leadingIcon] - Optional 24px icon left of the label; inherits text color.
 * @param {React.ReactNode} [trailingContent] - Optional slot pinned to the far end, e.g. a count badge.
 * @param {React.ReactNode} children - Item label.
 * @param {string} [className] - Additional classes on the interactive element.
 * @param {object} [props] - Remaining props (onClick, aria-*, …) forwarded to that element.
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
  href,
  as,
  leadingIcon = null,
  trailingContent = null,
  children,
  className,
  ...props
}) {
  const Component = as ?? (href ? "a" : "button");
  const { collapsed } = useContext(NavbarContext);

  // Collapsed rails drop the visible label, so it has to survive as the
  // element's accessible name instead of disappearing from the tree entirely.
  const collapsedLabel =
    collapsed && typeof children == "string" ? children : undefined;

  return (
    <li>
      <Component
        href={href}
        type={Component == "button" ? "button" : undefined}
        className={clsx(
          "navbar-item",
          selected && "selected",
          leadingIcon && "has-icon",
          trailingContent && "has-trailing",
          className,
        )}
        aria-current={selected ? "page" : undefined}
        aria-label={collapsedLabel}
        title={collapsedLabel}
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
    </li>
  );
}
