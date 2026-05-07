import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

import {
  StyledModalBody,
  StyledModalButton,
  StyledModalContent,
  StyledModalFooter,
  StyledModalHeader,
  StyledModalOverlay,
} from "../styles/StyledDataSourceModal";

export default function DeleteConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  loading = false,
  error = null,
  /** When true, use primary (blue) styling instead of danger red — e.g. confirm copy. */
  confirmPrimary = false,
  /** Optional extra nodes below the message (e.g. checkbox). */
  extraContent = null,
}) {
  const { t } = useTranslation("common");

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <StyledModalOverlay
      style={{ zIndex: 20050 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <StyledModalContent
        style={{ maxWidth: 440, width: "90%" }}
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
      >
        {/* <StyledModalHeader>
          <h2 style={{ margin: 0 }}>{title}</h2>
        </StyledModalHeader> */}
        <StyledModalBody>
          <p
            style={{
              margin: 0,
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              lineHeight: 1.5,
              color: "#333",
            }}
          >
            {message}
          </p>
          {error ? (
            <p
              role="alert"
              style={{
                marginTop: 12,
                marginBottom: 0,
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                color: "#c62828",
              }}
            >
              {error}
            </p>
          ) : null}
          {extraContent ? (
            <div style={{ marginTop: 14 }}>{extraContent}</div>
          ) : null}
        </StyledModalBody>
        <StyledModalFooter>
          <StyledModalButton
            type="button"
            className="cancel"
            disabled={loading}
            onClick={() => {
              if (!loading) onClose();
            }}
          >
            {t("cancel", {}, { default: "Cancel" })}
          </StyledModalButton>
          <StyledModalButton
            type="button"
            disabled={loading}
            className={confirmPrimary ? "save" : undefined}
            style={{
              marginLeft: 8,
              padding: "8px 16px",
              border: "none",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              ...(confirmPrimary
                ? { background: "#3182ce", color: "#fff" }
                : { background: "#c62828", color: "#fff" }),
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </StyledModalButton>
        </StyledModalFooter>
      </StyledModalContent>
    </StyledModalOverlay>,
    document.body,
  );
}
