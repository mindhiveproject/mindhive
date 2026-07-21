import styled from "styled-components";
import clsx from "clsx";

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
  .navbar-container.underline-variant .navbar-item {
    border-radius: 0px;
    border-bottom: 2px solid transparent;
    background: none;

    &.selected,
    &:active {
      border-color: var(--MH-Theme-Accent-Medium, #f9d978);
      background: none;
    }
    &:hover {
      border-color: var(--MH-Theme-Neutrals-Light, #e6e6e6);
      background: none;
    }
  }
`;

/**
 * Design System Navbar. Renders a <nav> landmark wrapping a <ul> of NavbarItem.
 * Two variants: tonal (pill background) and underline (bottom border).
 *
 * The variant is set once here and cascades to every item via CSS, so items
 * themselves take no variant prop.
 *
 * @param {"tonal"|"underline"} [variant="tonal"] - Visual style for all items.
 * @param {React.ReactNode} children - NavbarItem elements.
 *
 * @example
 * <Navbar variant="underline">
 *   <NavbarItem href="/studies" selected>Studies</NavbarItem>
 *   <NavbarItem href="/people">People</NavbarItem>
 * </Navbar>
 */
export default function Navbar({ variant = "tonal", children }) {
  return (
    <StyledNavbar as="nav">
      <ul
        className={clsx(
          "navbar-container",
          variant == "underline" && "underline-variant",
        )}
      >
        {children}
      </ul>
    </StyledNavbar>
  );
}

/**
 * A single Navbar entry. Must be rendered inside a Navbar, which supplies the
 * variant styling; the item inherits it and needs no variant prop of its own.
 *
 * The underlying element is chosen for you: `href` renders an <a>, otherwise a
 * <button> (typed "button", so it won't submit a surrounding form). Pass `as`
 * to override — most commonly `as={Link}` for Next.js routing.
 *
 * @param {boolean} [selected=false] - Marks the active entry; also sets aria-current="page".
 * @param {string} [href] - Destination. Its presence selects <a> over <button>.
 * @param {React.ElementType} [as] - Override the rendered element, e.g. Next's Link.
 * @param {React.ReactNode} [leadingIcon] - Optional 24px icon left of the label; inherits text color.
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
  children,
  className,
  ...props
}) {
  const Component = as ?? (href ? "a" : "button");

  return (
    <li>
      <Component
        href={href}
        type={Component == "button" ? "button" : undefined}
        className={clsx(
          "navbar-item",
          selected && "selected",
          leadingIcon && "has-icon",
          className,
        )}
        aria-current={selected ? "page" : undefined}
        {...props}
      >
        {leadingIcon && (
          <span className="navbar-item-icon" aria-hidden>
            {leadingIcon}
          </span>
        )}
        {children}
      </Component>
    </li>
  );
}
