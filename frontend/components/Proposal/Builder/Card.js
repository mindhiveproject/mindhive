import ReactHtmlParser from "react-html-parser";
import { Draggable } from "react-smooth-dnd";
import clsx from "clsx";

import Tooltip from "../../DesignSystem/Tooltip";
import { StyledProposalCard } from "../../styles/StyledProposal";
import { getRegularCardVariant } from "../../Utils/cardVariants";
import useTranslation from "next-translate/useTranslation";

export default function Card({
  card,
  sectionId,
  proposalBuildMode,
  adminMode,
  openCard,
  settings,
  isPreview,
  submitStatuses = {},
  cardSelectMode = false,
  selectKind = null,
  isSelected = false,
  onToggleCardSelection,
}) {
  const { t } = useTranslation("builder");

  const cardVariant = getRegularCardVariant(card, submitStatuses);

  const getStatusIcon = () => {
    const status = card?.settings?.status || "Not started";
    const statusIconMap = {
      "In progress": "/assets/icons/status/inProgress.svg",
      Completed: "/assets/icons/status/completed.svg",
      "Help needed": "/assets/icons/status/helpNeeded.svg",
      Comments: "/assets/icons/status/comments.svg",
      "Not started": "/assets/icons/status/notStarted.svg",
      "Needs revision": "/assets/icons/status/TriangleWarning.svg",
      Started: "/assets/icons/status/inProgress.svg",
      "Needs feedback": "/assets/icons/status/helpNeeded.svg",
      "Feedback given": "/assets/icons/status/comments.svg",
      Closed: "/assets/icons/status/inProgress.svg",
      "On-Hold": "/assets/icons/status/helpNeeded.svg",
    };
    const translatedStatusMap = {
      [t("statusCard.inProgress", "In progress")]:
        "/assets/icons/status/inProgress.svg",
      [t("statusCard.completed", "Completed")]:
        "/assets/icons/status/completed.svg",
      [t("statusCard.helpNeeded", "Help needed")]:
        "/assets/icons/status/helpNeeded.svg",
      [t("statusCard.comments", "Comments")]:
        "/assets/icons/status/comments.svg",
      [t("statusCard.notStarted", "Not started")]:
        "/assets/icons/status/notStarted.svg",
      [t("statusCard.needsRevision", "Needs revision")]:
        "/assets/icons/status/TriangleWarning.svg",
    };
    return (
      statusIconMap[status] ||
      translatedStatusMap[status] ||
      "/assets/icons/status/notStarted.svg"
    );
  };

  const getFeedbackIcon = () => {
    if (cardVariant.variant === "FEEDBACK_SUBMITTED") {
      return "/assets/icons/status/publicTemplatesubmitted.svg";
    }
    if (cardVariant.variant === "FEEDBACK_NON_SUBMITTED") {
      return "/assets/icons/status/publicTemplate.svg";
    }
    return null;
  };

  const isAssociateSelect = selectKind === "associate";

  const handleClick = () => {
    if (cardSelectMode) {
      onToggleCardSelection?.(card.id, sectionId);
      return;
    }
    openCard(card);
  };

  const cardBody = (
    <StyledProposalCard
      variant={cardVariant.variant}
      className={clsx(
        cardSelectMode && isSelected && !isAssociateSelect && "cardSelectSelected",
        isAssociateSelect && isSelected && "cardSelectAssociate"
      )}
      onClick={handleClick}
    >
      <div className="card-drag-handle">
        <div className="card-information">
          <div className="card-left-side">
            {cardSelectMode ? (
              <input
                type="checkbox"
                className="cardSelectCheckbox"
                checked={isSelected}
                readOnly
                tabIndex={-1}
                aria-label={t("inner.selectItem", {}, { default: "Select item" })}
              />
            ) : (
              <>
                {proposalBuildMode && (
                  <img src="/assets/icons/pencil.svg" alt="" />
                )}
                {!proposalBuildMode && !isPreview && (
                  <img src={getStatusIcon()} alt="" />
                )}
              </>
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
            <Tooltip
              content={cardVariant.tooltipText || null}
              disabled={!cardVariant.tooltipText}
            >
              <div
                className={`card-feedback-tag ${
                  cardVariant.variant === "FEEDBACK_SUBMITTED"
                    ? "feedback-submitted"
                    : "feedback-non-submitted"
                }`}
              >
                <img src={getFeedbackIcon()} alt="" />
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    </StyledProposalCard>
  );

  if (cardSelectMode) {
    return <div key={card.id}>{cardBody}</div>;
  }

  return <Draggable key={card.id}>{cardBody}</Draggable>;
}
