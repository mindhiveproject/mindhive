import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

import ActionCardTypeBadge from "./ActionCardTypeBadge";
import Button from "../../../DesignSystem/Button";
import {
  getActionCardLabel,
  resolveActionCardMilestone,
} from "../../../../lib/templateBoardActionCards";

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
  width: "min(640px, 90vw)",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "#fff",
  border: "1px solid #A1A1A1",
  borderRadius: 16,
  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.18)",
  padding: 32,
  fontFamily: "Inter, sans-serif",
};

const bodyStyle = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  scrollbarWidth: "thin",
};

const footerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  flexShrink: 0,
  marginTop: 20,
  paddingTop: 16,
  borderTop: "1px solid #E6E6E6",
  background: "#fff",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 24,
  flexShrink: 0,
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

const cardListStyle = {
  display: "grid",
  gap: 12,
};

const cardStyle = {
  border: "1px solid #E6E6E6",
  borderRadius: 12,
  padding: "16px 18px",
  display: "grid",
  gap: 12,
  background: "#FBFBFA",
};

const cardTitleRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const cardTitleStyle = {
  margin: 0,
  fontSize: 16,
  lineHeight: "22px",
  fontWeight: 600,
  color: "#171717",
};

const metaStyle = {
  margin: 0,
  fontSize: 13,
  lineHeight: "18px",
  color: "#625b71",
};

const cardActionsStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 10,
};

function getSectionLabel(section, t) {
  const title = section?.title?.trim();
  if (title) return title;
  return t("projects.milestonesMenu.unnamedColumn", {}, {
    default: "Untitled column",
  });
}


export default function TemplateBoardMilestonesManageModal({
  open,
  onClose,
  board,
  actionCards = [],
  milestones = [],
  onPreview,
  onAddMilestone,
  onDeleteCard,
  deletingCardId = null,
}) {
  const { t } = useTranslation("classes");
  const { t: tBuilder } = useTranslation("builder");

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
      <div
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-milestones-manage-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={headerStyle}>
          <div>
            <h2 id="template-milestones-manage-title" style={titleStyle}>
              {t("projects.milestonesMenu.manageModalTitle", {}, {
                default: "Manage milestones",
              })}
            </h2>
            {board?.title ? (
              <p style={{ ...metaStyle, marginTop: 6 }}>{board.title}</p>
            ) : null}
          </div>
          <button
            type="button"
            style={closeButtonStyle}
            onClick={onClose}
            aria-label={t("main.close", {}, { default: "Close" })}
          >
            ×
          </button>
        </div>

        <div style={bodyStyle}>
          {actionCards.length === 0 ? (
            <p style={metaStyle}>
              {t("projects.milestonesMenu.empty", {}, {
                default: "No review steps on this template yet.",
              })}
            </p>
          ) : (
            <div style={cardListStyle}>
              {actionCards.map(({ card, section }) => {
                const actionLabel = getActionCardLabel(card, tBuilder);
                const sectionLabel = getSectionLabel(section, t);
                const milestone = resolveActionCardMilestone(card, milestones);

                return (
                  <div key={card.id} style={cardStyle}>
                    <div style={cardTitleRowStyle}>
                      <h3 style={cardTitleStyle}>{actionLabel}</h3>
                      <ActionCardTypeBadge
                        card={card}
                        style={{ fontSize: 12, padding: "3px 10px" }}
                      />
                    </div>
                    <p style={metaStyle}>
                      {t(
                        "projects.milestonesMenu.columnLabel",
                        { section: sectionLabel },
                        { default: "Column: {{section}}" }
                      )}
                    </p>
                    <div style={cardActionsStyle}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          onPreview({ card, milestone, actionLabel })
                        }
                      >
                        {t("projects.milestonesMenu.previewForm", {}, {
                          default: "Preview review form",
                        })}
                      </Button>
                      <Button
                        type="button"
                        variant="text"
                        disabled={deletingCardId === card.id}
                        onClick={() => onDeleteCard?.(card, actionLabel)}
                      >
                        {deletingCardId === card.id
                          ? t("projects.milestonesMenu.deletingMilestone", {}, {
                              default: "Removing…",
                            })
                          : t("projects.milestonesMenu.deleteMilestone", {}, {
                              default: "Remove from template",
                            })}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={footerStyle}>
          <Button type="button" variant="filled" onClick={onAddMilestone}>
            {t("projects.milestonesMenu.addMilestone", {}, {
              default: "Add milestone",
            })}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
