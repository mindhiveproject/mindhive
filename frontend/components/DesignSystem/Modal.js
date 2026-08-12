"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

const OVERLAY_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: 20050,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0, 0, 0, 0.4)",
  padding: 16,
};

const DIALOG_STYLE = {
  width: "100%",
  background: "var(--MH-Theme-Neutrals-White, #ffffff)",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.18)",
  padding: "24px 24px 20px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

const TITLE_STYLE = {
  margin: "0 0 12px",
  fontFamily: "Inter, sans-serif",
  fontSize: 18,
  fontWeight: 600,
  lineHeight: 1.3,
  color: "var(--MH-Theme-Neutrals-Black, #1a1a1a)",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  width: "100%",
  boxSizing: "border-box",
};

const BODY_STYLE = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: 1.5,
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
  minHeight: 0,
  flex: 1,
  overflowY: "auto",
};

const ACTIONS_STYLE = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 20,
  flexShrink: 0,
};

const FROSTED_SURFACE = {
  background: "rgba(255, 255, 255, 0.72)",
  backdropFilter: "blur(12px) saturate(1.2)",
  WebkitBackdropFilter: "blur(12px) saturate(1.2)",
};

/**
 * Design System Modal (basic). Portal overlay with title, body, and optional actions.
 *
 * @param {boolean} open - Whether the modal is visible.
 * @param {() => void} onClose - Called on backdrop click or Escape.
 * @param {React.ReactNode} [title] - Optional header content.
 * @param {React.ReactNode} children - Body content.
 * @param {React.ReactNode} [actions] - Optional footer slot (e.g. DesignSystem Buttons).
 * @param {number} [maxWidth=420] - Dialog max-width in px.
 * @param {number|string} [maxHeight] - Dialog max-height (px number or CSS string, e.g. "90vh").
 * @param {number|string} [height] - Dialog height (px number or CSS string). Use with maxHeight for fixed-size flex layouts.
 * @param {"default"|"large"} [size="default"] - Preset: large → 800px wide, 90vh tall.
 * @param {React.CSSProperties} [bodyStyle] - Optional style merge for the scrollable body.
 * @param {boolean} [frostedChrome=false] - Overlay title/actions as frosted glass so body content soft-blurs underneath.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 420,
  maxHeight,
  height,
  size = "default",
  bodyStyle,
  frostedChrome = false,
}) {
  const titleId = useId();

  const resolvedMaxWidth = size === "large" ? Math.max(maxWidth, 800) : maxWidth;
  const resolvedMaxHeight =
    maxHeight != null
      ? maxHeight
      : size === "large"
        ? "90vh"
        : undefined;

  useEffect(() => {
    if (!open || typeof onClose !== "function") return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const toCssSize = (value) =>
    typeof value === "number" ? `${value}px` : value;

  const dialogStyle = {
    ...DIALOG_STYLE,
    maxWidth: resolvedMaxWidth,
    ...(frostedChrome
      ? {
          position: "relative",
          overflow: "hidden",
          padding: 0,
        }
      : null),
  };
  if (resolvedMaxHeight != null) {
    dialogStyle.maxHeight = toCssSize(resolvedMaxHeight);
  }
  if (height != null) {
    dialogStyle.height = toCssSize(height);
  }

  const titleStyle = frostedChrome
    ? {
        ...TITLE_STYLE,
        ...FROSTED_SURFACE,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        margin: 0,
        padding: "24px 24px 12px",
        borderBottom: "1px solid rgba(211, 218, 224, 0.45)",
      }
    : TITLE_STYLE;

  const actionsStyle = frostedChrome
    ? {
        ...ACTIONS_STYLE,
        ...FROSTED_SURFACE,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        margin: 0,
        padding: "12px 24px 20px",
        borderTop: "1px solid rgba(211, 218, 224, 0.45)",
      }
    : ACTIONS_STYLE;

  // Full-bleed body so nested scrollers can pass under frosted overlays.
  // Consumers should pad their scroll content (top/bottom) for chrome clearance.
  // Frosted layout keys are applied last so they win over bodyStyle.
  const resolvedBodyStyle = {
    ...BODY_STYLE,
    ...bodyStyle,
    ...(frostedChrome
      ? {
          position: "absolute",
          inset: 0,
          flex: "none",
          width: "auto",
          height: "auto",
          minHeight: 0,
          padding: "0 24px",
          boxSizing: "border-box",
        }
      : null),
  };

  return createPortal(
    <div
      role="presentation"
      className="DesignSystem-Modal-Overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && typeof onClose === "function") {
          onClose();
        }
      }}
      style={OVERLAY_STYLE}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title != null ? titleId : undefined}
        className="DesignSystem-Modal"
        onClick={(e) => e.stopPropagation()}
        style={dialogStyle}
      >
        {title != null ? (
          <h2 id={titleId} className="DesignSystem-Modal-Title" style={titleStyle}>
            {title}
          </h2>
        ) : null}
        <div className="DesignSystem-Modal-Body" style={resolvedBodyStyle}>
          {children}
        </div>
        {actions != null ? (
          <div className="DesignSystem-Modal-Actions" style={actionsStyle}>
            {actions}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
