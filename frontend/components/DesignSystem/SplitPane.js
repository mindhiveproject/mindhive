"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";

/**
 * The curve the collapse runs on. Exported so anything a caller animates in the
 * same gesture — a rail taking the collapsed pane's place, say — moves with the
 * pane rather than beside it.
 */
export const COLLAPSE_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 0.61, 0.36, 1],
};

const ROOT_STYLE = {
  display: "flex",
  alignItems: "stretch",
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
};

const PANE_STYLE = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 0,
  overflow: "hidden",
};

// The gutter is wider than the visible grab handle so the divider is easy to
// hit; the handle itself is the 8x40 pill from the mockup.
const GUTTER = 12;

const GUTTER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: GUTTER,
  alignSelf: "stretch",
  cursor: "col-resize",
  touchAction: "none",
  background: "transparent",
  border: "none",
  padding: 0,
};

// How far past `minEnd` the pointer has to keep going before the drag reads as
// "close it" rather than "make it small". Long enough that an overshoot doesn't
// shut the pane, short enough that the pane isn't sitting still while the
// pointer runs away from it.
const COLLAPSE_OVERDRAG = 64;

const HANDLE_STYLE = {
  flexShrink: 0,
  width: 8,
  height: 40,
  borderRadius: 100,
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  transition: "background-color 0.2s",
};

const HANDLE_ACTIVE_STYLE = {
  background: "var(--MH-Theme-Primary-Dark, #336F8A)",
};

/**
 * Two resizable side-by-side regions with a draggable divider.
 *
 * The divider takes **pointer capture** on pointerdown. That is the whole point
 * of not using a plain mousemove splitter here: the pane next to it can contain
 * an iframe (the visual preview), and an iframe swallows mouse events, which
 * would otherwise leave the divider stuck to the cursor the moment the drag
 * crossed it.
 *
 * Sizing is a fraction of the container rather than a pixel width, so the split
 * survives a window resize and a rail animating open beside it.
 *
 * Collapsing **squeezes** `end` shut rather than unmounting it. What lives in
 * that pane can be expensive to build — the builder's preview is a sandboxed
 * iframe running a sketch — and tearing it down would mean re-collapsing and
 * re-expanding restarts whatever it was doing. It is inert while shut, so
 * nothing inside it is reachable by tab.
 *
 * @param {React.ReactNode} start - Left region.
 * @param {React.ReactNode} end - Right region.
 * @param {number} [defaultFraction=0.5] - Initial share of the width given to `start`.
 * @param {number} [minStart=280] - Minimum px width of the start region.
 * @param {number} [minEnd=280] - Minimum px width of the end region.
 * @param {boolean} [collapsed=false] - Squeezes `end` and the divider shut; `start` takes the full width.
 * @param {(collapsed: boolean) => void} [onCollapsedChange] - Fires when a drag
 *   carries the divider far enough past `minEnd` to shut `end`, and when the
 *   shut divider is clicked to bring it back. Passing it is what enables
 *   drag-to-collapse at all.
 * @param {(fraction: number) => void} [onFractionChange] - Fires as the divider moves.
 * @param {string} [ariaLabel="Resize panels"] - Accessible name for the divider.
 * @param {string} [expandLabel="Expand panel"] - Accessible name for the divider
 *   while `end` is shut, when it acts as a button rather than a separator.
 * @param {React.CSSProperties} [style] - Override for the root.
 *
 * @example
 * <SplitPane start={<WorkPanels />} end={<Preview />} defaultFraction={0.5} />
 */
