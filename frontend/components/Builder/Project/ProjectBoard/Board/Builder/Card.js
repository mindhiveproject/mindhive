import ReactHtmlParser from "react-html-parser";
import { Draggable } from "react-smooth-dnd";
import useTranslation from "next-translate/useTranslation";

import { Popup } from "semantic-ui-react";
import { StyledProposalCard } from "../../../../../styles/StyledProposal";
import { getRegularCardVariant } from "../../../../../utils/cardVariants";

import { useRouter } from "next/router";

export default function Card({
  card,
  proposalBuildMode,
  adminMode,
  openCard,
  onDeleteCard,
  settings,
  boardId,
  sectionSummary,
  submitStatuses,
}) {
  const { t } = useTranslation("builder");

  const router = useRouter();
  
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
      // Also handle translated/alternative status values
      [t("card.status.inProgress", "In progress")]: "/assets/icons/status/inProgress.svg",
      [t("card.status.completed", "Completed")]: "/assets/icons/status/completed.svg",
      [t("card.status.helpNeeded", "Help needed")]: "/assets/icons/status/helpNeeded.svg",
      [t("card.status.comments", "Comments")]: "/assets/icons/status/comments.svg",
      [t("card.status.notStarted", "Not started")]: "/assets/icons/status/notStarted.svg",
      [t("card.status.needsRevision", "Needs revision")]: "/assets/icons/status/TriangleWarning.svg",
    };
    return statusIconMap[status] || "/assets/icons/status/notStarted.svg";
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
          router.push({
            pathname: `/builder/projects`,
            query: {
              selector: boardId,
              card: card?.id,
            },
          });
        }}
      >
        <div className="card-drag-handle">
          <div className="card-information" id="card">
            <div className="card-left-side">
              <img src={getStatusIcon()} alt="status icon" />
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
        {settings?.allowAddingCards && (
          <div className="deleteCardBtn">
            <img
              src="/assets/icons/proposal/delete.svg"
              onClick={(e) => {
                e.stopPropagation();
                if (
                  confirm(
                    t(
                      "card.deleteConfirm",
                      "Are you sure you want to delete this card? This action cannot be undone."
                    )
                  )
                ) {
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
