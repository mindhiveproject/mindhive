"use client";

import clsx from "clsx";

const INFO_ICON = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, display: "block" }}
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M12 9V9.001"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 12v4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CLOSE_ICON = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, display: "block" }}
    aria-hidden
  >
    <path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
      fill="currentColor"
    />
  </svg>
);

const VARIANT_STYLES = {
  warning: {
    background: "var(--MH-Theme-Warning-Light, #edcecd)",
    backgroundColor: "var(--MH-Theme-Warning-Light, #edcecd)",
    color: "var(--MH-Theme-Warning-Dark, #8f1f14)",
  },
  information: {
    background: "var(--MH-Theme-Additional-Accent-Light, #f5f2ff)",
    backgroundColor: "var(--MH-Theme-Additional-Accent-Light, #f5f2ff)",
    color: "var(--MH-Theme-Additional-Accent-Dark, #3f288f)",
  },
  /** Toned-down empty / idle state */
  neutral: {
    background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
    backgroundColor: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
    color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
  },
  success: {
    background: "var(--MH-Theme-Neutrals-Light-Green, #f6f9f8)",
    backgroundColor: "var(--MH-Theme-Neutrals-Light-Green, #f6f9f8)",
    color: "var(--MH-Theme-Success-Dark, #1d6b3a)",
  },
};

const CLOSE_BUTTON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  padding: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  borderRadius: "4px",
  flexShrink: 0,
};

const MESSAGE_CARD_FOCUS_STYLE = `
.DesignSystem-MessageCard:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
  outline-offset: 2px;
}
.DesignSystem-MessageCard [data-message-close]:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
  outline-offset: 2px;
}
`;

/**
 * Slim status / callout banner matching Figma Message Cards (Warnings & Popups).
 *
 * @param {"warning"|"information"|"neutral"|"success"} [variant="information"] - Color tone.
 * @param {React.ReactNode} message - Short status text (required).
 * @param {() => void} [onClick] - Makes the card keyboard-activatable and clickable.
 * @param {() => void} [onClose] - Optional dismiss control. When set, trailing icon is X only (no info icon).
 * @param {string} [closeAriaLabel] - Accessible name for the dismiss control (pass via t()).
 * @param {string} [className] - Optional class for the root.
 * @param {string} [ariaLabel] - Accessible name when clickable or when message is not plain text.
 * @param {React.CSSProperties} [style] - Optional style overrides.
 */
export default function MessageCard({
  variant = "information",
  message,
  onClick,
  onClose,
  closeAriaLabel,
  className,
  ariaLabel,
  style,
}) {
  const tones = VARIANT_STYLES[variant] || VARIANT_STYLES.information;
  const isClickable = typeof onClick === "function";
  const hasClose = typeof onClose === "function";

  const handleKeyDown = (e) => {
    if (!isClickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const target = e.target;
      if (target.closest?.("[data-message-close]")) return;
      onClick(e);
    }
  };

  const handleRootClick = (e) => {
    if (!isClickable) return;
    if (e.target.closest?.("[data-message-close]")) return;
    onClick(e);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MESSAGE_CARD_FOCUS_STYLE }} />
      <div
        role={isClickable ? "button" : "status"}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={ariaLabel}
        className={clsx("DesignSystem-MessageCard", className)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          width: "100%",
          boxSizing: "border-box",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "none",
          fontFamily: "Inter, sans-serif",
          fontWeight: 400,
          fontSize: "16px",
          lineHeight: "24px",
          ...tones,
          cursor: isClickable ? "pointer" : "default",
          ...style,
        }}
        onClick={handleRootClick}
        onKeyDown={handleKeyDown}
      >
        <span
          style={{
            flex: "1 1 auto",
            minWidth: 0,
            wordBreak: "break-word",
          }}
        >
          {message}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            flexShrink: 0,
            color: "inherit",
          }}
        >
          {hasClose ? (
            <button
              type="button"
              data-message-close
              style={CLOSE_BUTTON_STYLE}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label={closeAriaLabel}
            >
              {CLOSE_ICON}
            </button>
          ) : (
            INFO_ICON
          )}
        </span>
      </div>
    </>
  );
}