export default function SplitPane({
  start,
  end,
  defaultFraction = 0.5,
  minStart = 280,
  minEnd = 280,
  collapsed = false,
  onCollapsedChange,
  onFractionChange,
  ariaLabel = "Resize panels",
  expandLabel = "Expand panel",
  style = {},
}) {
  const rootRef = useRef(null);
  const [fraction, setFraction] = useState(defaultFraction);
  const [dragging, setDragging] = useState(false);

  // Whether the gesture in progress has already shut the pane.
  const shutByDragRef = useRef(false);

  const applyClientX = useCallback(
    (clientX) => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const total = rect.width;
      if (total <= 0) return;

      // Dragging a shut divider does nothing — it reopens on click instead.
      // Reopening by drag would mean deciding the threshold against a width
      // that the collapse itself has already changed, and the two states end up
      // straddling the boundary and chattering.
      if (collapsed) return;

      const raw = clientX - rect.left;

      // Past `minEnd` the divider stops following the pointer, and that travel
      // is what separates "make it small" from "close it". Once it has shut,
      // the rest of the gesture is ignored: the pointer is already deep in
      // territory that would just shut it again.
      if (onCollapsedChange && !shutByDragRef.current) {
        if (raw > total - GUTTER - minEnd + COLLAPSE_OVERDRAG) {
          shutByDragRef.current = true;
          onCollapsedChange(true);
          // The fraction it had is worth keeping for when it comes back.
          return;
        }
      }

      // Clamp in pixels, then convert back — a fraction clamp would let a
      // narrow window push a pane below its minimum.
      const lower = minStart;
      const upper = total - GUTTER - minEnd;
      if (upper < lower) return; // Too narrow to honour both minimums.
      const clamped = Math.min(Math.max(raw, lower), upper);
      const next = clamped / total;
      setFraction(next);
      onFractionChange?.(next);
    },
    [minStart, minEnd, collapsed, onCollapsedChange, onFractionChange]
  );

  // Keep the split honest when the container itself changes width.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      const total = root.getBoundingClientRect().width;
      if (total <= 0) return;
      const upper = total - GUTTER - minEnd;
      if (upper < minStart) return;
      setFraction((current) => {
        const px = current * total;
        const clamped = Math.min(Math.max(px, minStart), upper);
        return clamped / total;
      });
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [minStart, minEnd]);

  const onPointerDown = (e) => {
    if (collapsed) return; // Shut: the divider is a button, not a handle.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    shutByDragRef.current = false;
    setDragging(true);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    applyClientX(e.clientX);
  };

  const endDrag = (e) => {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);
  };

  const onKeyDown = (e) => {
    const root = rootRef.current;
    if (!root) return;

    // Shut, the divider is a button, and the only thing it does is reopen.
    if (collapsed) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCollapsedChange?.(false);
      }
      return;
    }

    const total = root.getBoundingClientRect().width;
    const step = e.shiftKey ? 64 : 16;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      applyClientX(root.getBoundingClientRect().left + fraction * total - step);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      applyClientX(root.getBoundingClientRect().left + fraction * total + step);
    }
  };

  // A drag is the pointer's width to set, not an animation's: easing every
  // pointermove would leave the divider trailing behind the cursor. Shutting is
  // the exception — the pane is no longer tracking anything at that point, and
  // snapping it closed after the overdrag is what made it feel abrupt.
  const transition =
    dragging && !collapsed ? { duration: 0 } : COLLAPSE_TRANSITION;

  return (
    <div
      ref={rootRef}
      className="DesignSystem-SplitPane"
      style={{ ...ROOT_STYLE, ...style }}
    >
      {/* Shrinkable, deliberately. While the pane is animating to `100%` the
          space around the split can be changing too — a rail arriving beside
          it — and a pane that refused to shrink would hold the stale width and
          push everything to its right off the page. */}
      <motion.div
        className="DesignSystem-SplitPane-Start"
        style={PANE_STYLE}
        animate={{ width: collapsed ? "100%" : `${fraction * 100}%` }}
        transition={transition}
      >
        {start}
      </motion.div>
      {/* The divider stays put when the pane shuts. It is the one bit of the
          split that never moves, so leaving it there is what makes the collapse
          read as the pane sliding behind it — and it doubles as the way back. */}
      <div
        role={collapsed ? "button" : "separator"}
        aria-orientation={collapsed ? undefined : "vertical"}
        aria-label={collapsed ? expandLabel : ariaLabel}
        aria-valuenow={collapsed ? undefined : Math.round(fraction * 100)}
        tabIndex={0}
        className="DesignSystem-SplitPane-Divider"
        style={{
          ...GUTTER_STYLE,
          cursor: collapsed ? "pointer" : "col-resize",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        onClick={collapsed ? () => onCollapsedChange?.(false) : undefined}
      >
        <span
          style={{
            ...HANDLE_STYLE,
            ...(dragging ? HANDLE_ACTIVE_STYLE : null),
          }}
        />
      </div>
      {/* `end` takes whatever the start pane and the divider leave behind, so it
          needs no animation of its own — at full collapse that remainder is 0. */}
      <div
        className="DesignSystem-SplitPane-End"
        style={{ ...PANE_STYLE, flex: "1 1 0%" }}
        aria-hidden={collapsed || undefined}
        {...(collapsed ? { inert: "" } : null)}
      >
        {end}
      </div>
    </div>
  );
}
