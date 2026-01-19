import ReactHtmlParser from "react-html-parser";
import { Draggable } from "react-smooth-dnd";

import { Popup } from "semantic-ui-react";
import { StyledProposalCard } from "../../styles/StyledProposal";
import { getRegularCardVariant } from "../../utils/cardVariants";
import useTranslation from "next-translate/useTranslation";

export default function Card({
  card,
  proposalBuildMode,
  adminMode,
  openCard,
  onDeleteCard,
  settings,
  isPreview,
  submitStatuses = {},
}) {
  const { t } = useTranslation("builder");
  
  // Get card variant based on settings and statuses
  const cardVariant = getRegularCardVariant(card, submitStatuses);

  // Get status icon based on card status (matching Status.js options)
  const getStatusIcon = () => {
    const status = card?.settings?.status || "Not started";
    const statusIconMap = {
      "In progress": "/assets/icons/status/inProgress.svg",
      "Completed": "/assets/icons/status/completed.svg",
      "Help needed": "/assets/icons/status/helpNeeded.svg",
      "Comments": "/assets/icons/status/comments.svg",
      "Not started": "/assets/icons/status/notStarted.svg",
      "Needs revision": "/assets/icons/status/TriangleWarning.svg",
      // Also handle legacy status values
      "Started": "/assets/icons/status/inProgress.svg",
      "Needs feedback": "/assets/icons/status/helpNeeded.svg",
      "Feedback given": "/assets/icons/status/comments.svg",
      "Closed": "/assets/icons/status/inProgress.svg",
      "On-Hold": "/assets/icons/status/helpNeeded.svg",
    };
    // Also check translated values
    const translatedStatusMap = {
      [t("statusCard.inProgress", "In progress")]: "/assets/icons/status/inProgress.svg",
      [t("statusCard.completed", "Completed")]: "/assets/icons/status/completed.svg",
      [t("statusCard.helpNeeded", "Help needed")]: "/assets/icons/status/helpNeeded.svg",
      [t("statusCard.comments", "Comments")]: "/assets/icons/status/comments.svg",
      [t("statusCard.notStarted", "Not started")]: "/assets/icons/status/notStarted.svg",
      [t("statusCard.needsRevision", "Needs revision")]: "/assets/icons/status/TriangleWarning.svg",
    };
    return statusIconMap[status] || translatedStatusMap[status] || "/assets/icons/status/notStarted.svg";
  };

  // Determine icon path for feedback tag
  const getFeedbackIcon = () => {
    if (cardVariant.variant === "FEEDBACK_SUBMITTED") {
      return "/assets/icons/status/publicTemplatesubmitted.svg"; // Checkmark icon
    } else if (cardVariant.variant === "FEEDBACK_NON_SUBMITTED") {
      return "/assets/icons/status/publicTemplate.svg"; // Clipboard icon
    }
    return null;
  };

  return (
    <Draggable key={card.id}>
      <StyledProposalCard
        variant={cardVariant.variant}
        onClick={() => {
          openCard(card);
        }}
      >
        <div className="card-drag-handle">
          <div className="card-information">
            <div className="card-left-side">
              {proposalBuildMode && <img src="/assets/icons/pencil.svg" alt="edit" />}
              {!proposalBuildMode && !isPreview && (
                <img src={getStatusIcon()} alt="status icon" />
              )}
            </div>
            <div className="card-right-side">
              <div className="card-title">
                <div>
                  <div>{ReactHtmlParser(card.title)}</div>
                </div>
              </div>
            </div>
            {cardVariant.variant !== "NO_FEEDBACK" && (
              <Popup
                content={cardVariant.tooltipText || null}
                trigger={
                  <div className={`card-feedback-tag ${
                    cardVariant.variant === "FEEDBACK_SUBMITTED"
                      ? "feedback-submitted"
                      : "feedback-non-submitted"
                  }`}>
                    <img src={getFeedbackIcon()} alt="feedback status" />
                  </div>
                }
                disabled={!cardVariant.tooltipText}
                size="small"
              />
            )}
          </div>
        </div>
        {(proposalBuildMode || settings?.allowAddingCards) && (
          <div className="deleteCardBtn">
            <img
              src="/assets/icons/proposal/delete.svg"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(t("actionCard.deleteConfirm"))) {
                  onDeleteCard(card.id);
                }
              }}
            />
          </div>
        )}
      </StyledProposalCard>
    </Draggable>
  );
}
