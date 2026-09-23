"use client";

import { useState, useRef, useEffect, useLayoutEffect, useReducer, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import clsx from "clsx";

import {
  clampDropdownPanelRight,
  computeDropdownVerticalPlacement,
  DROPDOWN_VIEWPORT_GAP,
  getIdealMaxPanelHeight,
  type DropdownPlacement,
} from "./dropdownViewportPlacement";

const ELLIPSIS_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor" />
  </svg>
);

const TRASH_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#d32f2f" />
  </svg>
);

/**
 * Root + default trigger. Panel placement is measured from the root's rect, so
 * it must shrink-wrap the trigger — without `align-self`/`justify-self: start`,
 * a menu dropped straight into a grid/flex container stretches to the row
 * height and the panel opens a trigger-height too low.
 */
const StyledDropdownMenu = styled.div`
  position: relative;
  align-self: start;
  justify-self: start;

  &.DesignSystem-DropdownMenu--open {
    z-index: 1001;
  }

  /* Pill trigger with a label + ellipsis. */
  .DesignSystem-DropdownMenu-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    border-radius: 100px;
    border: 1px solid var(--MH-Theme-Primary-Dark, #336f8a);
    background: #ffffff;
    color: #0d3944;
    cursor: pointer;
  }
  /* Custom \`trigger\` content (usually an icon): a small square button. */
  .DesignSystem-DropdownMenu-trigger--custom {
    justify-content: center;
    min-width: 32px;
    min-height: 32px;
    padding: 4px 6px;
    border-radius: 8px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

/**
 * The menu panel. Rules are nested under the panel so they outrank the global
 * `MH-Type-*` classes the rows also carry.
 */
const StyledPanel = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 200px;
  background-color: #ffffff;
  border: 1px solid #a1a1a1;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 10000;

  .DesignSystem-DropdownMenu-header {
    padding: 8px 12px;
    color: #6a6a6a;
    border-bottom: 1px solid #e6e6e6;
  }

  .DesignSystem-DropdownMenu-divider {
    height: 1px;
    margin: 0;
    background: #e6e6e6;
  }

  .DesignSystem-DropdownMenu-items {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .DesignSystem-DropdownMenu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  button.DesignSystem-DropdownMenu-item:hover {
    background-color: #f5f5f5;
  }
  .DesignSystem-DropdownMenu-item--danger {
    color: #d32f2f;
  }
  .DesignSystem-DropdownMenu-item--static {
    cursor: default;
    color: #6a6a6a;
  }

  .DesignSystem-DropdownMenu-icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
  }
`;

/** One row of a {@link DropdownMenu}. */
export interface DropdownMenuItem {
  /** React key; must be unique within `items`. */
  key: string;
  /** Row content. */
  label: React.ReactNode;
  /** Leading icon before `label`. */
  icon?: React.ReactNode;
  /**
   * Action for the row; the menu closes after it runs. A non-danger row with no
   * `onClick` renders as a non-interactive (static) row.
   */
  onClick?: () => void;
  /** Red destructive row; shows a trash icon when `icon` is omitted. */
  danger?: boolean;
  /** Non-interactive row (e.g. a note); clicking it does not close the menu. */
  static?: boolean;
}

/** Arguments handed to {@link DropdownMenuProps.renderTrigger}. */
export interface DropdownMenuTriggerArgs {
  /** Toggles the menu. */
  onClick: () => void;
  /** Whether the menu is open (for `aria-expanded`). */
  open: boolean;
  /** The `ariaLabel` passed to the menu. */
  ariaLabel?: string;
  /** Id of the menu panel (for `aria-controls`). */
  ariaControls: string;
}

/**
 * Props for {@link DropdownMenu}.
 *
 * @example
 * // Default pill trigger
 * <DropdownMenu
 *   triggerLabel="Actions"
 *   items={[
 *     { key: "rename", label: "Rename", onClick: rename },
 *     { key: "delete", label: "Delete", onClick: remove, danger: true },
 *   ]}
 * />
 *
 * @example
 * // Caller-rendered trigger
 * <DropdownMenu
 *   ariaLabel="More"
 *   renderTrigger={({ onClick, open, ariaLabel, ariaControls }) => (
 *     <IconButton icon={<MoreIcon />} onClick={onClick} ariaLabel={ariaLabel}
 *       aria-expanded={open} aria-controls={ariaControls} />
 *   )}
 *   items={items}
 * />
 */
