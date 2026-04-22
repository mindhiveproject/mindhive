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
            style={{
              marginLeft: 8,
              padding: "8px 16px",
              border: "none",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              background: "#c62828",
              color: "#fff",
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
