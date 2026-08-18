"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Distance from the anchor. */
const GAP = 8;

/** Breathing room kept against the viewport edges. */
const VIEWPORT_MARGIN = 16;

const MAX_HEIGHT = 560;

const OPPOSITE_SIDE = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

const SURFACE_STYLE = {
  position: "fixed",
  // Above Semantic UI's modal (1001) and DesignSystem Modal (20050), so a
  // popover opened from inside a modal is not hidden behind it.
  zIndex: 20060,
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Places the surface on `side` of the anchor, flipping to the opposite side when
 * that one has no room, then clamps it back inside the viewport. `align` picks
 * which pair of edges line up along the cross axis.
 *
 * @param {"top"|"bottom"|"left"|"right"} preferredSide
 * @param {"start"|"end"} align
 * @param {DOMRect} anchor
 * @param {{ width: number, height: number }} surface
 * @returns {{ left: number, top: number }}
 */
function place(preferredSide, align, anchor, surface) {
  const { innerWidth: vw, innerHeight: vh } = window;
  const wantsVertical = preferredSide === "top" || preferredSide === "bottom";
  const needed = (wantsVertical ? surface.height : surface.width) + GAP;

  const spaceBefore =
    (wantsVertical ? anchor.top : anchor.left) - VIEWPORT_MARGIN;
  const spaceAfter =
    (wantsVertical ? vh - anchor.bottom : vw - anchor.right) - VIEWPORT_MARGIN;
  const wantsBefore = preferredSide === "top" || preferredSide === "left";
  const room = wantsBefore ? spaceBefore : spaceAfter;
  const roomFlipped = wantsBefore ? spaceAfter : spaceBefore;
  const side =
    room < needed && roomFlipped >= needed
      ? OPPOSITE_SIDE[preferredSide]
      : preferredSide;

  const vertical = side === "top" || side === "bottom";
  let left;
  let top;
  if (vertical) {
    left = align === "end" ? anchor.right - surface.width : anchor.left;
    top =
      side === "top" ? anchor.top - GAP - surface.height : anchor.bottom + GAP;
  } else {
    left =
      side === "left" ? anchor.left - GAP - surface.width : anchor.right + GAP;
    top = align === "end" ? anchor.bottom - surface.height : anchor.top;
  }

  const maxLeft = Math.max(VIEWPORT_MARGIN, vw - surface.width - VIEWPORT_MARGIN);
  const maxTop = Math.max(VIEWPORT_MARGIN, vh - surface.height - VIEWPORT_MARGIN);
  return {
    left: clamp(left, VIEWPORT_MARGIN, maxLeft),
    top: clamp(top, VIEWPORT_MARGIN, maxTop),
  };
}

/**
 * Design System Popover. Floating surface anchored to a trigger, portaled to the
 * body so an `overflow` ancestor cannot clip it, flipped to the opposite side
 * when the preferred one has no room. Closes on outside pointer, outside focus,
 * or Escape.
 *
 * Unlike Tooltip this surface is interactive, so it is the right home for help
 * content with links, lists, or controls in it.
 *
 * @param {boolean} open - Whether the surface is shown.
 * @param {React.RefObject} anchorRef - Element the surface is positioned against.
 * @param {() => void} onClose - Called on outside interaction or Escape. Should
 *   be referentially stable, e.g. wrapped in `useCallback`.
 * @param {"top"|"bottom"|"left"|"right"} [side="right"] - Preferred placement.
 * @param {"start"|"end"} [align="start"] - Which edges line up across `side`.
 * @param {number} [width=456] - Surface width in px, capped to the viewport.
 * @param {number} [maxHeight=560] - Surface max height in px, capped to the
 *   remaining viewport.
 * @param {string} [ariaLabel] - Accessible name for the dialog.
 * @param {React.ReactNode} children - Surface content, typically a PanelHeader
 *   plus a scrolling body.
 */
export default function Popover({
  open,
  anchorRef,
  onClose,
  side = "right",
  align = "start",
  width = 456,
  maxHeight = MAX_HEIGHT,
  ariaLabel,
  children,
}) {
  const surfaceRef = useRef(null);
  const [position, setPosition] = useState(null);

  // Measure the surface once it is in the DOM, then place it against the anchor.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return undefined;
    }

    const reposition = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const surface = surfaceRef.current?.getBoundingClientRect();
      if (!anchor || !surface) return;
      setPosition(place(side, align, anchor, surface));
    };

    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, anchorRef, side, align, width, maxHeight]);

  useEffect(() => {
    if (!open) return undefined;

    const closeIfOutside = ({ target }) => {
      if (
        anchorRef.current?.contains(target) ||
        surfaceRef.current?.contains(target)
      ) {
        return;
      }
      // Nested portaled overlays (e.g. DropdownSelect) are not DOM children
      // of the surface; dismissing on those clicks would close this popover.
      if (
        target instanceof Element &&
        target.closest(".DesignSystem-DropdownSelect-Panel")
      ) {
        return;
      }
      onClose();
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

  if (!open) return null;
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
        width: `min(${width}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
        maxHeight: `min(${maxHeight}px, calc(100vh - ${VIEWPORT_MARGIN * 2}px))`,
        // First paint measures the surface; it is placed on the next one.
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        visibility: position ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
