"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Arrow geometry, straight from the Figma "Polygon 1" export: a rounded
 * triangle 10.9342 wide by 10 tall. It sits across the bubble edge, 4px hidden
 * behind the bubble and 6px protruding, which is also the gap the bubble keeps
 * from the trigger.
 */
const ARROW_WIDTH = 10.9342;
const ARROW_HEIGHT = 10;
const ARROW_OVERLAP = 4;
const ARROW_PROTRUSION = ARROW_HEIGHT - ARROW_OVERLAP;

/** Keeps the arrow clear of the bubble's rounded corners. */
const ARROW_EDGE_INSET = 10;

/** Breathing room kept against the viewport edges. */
const VIEWPORT_MARGIN = 8;

/**
 * Above every surface a trigger can sit inside — Semantic UI's dimmer (1000) and
 * modal (1001), FullScreenLoading (20040), and DesignSystem Modal (20050) — so a
 * tooltip raised from inside a modal is not hidden behind it.
 */
const Z_INDEX = 20060;

/**
 * Shrink-wraps the trigger around its content rather than letting it fill the
 * line, so the bubble points at the text and not at the empty half of a
 * full-width container. `max-width` still lets a long, ellipsised child cap at
 * the container, and `min-width` lets it shrink when the trigger is a flex item.
 */
const TRIGGER_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  maxWidth: "100%",
  minWidth: 0,
};

const OPPOSITE_SIDE = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

const ARROW_ROTATION = {
  top: 180,
  bottom: 0,
  left: 90,
  right: -90,
};

const BUBBLE_STYLE = {
  boxSizing: "border-box",
  // Block, not flex: a flex bubble turns `<b>Label:</b> value` into two flex
  // items and eats the space between them. `pre-line` lets a content string
  // break itself into lines with "\n" while still wrapping at `maxWidth`.
  display: "block",
  padding: "4px 8px",
  borderRadius: 4,
  background: "var(--MH-Theme-Neutrals-Black, #171717)",
  color: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
  overflowWrap: "break-word",
  whiteSpace: "pre-line",
};

const ARROW = (
  <svg
    width={ARROW_WIDTH}
    height={ARROW_HEIGHT}
    viewBox="0 0 10.9342 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    style={{ display: "block", overflow: "visible" }}
  >
    <path
      d="M3.73504 1C4.50484 -0.333334 6.42934 -0.333333 7.19914 1L10.6632 7C11.433 8.33334 10.4708 10 8.93119 10H2.00298C0.463381 10 -0.498867 8.33334 0.270933 7L3.73504 1Z"
      fill="var(--MH-Theme-Neutrals-Black, #171717)"
    />
  </svg>
);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Places the bubble on `side` of the trigger, flipping to the opposite side
 * when it would spill out of the viewport, then clamps it back inside.
 *
 * @param {"top"|"bottom"|"left"|"right"} side
 * @param {DOMRect} trigger
 * @param {{ width: number, height: number }} bubble
 * @returns {{ side: string, left: number, top: number, arrowOffset: number }}
 *   `arrowOffset` is the arrow's center along the bubble's cross axis.
 */
function place(preferredSide, trigger, bubble) {
  const { innerWidth: vw, innerHeight: vh } = window;
  const wasVertical = preferredSide === "top" || preferredSide === "bottom";
  const needed = (wasVertical ? bubble.height : bubble.width) + ARROW_PROTRUSION;

  const spaceBefore =
    (wasVertical ? trigger.top : trigger.left) - VIEWPORT_MARGIN;
  const spaceAfter =
    (wasVertical ? vh - trigger.bottom : vw - trigger.right) - VIEWPORT_MARGIN;
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
    left = trigger.left + trigger.width / 2 - bubble.width / 2;
    top =
      side === "top"
        ? trigger.top - ARROW_PROTRUSION - bubble.height
        : trigger.bottom + ARROW_PROTRUSION;
  } else {
    left =
      side === "left"
        ? trigger.left - ARROW_PROTRUSION - bubble.width
        : trigger.right + ARROW_PROTRUSION;
    top = trigger.top + trigger.height / 2 - bubble.height / 2;
  }

  const maxLeft = Math.max(VIEWPORT_MARGIN, vw - bubble.width - VIEWPORT_MARGIN);
  const maxTop = Math.max(VIEWPORT_MARGIN, vh - bubble.height - VIEWPORT_MARGIN);
  left = clamp(left, VIEWPORT_MARGIN, maxLeft);
  top = clamp(top, VIEWPORT_MARGIN, maxTop);

  // Point the arrow at the trigger's center, even after the clamp moved the bubble.
  const triggerCenter = vertical
    ? trigger.left + trigger.width / 2
    : trigger.top + trigger.height / 2;
  const span = vertical ? bubble.width : bubble.height;
  const arrowOffset = clamp(
    triggerCenter - (vertical ? left : top),
    ARROW_EDGE_INSET,
    Math.max(ARROW_EDGE_INSET, span - ARROW_EDGE_INSET),
  );

  return { side, left, top, arrowOffset };
}