export interface DropdownMenuProps {
  /** Label for the default trigger (shown with an ellipsis). Omit when `trigger` is set. */
  triggerLabel?: React.ReactNode;
  /**
   * Custom content inside the trigger button (e.g. an icon). Replaces
   * `triggerLabel` and the ellipsis; provide `ariaLabel` for a11y.
   */
  trigger?: React.ReactNode;
  /**
   * Render a custom trigger control (e.g. Button or IconButton) instead of the
   * default trigger button.
   */
  renderTrigger?: ((args: DropdownMenuTriggerArgs) => React.ReactNode) | null;
  /** Accessible name for the trigger (required when `trigger` has no visible text). */
  ariaLabel?: string;
  /** Read-only block above the items (e.g. metadata). */
  panelHeader?: React.ReactNode;
  /**
   * Show a divider between `panelHeader` and the items.
   * @default true
   */
  dividerAfterHeader?: boolean;
  /**
   * Menu rows.
   * @default []
   */
  items?: DropdownMenuItem[];
  /** Per-instance override for the default trigger's styles, layered on top. */
  triggerStyle?: React.CSSProperties;
  /** Per-instance override for the panel's styles, layered on top. */
  panelStyle?: React.CSSProperties;
  /** Called when the menu opens or closes. */
  onOpenChange?: ((open: boolean) => void) | null;
  /**
   * Vertical placement; `auto` flips when there is not enough space below.
   * @default "auto"
   */
  placement?: DropdownPlacement;
  /**
   * Mount the panel in `document.body` to avoid overflow clipping.
   * @default false
   */
  portal?: boolean;
}

interface PanelLayout {
  top: number;
  maxHeight: number;
  right: number;
}

function renderLeadingIcon(item: DropdownMenuItem) {
  if (item.icon != null) {
    return (
      <span className="DesignSystem-DropdownMenu-icon" aria-hidden="true">
        {item.icon}
      </span>
    );
  }
  if (item.danger === true) {
    return TRASH_ICON;
  }
  return null;
}

