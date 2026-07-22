import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import JustOneSecondNotice from "../../../DesignSystem/JustOneSecondNotice";
import ProposalBuilder from "../../../Proposal/Builder/Main";
import { StyledProposal } from "../../../styles/StyledProposal";

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
  width: "min(1100px, 90vw)",
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
  marginBottom: 20,
};

const titleBlockStyle = {
  flex: 1,
  minWidth: 0,
};

const titleStyle = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: 24,
  lineHeight: "32px",
  fontWeight: 700,
  color: "#171717",
};

const descriptionStyle = {
  margin: "8px 0 0",
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 400,
  color: "#625b71",
};

const previewShellStyle = {
  border: "1px solid #E6E6E6",
  borderRadius: 12,
  background: "#F7F9F8",
  color: "#5D5763",
  fontSize: 14,
  lineHeight: "20px",
  padding: 16,
  maxHeight: "min(65vh, 620px)",
  overflowY: "auto",
};

export default function TemplateBoardPreviewModal({ open, onClose, board }) {
  const { t } = useTranslation("classes");

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      style={overlayStyle}
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <style>{`
        .templateBoardPreviewModal .proposalBoard {
          margin: 0;
        }
      `}</style>
      <div
        className="templateBoardPreviewModal"
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-board-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={headerStyle}>
          <div style={titleBlockStyle}>
            <h2 id="template-board-preview-title" style={titleStyle}>
              {t(
                "projects.templatePreviewModal.title",
                { title: board?.title || "" },
                { default: "Preview — {{title}}" }
              )}
            </h2>
            {board?.description ? (
              <p style={descriptionStyle}>{board.description}</p>
            ) : null}
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("projects.boardSettingsModalClose", {}, { default: "Close" })}
          </Button>
        </div>

        {board?.id ? (
          <div style={previewShellStyle}>
            <StyledProposal>
              <ProposalBuilder
                proposalId={board.id}
                proposal={board}
                isPreview
                hidePreviewHeader
              />
            </StyledProposal>
          </div>
        ) : (
          <JustOneSecondNotice
            message={{
              h1: t("projectBoard.loading", {}, {
                default: "Loading project board...",
              }),
            }}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
