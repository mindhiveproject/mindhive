"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

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

const DEFAULT_TRIGGER_STYLE = {
  borderRadius: "100px",
  border: "1px solid var(--MH-Theme-Primary-Dark, #336F8A)",
  background: "#ffffff",
  color: "#0D3944",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  lineHeight: "20px",
  padding: "4px 12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

const ICON_TRIGGER_STYLE = {
  borderRadius: "8px",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  background: "#ffffff",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  padding: "4px 6px",
  minWidth: "32px",
  minHeight: "32px",
  justifyContent: "center",
};

const ITEM_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  fontFamily: "Inter, sans-serif",
  fontWeight: 500,
  fontSize: "14px",
  lineHeight: "20px",
  letterSpacing: "0.15px",
  cursor: "pointer",
  transition: "background-color 0.2s",
  border: "none",
  width: "100%",
  textAlign: "left",
  background: "transparent",
};

const STATIC_ITEM_STYLE = {
  ...ITEM_STYLE,
  cursor: "default",
  color: "#6a6a6a",
  fontWeight: 400,
  fontSize: "12px",
  lineHeight: "16px",
};

const PANEL_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #a1a1a1",
  borderRadius: "8px",
  boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
  overflow: "hidden",
  minWidth: "200px",
  zIndex: 10000,
};

const PANEL_HEADER_WRAPPER_STYLE = {
  padding: "8px 12px",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  lineHeight: "16px",
  color: "#6a6a6a",
  borderBottom: "1px solid #e6e6e6",
};

const DIVIDER_STYLE = {
  height: "1px",
  background: "#e6e6e6",
  margin: 0,
};

/**
 * Reusable dropdown menu with portal (avoids clipping in AG Grid / overflow containers).
 * Renders trigger button and, when open, a panel in document.body with position: fixed.
 *
 * @param {string} [triggerLabel] - Label when using default trigger (with ellipsis). Omit when `trigger` is set.
 * @param {React.ReactNode} [trigger] - Custom trigger content inside the button (e.g. icon). When set, `triggerLabel` and default ellipsis are not shown; provide `ariaLabel` for a11y.
 * @param {string} [ariaLabel] - Accessible name for the trigger button (required when `trigger` is used without visible text).
 * @param {React.ReactNode} [panelHeader] - Read-only block above menu items (e.g. metadata).
 * @param {boolean} [dividerAfterHeader=true] - Show a divider between `panelHeader` and items when `panelHeader` is set.
 * @param {Array<{ key: string, label: React.ReactNode, onClick?: () => void, danger?: boolean, static?: boolean }>} items - Menu items. `static: true` or missing `onClick` on a non-danger row renders a non-interactive row (does not close menu). Action items call `onClick` then close.
 * @param {React.CSSProperties} [triggerStyle] - Optional override for trigger button styles.
 */
export default function DropdownMenu({
  triggerLabel,
  trigger = null,
  ariaLabel,
  panelHeader = null,
  dividerAfterHeader = true,
  items = [],
  triggerStyle = {},
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState(null);
  const dropdownRef = useRef(null);
  const dropdownPanelRef = useRef(null);

  const useCustomTrigger = trigger != null;
  const mergedTriggerStyle = {
    ...DEFAULT_TRIGGER_STYLE,
    ...(useCustomTrigger ? ICON_TRIGGER_STYLE : {}),
    ...triggerStyle,
  };

  useLayoutEffect(() => {
    if (dropdownOpen && dropdownRef.current) {
      setDropdownRect(dropdownRef.current.getBoundingClientRect());
    } else {
      setDropdownRect(null);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      const inTrigger = dropdownRef.current?.contains(target);
      const inPanel = dropdownPanelRef.current?.contains(target);
      if (!inTrigger && !inPanel) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleItemClick = (item) => {
    if (item.static === true || typeof item.onClick !== "function") {
      return;
    }
    item.onClick();
    setDropdownOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", zIndex: dropdownOpen ? 1001 : "auto" }}>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setDropdownOpen((prev) => !prev)}
        style={mergedTriggerStyle}
      >
        {useCustomTrigger ? trigger : (
          <>
            {triggerLabel}
            {ELLIPSIS_ICON}
          </>
        )}
      </button>
      {dropdownOpen &&
        dropdownRect &&
        createPortal(
          <div
            ref={dropdownPanelRef}
            style={{
              ...PANEL_STYLE,
              position: "fixed",
              top: dropdownRect.bottom + 4,
              right: window.innerWidth - dropdownRect.right,
            }}
          >
            {panelHeader != null && (
              <>
                <div style={PANEL_HEADER_WRAPPER_STYLE}>{panelHeader}</div>
                {dividerAfterHeader ? <div style={DIVIDER_STYLE} role="separator" /> : null}
              </>
            )}
            {items.map((item) => {
              const isDanger = item.danger === true;
              const isStatic = item.static === true || typeof item.onClick !== "function";
              const style = isStatic
                ? STATIC_ITEM_STYLE
                : isDanger
                  ? { ...ITEM_STYLE, color: "#d32f2f" }
                  : ITEM_STYLE;

              if (isStatic) {
                return (
                  <div key={item.key} style={style}>
                    {item.label}
                  </div>
                );
              }

              return (
                <div
                  key={item.key}
                  role="button"
                  tabIndex={0}
                  style={style}
                  onClick={() => handleItemClick(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleItemClick(item);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {isDanger && TRASH_ICON}
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
