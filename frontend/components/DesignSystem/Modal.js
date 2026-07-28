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
  maxWidth: 420,
  width: "100%",
  background: "var(--MH-Theme-Neutrals-White, #ffffff)",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.18)",
  padding: "24px 24px 20px",
  boxSizing: "border-box",
};

const TITLE_STYLE = {
  margin: "0 0 12px",
  fontFamily: "Inter, sans-serif",
  fontSize: 18,
  fontWeight: 600,
  lineHeight: 1.3,
  color: "var(--MH-Theme-Neutrals-Black, #1a1a1a)",
};

const BODY_STYLE = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: 1.5,
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const ACTIONS_STYLE = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 20,
};

/**
 * Design System Modal (basic). Portal overlay with title, body, and optional actions.
 *
 * @param {boolean} open - Whether the modal is visible.
 * @param {() => void} onClose - Called on backdrop click or Escape.
 * @param {React.ReactNode} [title] - Optional header content.
 * @param {React.ReactNode} children - Body content.
 * @param {React.ReactNode} [actions] - Optional footer slot (e.g. DesignSystem Buttons).
 */
export default function Modal({ open, onClose, title, children, actions }) {
  const titleId = useId();

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
        style={DIALOG_STYLE}
      >
        {title != null ? (
          <h2 id={titleId} className="DesignSystem-Modal-Title" style={TITLE_STYLE}>
            {title}
          </h2>
        ) : null}
        <div className="DesignSystem-Modal-Body" style={BODY_STYLE}>
          {children}
        </div>
        {actions != null ? (
          <div className="DesignSystem-Modal-Actions" style={ACTIONS_STYLE}>
            {actions}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
