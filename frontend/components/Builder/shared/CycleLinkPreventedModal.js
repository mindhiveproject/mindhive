import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";

/**
 * Small acknowledgment modal when a diagram link would create a circular flow.
 */
export default function CycleLinkPreventedModal({ open, onClose }) {
  const { t } = useTranslation("builder");
  const { t: tCommon } = useTranslation("common");

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.4)",
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cycle-link-prevented-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 420,
          width: "100%",
          background: "var(--MH-Theme-Neutrals-White, #ffffff)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.18)",
          padding: "24px 24px 20px",
          boxSizing: "border-box",
        }}
      >
        <h2
          id="cycle-link-prevented-title"
          style={{
            margin: "0 0 12px",
            fontFamily: "Inter, sans-serif",
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.3,
            color: "var(--MH-Theme-Neutrals-Black, #1a1a1a)",
          }}
        >
          {t("engine.cycleLinkPreventedTitle", {}, {
            default: "Circular flow not allowed",
          })}
        </h2>
        <p
          style={{
            margin: "0 0 20px",
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
          }}
        >
          {t("engine.cycleLinkPrevented", {}, {
            default:
              "This connection would create a circular flow with no valid end. Choose a different path so the study can finish.",
          })}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="filled" type="button" onClick={onClose}>
            {tCommon("close", {}, { default: "Close" })}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
