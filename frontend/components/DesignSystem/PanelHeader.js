"use client";

import IconButton from "./IconButton";
import { CloseIcon } from "./Icons";

const HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  flexShrink: 0,
  padding: 16,
};

const TITLE_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const ACTIONS_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  flexShrink: 0,
};

/**
 * Design System Panel Header. Title row with an optional actions slot and a
 * close button, for any dismissible surface — popover, drawer, modal.
 *
 * @param {React.ReactNode} title - Header text.
 * @param {string} [titleId] - Id for the title, to point `aria-labelledby` at.
 * @param {React.ReactNode} [actions] - Controls placed left of the close button.
 * @param {() => void} [onClose] - Shows a close button when provided.
 * @param {string} [closeLabel="Close"] - Accessible name for the close button.
 */
export default function PanelHeader({
  title,
  titleId,
  actions = null,
  onClose,
  closeLabel = "Close",
}) {
  return (
    <div className="DesignSystem-PanelHeader" style={HEADER_STYLE}>
      <h2
        id={titleId}
        className="DesignSystem-PanelHeader-Title MH-Type-Title-Base"
        style={TITLE_STYLE}
      >
        {title}
      </h2>
      <div className="DesignSystem-PanelHeader-Actions" style={ACTIONS_STYLE}>
        {actions}
        {onClose ? (
          <IconButton
            variant="subtle"
            icon={<CloseIcon />}
            ariaLabel={closeLabel}
            title={closeLabel}
            onClick={onClose}
          />
        ) : null}
      </div>
    </div>
  );
}
