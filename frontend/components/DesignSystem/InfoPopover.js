"use client";

import { useCallback, useRef, useState } from "react";

import Popover from "./Popover";

/** Matches the muted grey the info icon is drawn in throughout the app. */
const ICON_FILTER =
  "brightness(0) saturate(100%) invert(28%) sepia(8%) saturate(1200%) hue-rotate(240deg) brightness(95%) contrast(85%)";

const ICON_BUTTON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  padding: 0,
  border: "none",
  background: "none",
  cursor: "pointer",
};

const ICON_STYLE = {
  width: 20,
  height: 20,
  display: "block",
  filter: ICON_FILTER,
};

/**
 * Wraps a caller's own trigger. Shrink-wraps for the same reason Tooltip's
 * trigger does: so the panel is anchored to the thing you clicked.
 */
const TRIGGER_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  maxWidth: "100%",
  minWidth: 0,
  cursor: "pointer",
};

const BODY_STYLE = {
  padding: "12px 16px",
  overflowY: "auto",
};

/**
 * Design System InfoPopover. Click-to-open help panel: an info icon — or a
 * trigger of your own — that opens a Popover holding the explanation.
 *
 * Reach for this instead of Tooltip whenever the panel holds links, lists, or
 * more than a short label. A Tooltip is pointer-transparent and disappears on
 * mouse-out, so nothing inside one can be read at length or clicked.
 *
 * @param {React.ReactNode} content - Panel body.
 * @param {React.ReactNode} [children] - Trigger. Defaults to an info icon
 *   button. A trigger of your own is wrapped in a button-role span, so pass
 *   presentational markup — a Chip, a styled span — rather than your own button.
 * @param {"top"|"bottom"|"left"|"right"} [side="bottom"] - Preferred placement.
 * @param {"start"|"end"} [align="start"] - Which edges line up across `side`.
 * @param {number} [width=320] - Panel width in px, capped to the viewport.
 * @param {string} [ariaLabel] - Accessible name for the panel and its icon.
 * @param {string} [iconSrc="/assets/icons/info.svg"] - Default trigger's icon.
 * @param {string} [className] - Optional class for the trigger wrapper.
 *
 * @example
 * <InfoPopover
 *   content={<ResourcesHelpLinks items={items} />}
 *   ariaLabel="Scatter plot resources"
 *   iconSrc="/assets/icons/visualize/question_mark.svg"
 * />
 */
export default function InfoPopover({
  content,
  children,
  side = "bottom",
  align = "start",
  width = 320,
  ariaLabel,
  iconSrc = "/assets/icons/info.svg",
  className,
}) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback((event) => {
    // Callsites sit inside cards and rows that navigate on click.
    event.stopPropagation();
    setOpen((wasOpen) => !wasOpen);
  }, []);

  const trigger = children ? (
    <span
      ref={triggerRef}
      role="button"
      tabIndex={0}
      className={
        className
          ? `DesignSystem-InfoPopover-trigger ${className}`
          : "DesignSystem-InfoPopover-trigger"
      }
      style={TRIGGER_STYLE}
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggle(event);
      }}
    >
      {children}
    </span>
  ) : (
    <button
      ref={triggerRef}
      type="button"
      className={
        className
          ? `DesignSystem-InfoPopover-trigger ${className}`
          : "DesignSystem-InfoPopover-trigger"
      }
      style={ICON_BUTTON_STYLE}
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={toggle}
    >
      <img src={iconSrc} alt="" aria-hidden style={ICON_STYLE} />
    </button>
  );

  return (
    <>
      {trigger}
      <Popover
        open={open}
        anchorRef={triggerRef}
        onClose={close}
        side={side}
        align={align}
        width={width}
        ariaLabel={ariaLabel}
      >
        <div className="DesignSystem-InfoPopover-body MH-Type-Body-Base" style={BODY_STYLE}>
          {content}
        </div>
      </Popover>
    </>
  );
}
