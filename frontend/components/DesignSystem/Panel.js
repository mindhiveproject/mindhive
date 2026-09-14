"use client";

import PanelHeader from "./PanelHeader";

const ROOT_STYLE = {
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 0,
  borderRadius: 12,
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  boxShadow: "var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0,0,0,0.1))",
  overflow: "hidden",
};

const BODY_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  minHeight: 0,
  flex: "1 1 0%",
  overflowY: "auto",
  overflowX: "hidden",
  padding: "12px 16px 16px",
};

/**
 * Design System Panel: the white 12px-radius surface a work panel, drawer or
 * side panel is built from — a `PanelHeader` (title, optional subtitle,
 * actions, optional close) over a scrolling body. Positioning (fixed,
 * sticky, pinned to a corner, filling a layout cell) is the caller's concern
 * via `style`; this only owns the surface, the header and the body scroll.
 *
 * @param {React.ReactNode} title - Panel heading, passed to `PanelHeader`.
 * @param {React.ReactNode} [subtitle] - Optional second line under the title.
 * @param {React.ReactNode} [actions] - Controls placed left of the close button.
 * @param {() => void} [onClose] - Shows a close button in the header when provided.
 * @param {string} [closeLabel="Close"] - Accessible name for the close button.
 * @param {React.ReactNode} children - Panel body.
 * @param {boolean} [flush=false] - Drops the body's padding and gap, for panels
 *   whose content owns its own edges (a canvas, an editor).
 * @param {React.CSSProperties} [style] - Override for the root.
 * @param {React.CSSProperties} [bodyStyle] - Override for the body.
 * @param {string} [className] - Optional extra class on the root.
 */
export default function Panel({
  title,
  subtitle,
  actions = null,
  onClose,
  closeLabel = "Close",
  children,
  flush = false,
  style = {},
  bodyStyle = {},
  className,
}) {
  return (
    <section
      className={className ? `DesignSystem-Panel ${className}` : "DesignSystem-Panel"}
      style={{ ...ROOT_STYLE, ...style }}
    >
      <PanelHeader title={title} subtitle={subtitle} actions={actions} onClose={onClose} closeLabel={closeLabel} />
      <div
        style={
          flush
            ? { ...BODY_STYLE, gap: 0, padding: 0, overflow: "hidden" }
            : { ...BODY_STYLE, ...bodyStyle }
        }
      >
        {children}
      </div>
    </section>
  );
}