/** Reusable dropdown menu of actions, right-aligned to its trigger. */
export default function DropdownMenu({
  triggerLabel,
  trigger = null,
  renderTrigger = null,
  ariaLabel,
  panelHeader = null,
  dividerAfterHeader = true,
  items = [],
  triggerStyle = {},
  panelStyle = {},
  onOpenChange = null,
  placement = "auto",
  portal = false,
}: DropdownMenuProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [panelLayout, setPanelLayout] = useState<PanelLayout | null>(null);
  const [panelLayoutTick, bumpPanelLayout] = useReducer((n: number) => n + 1, 0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const dropdownId = useId();

  const useCustomTrigger = trigger != null;

  useEffect(() => {
    onOpenChange?.(dropdownOpen);
  }, [dropdownOpen, onOpenChange]);

  useLayoutEffect(() => {
    if (!dropdownOpen) {
      setPanelLayout(null);
      return;
    }
    const tr = dropdownRef.current?.getBoundingClientRect();
    const panel = dropdownPanelRef.current;
    if (!tr || !panel) return;

    const innerH = window.innerHeight;
    const innerW = window.innerWidth;
    const measured = panel.offsetHeight;
    const { top, maxHeight } = computeDropdownVerticalPlacement(
      tr,
      innerH,
      measured,
      placement,
    );
    const panelWidth = panel.offsetWidth;
    const right = clampDropdownPanelRight(tr.right, panelWidth, innerW);
    setPanelLayout({ top, maxHeight, right });
  }, [dropdownOpen, items, panelHeader, dividerAfterHeader, placement, panelLayoutTick]);

  useEffect(() => {
    if (!dropdownOpen) return;
    let raf = 0;
    const onViewportChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => bumpPanelLayout());
    };
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const frame = requestAnimationFrame(() => {
      dropdownPanelRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [dropdownOpen]);

  const closeAndRestoreFocus = useCallback(() => {
    setDropdownOpen(false);
    requestAnimationFrame(() => {
      dropdownRef.current?.querySelector<HTMLElement>("button:not(:disabled)")?.focus();
    });
  }, []);

  const moveMenuItemFocus = (key: string) => {
    const menuItems = Array.from(
      dropdownPanelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []
    );
    if (menuItems.length === 0) return;
    const currentIndex = menuItems.indexOf(document.activeElement as HTMLElement);
    const lastIndex = menuItems.length - 1;
    let nextIndex = currentIndex < 0 ? 0 : currentIndex;
    if (key === "Home") nextIndex = 0;
    if (key === "End") nextIndex = lastIndex;
    if (key === "ArrowUp") nextIndex = Math.max(0, currentIndex - 1);
    if (key === "ArrowDown") nextIndex = Math.min(lastIndex, currentIndex + 1);
    menuItems[nextIndex]?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const inTrigger = dropdownRef.current?.contains(target);
      const inPanel = dropdownPanelRef.current?.contains(target);
      if (!inTrigger && !inPanel) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      // Use "click" (not "mousedown") so refs are valid and item handlers run
      // first (bubble phase on document runs after the target's onClick).
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleItemClick = (item: DropdownMenuItem) => {
    if (item.static === true || typeof item.onClick !== "function") {
      return;
    }
    item.onClick();
    setDropdownOpen(false);
  };

  const renderPanel = () => {
    const tr = dropdownRef.current?.getBoundingClientRect();
    if (!tr || !dropdownRef.current) return null;
    const innerH = window.innerHeight;
    const innerW = window.innerWidth;
    const provisional: PanelLayout = {
      top: tr.bottom + DROPDOWN_VIEWPORT_GAP,
      maxHeight: getIdealMaxPanelHeight(innerH),
      right: clampDropdownPanelRight(tr.right, 200, innerW),
    };
    const fixed = panelLayout ?? provisional;
    return createPortal(
      <StyledPanel
        ref={dropdownPanelRef}
        id={`${dropdownId}-menu`}
        role="menu"
        tabIndex={-1}
        className="DesignSystem-DropdownMenu-Panel"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            closeAndRestoreFocus();
          }
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
            e.preventDefault();
            moveMenuItemFocus(e.key);
          }
        }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          ...panelStyle,
          position: portal ? "fixed" : "absolute",
          top: portal ? fixed.top : fixed.top - tr.top,
          right: portal ? fixed.right : tr.right - window.innerWidth + fixed.right,
          maxHeight: fixed.maxHeight,
        }}
      >
        {panelHeader != null && (
          <>
            <div className="DesignSystem-DropdownMenu-header MH-Type-Body-Base">{panelHeader}</div>
            {dividerAfterHeader ? (
              <div className="DesignSystem-DropdownMenu-divider" role="separator" />
            ) : null}
          </>
        )}
        <div className="DesignSystem-DropdownMenu-items">
          {items.map((item) => {
            const isStatic = item.static === true || typeof item.onClick !== "function";
            const leadingIcon = renderLeadingIcon(item);

            if (isStatic) {
              return (
                <div
                  key={item.key}
                  className="DesignSystem-DropdownMenu-item DesignSystem-DropdownMenu-item--static MH-Type-Body-Base"
                >
                  {leadingIcon}
                  <span>{item.label}</span>
                </div>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={clsx(
                  "DesignSystem-DropdownMenu-item MH-Type-Label-Base",
                  item.danger === true && "DesignSystem-DropdownMenu-item--danger"
                )}
                onClick={(e) => {
                  // Portaled menu: native document listeners can fire before React’s
                  // delegated handler; stop bubbling so outside-close does not unmount
                  // the row before Journal’s onClick (e.g. delete) runs.
                  e.stopPropagation();
                  handleItemClick(item);
                }}
              >
                {leadingIcon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </StyledPanel>,
      portal ? document.body : dropdownRef.current
    );
  };

  return (
    <StyledDropdownMenu
      ref={dropdownRef}
      className={clsx(
        "DesignSystem-DropdownMenu",
        dropdownOpen && "DesignSystem-DropdownMenu--open"
      )}
    >
      {typeof renderTrigger === "function" ? (
        renderTrigger({
          onClick: () => setDropdownOpen((prev) => !prev),
          open: dropdownOpen,
          ariaLabel,
          ariaControls: `${dropdownId}-menu`,
        })
      ) : (
        <button
          type="button"
          className={clsx(
            "DesignSystem-DropdownMenu-trigger MH-Type-Label-Base",
            useCustomTrigger && "DesignSystem-DropdownMenu-trigger--custom"
          )}
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={dropdownOpen}
          aria-controls={`${dropdownId}-menu`}
          onClick={() => setDropdownOpen((prev) => !prev)}
          style={triggerStyle}
        >
          {useCustomTrigger ? trigger : (
            <>
              {triggerLabel}
              {ELLIPSIS_ICON}
            </>
          )}
        </button>
      )}
      {dropdownOpen && renderPanel()}
    </StyledDropdownMenu>
  );
}
