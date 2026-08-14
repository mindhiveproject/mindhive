import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import FormDefinitionPreview from "./FormDefinitionPreview";
import { milestoneHasReviewQuestionnaire } from "../../../lib/milestones";

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
  width: "min(720px, 90vw)",
  maxHeight: "90vh",
  overflowY: "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  background: "#fff",
  border: "1px solid #A1A1A1",
  borderRadius: 16,
  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.18)",
  padding: 32,
  fontFamily: "Inter, sans-serif",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 24,
};

const titleStyle = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: 22,
  lineHeight: "28px",
  fontWeight: 700,
  color: "#171717",
};

const closeButtonStyle = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 4,
  fontSize: 24,
  lineHeight: 1,
  color: "#625b71",
  flexShrink: 0,
};

export default function FormDefinitionPreviewModal({
  open,
  onClose,
  board,
  milestone,
  actionLabel,
  onEdit,
  editBusy = false,
  onCopy,
  copyBusy = false,
}) {
  const { t } = useTranslation("classes");
  const hasQuestionnaire = milestoneHasReviewQuestionnaire(milestone);

  if (!open || typeof document === "undefined") return null;

  const title = hasQuestionnaire
    ? t(
        "projects.milestonesMenu.previewModalTitle",
        { action: actionLabel || "" },
        { default: "Review form — {{action}}" }
      )
    : t(
        "projects.milestonesMenu.previewModalTitleNoForm",
        { action: actionLabel || "" },
        { default: "{{action}}" }
      );

  const footerAction = onCopy || onEdit;
  const footerBusy = onCopy ? copyBusy : editBusy;
  const footerBusyLabel = onCopy
    ? t("projects.milestonesMenu.copyingMilestone", {}, {
        default: "Copying…",
      })
    : t("projects.milestonesMenu.openingEditor", {}, {
        default: "Opening editor…",
      });
  const footerLabel = onCopy
    ? t("projects.milestonesMenu.copyToCustomize", {}, {
        default: "Copy milestone to customize",
      })
    : t("projects.milestonesMenu.editForm", {}, {
        default: "Edit form",
      });

  return createPortal(
    <div
      style={overlayStyle}
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-definition-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={headerStyle}>
          <h2 id="form-definition-preview-title" style={titleStyle}>
            {title}
          </h2>
          <button
            type="button"
            style={closeButtonStyle}
            onClick={onClose}
            aria-label={t("main.close", {}, { default: "Close" })}
          >
            ×
          </button>
        </div>
        <FormDefinitionPreview
          board={board}
          milestone={milestone}
          proposalBoardId={board?.id}
          maxHeight="none"
        />
        {footerAction ? (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid #E6E6E6",
            }}
          >
            <Button
              type="button"
              variant="filled"
              disabled={footerBusy || !milestone?.id}
              onClick={footerAction}
            >
              {footerBusy ? footerBusyLabel : footerLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