/** Arrow position relative to the bubble, centered on its own box so rotation stays put. */
function arrowStyle(side, arrowOffset) {
  const base = {
    position: "absolute",
    transform: `translate(-50%, -50%) rotate(${ARROW_ROTATION[side]}deg)`,
    pointerEvents: "none",
  };
  const beyond = `calc(100% + ${ARROW_HEIGHT / 2 - ARROW_OVERLAP}px)`;
  const short = -(ARROW_HEIGHT / 2 - ARROW_OVERLAP);

  switch (side) {
    case "top":
      return { ...base, left: arrowOffset, top: beyond };
    case "bottom":
      return { ...base, left: arrowOffset, top: short };
    case "left":
      return { ...base, top: arrowOffset, left: beyond };
    default:
      return { ...base, top: arrowOffset, left: short };
  }
}

/**
 * Design System Tooltip. A dark label that appears on hover or keyboard focus,
 * with an arrow pointing back at its trigger. Portaled to the body so an
 * `overflow` ancestor cannot clip it, and flipped to the opposite side when
 * the preferred one has no room.
 *
 * @param {React.ReactNode} content - Tooltip body. Nothing renders when empty.
 * @param {React.ReactNode} children - The trigger; wrapped in an inline-flex span.
 * @param {"top"|"bottom"|"left"|"right"} [side="top"] - Preferred placement.
 * @param {number} [delayMs=0] - Hover delay before showing. Leaving cancels it.
 * @param {number} [maxWidth=240] - Bubble max width in px; longer content wraps.
 * @param {boolean} [disabled=false] - Keeps the tooltip from ever showing.
 * @param {string} [className] - Optional class for the trigger wrapper, for
 *   callsites that need it to lay out differently (`display: block`, say).
 *
 * @example
 * <Tooltip content="Duplicate study" side="bottom">
 *   <IconButton icon={<CopyIcon />} />
 * </Tooltip>
 */
export default function Tooltip({
  content,
  children,
  side = "top",
  delayMs = 0,
  maxWidth = 240,
  disabled = false,
  className,
}) {
  const triggerRef = useRef(null);
  const bubbleRef = useRef(null);
  const showTimeoutRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState(null);
  const id = useId();

  const hasContent = content != null && content !== "";
  const active = open && hasContent && !disabled;

  const cancelShow = useCallback(() => {
    if (showTimeoutRef.current != null) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    cancelShow();
    if (delayMs <= 0) {
      setOpen(true);
      return;
    }
    showTimeoutRef.current = setTimeout(() => setOpen(true), delayMs);
  }, [cancelShow, delayMs]);

  const hide = useCallback(() => {
    cancelShow();
    setOpen(false);
  }, [cancelShow]);

  useEffect(() => cancelShow, [cancelShow]);

  // Measure the bubble once it is in the DOM, then place it against the trigger.
  useLayoutEffect(() => {
    if (!active) {
      setPlacement(null);
      return undefined;
    }

    const reposition = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const bubble = bubbleRef.current?.getBoundingClientRect();
      if (!trigger || !bubble) return;
      setPlacement(place(side, trigger, bubble));
    };

    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [active, side, content, maxWidth]);

  useEffect(() => {
    if (!active) return undefined;
    const closeOnEscape = ({ key }) => {
      if (key === "Escape") hide();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [active, hide]);

  const bubble = active && typeof document !== "undefined" && (
    <div
      ref={bubbleRef}
      id={id}
      role="tooltip"
      className="DesignSystem-Tooltip MH-Type-Body-Small"
      style={{
        ...BUBBLE_STYLE,
        position: "fixed",
        zIndex: Z_INDEX,
        maxWidth,
        // First paint measures the bubble; it is placed on the next one.
        left: placement?.left ?? 0,
        top: placement?.top ?? 0,
        visibility: placement ? "visible" : "hidden",
        pointerEvents: "none",
      }}
    >
      {content}
      {placement && (
        <span style={arrowStyle(placement.side, placement.arrowOffset)}>
          {ARROW}
        </span>
      )}
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        className={
          className
            ? `DesignSystem-Tooltip-trigger ${className}`
            : "DesignSystem-Tooltip-trigger"
        }
        style={TRIGGER_STYLE}
        aria-describedby={active ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {bubble && createPortal(bubble, document.body)}
    </>
  );
}
