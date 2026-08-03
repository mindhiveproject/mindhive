"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Distance from the anchor, and the breathing room kept against the viewport. */
const GAP = 8;
const MAX_HEIGHT = 560;

const SURFACE_STYLE = {
  position: "fixed",
  // Under Semantic UI's dimmer (1000) and modal (1001), above page content.
  zIndex: 999,
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "var(--MH-Theme-Neutrals-White, #ffffff)",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  fontFamily: "Inter, sans-serif",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  outline: "none",
};

/**
 * Design System Popover. Floating surface opening to the right of its anchor,
 * portaled to the body so an `overflow` ancestor cannot clip it. Closes on
 * outside pointer, outside focus, or Escape.
 *
 * Only right-side placement is implemented, which is what the menu bar needs.
 *
 * @param {boolean} open - Whether the surface is shown.
 * @param {React.RefObject} anchorRef - Element the surface is positioned against.
 * @param {() => void} onClose - Called on outside interaction or Escape. Should
 *   be referentially stable, e.g. wrapped in `useCallback`.
 * @param {number} [width=456] - Surface width in px, capped to the viewport.
 * @param {string} [ariaLabel] - Accessible name for the dialog.
 * @param {React.ReactNode} children - Surface content, typically a PanelHeader
 *   plus a scrolling body.
 */
export default function Popover({
  open,
  anchorRef,
  onClose,
  width = 456,
  ariaLabel,
  children,
}) {
  const surfaceRef = useRef(null);
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!open) return undefined;

    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      if (!anchor) return;
      setPosition({
        left: anchor.right + GAP,
        top: anchor.top,
        maxHeight: Math.min(
          MAX_HEIGHT,
          window.innerHeight - anchor.top - GAP * 2,
        ),
      });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return undefined;

    const closeIfOutside = ({ target }) => {
      if (
        !anchorRef.current?.contains(target) &&
        !surfaceRef.current?.contains(target)
      ) {
        onClose();
      }
    };
    const closeOnEscape = ({ key }) => {
      if (key === "Escape") onClose();
    };

    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("focusin", closeIfOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("focusin", closeIfOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, anchorRef, onClose]);

  // Move focus onto the surface so keyboard users are inside the dialog.
  useEffect(() => {
    if (open && position) surfaceRef.current?.focus();
  }, [open, position]);

  if (!open || position == null) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={surfaceRef}
      role="dialog"
      aria-label={ariaLabel}
      tabIndex={-1}
      className="DesignSystem-Popover"
      style={{
        ...SURFACE_STYLE,
        ...position,
        width: `min(${width}px, calc(100vw - 32px))`,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
