import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 20040,
  background: "rgba(23, 23, 23, 0.35)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalStyle = {
  width: "min(480px, 100%)",
  background: "#fff",
  border: "1px solid #A1A1A1",
  borderRadius: 16,
  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.18)",
  padding: 32,
  fontFamily: "Inter, sans-serif",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #A1A1A1",
  borderRadius: 8,
  padding: "12px 16px",
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  lineHeight: "24px",
  color: "#171717",
};

export default function AddSectionModal({ open, onClose, onSubmit, creating }) {
  const { t } = useTranslation("builder");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!open) setTitle("");
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const trimmedTitle = title.trim();
  const submitDisabled = creating || !trimmedTitle;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitDisabled) return;
    onSubmit(trimmedTitle);
  };

  return createPortal(
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget && !creating) onClose();
      }}
    >
      <form style={modalStyle} onSubmit={handleSubmit}>
        <h2
          style={{
            margin: "0 0 24px",
            fontFamily: "Inter, sans-serif",
            fontSize: 24,
            lineHeight: "32px",
            fontWeight: 700,
            color: "#171717",
          }}
        >
          {t("inner.newSection", {}, { default: "New section" })}
        </h2>

        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t(
            "inner.sectionTitlePlaceholder",
            {},
            { default: "Enter section title" }
          )}
          style={inputStyle}
          aria-label={t(
            "inner.sectionTitlePlaceholder",
            {},
            { default: "Enter section title" }
          )}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 28,
          }}
        >
          <Button
            type="button"
            variant="outline"
            disabled={creating}
            onClick={onClose}
          >
            {t("section.createCardModal.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button type="submit" disabled={submitDisabled}>
            {t("inner.addSection", {}, { default: "Add section" })}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  );
}
