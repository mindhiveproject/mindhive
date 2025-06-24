import ReactHtmlParser from "react-html-parser";
import { Draggable } from "react-smooth-dnd";
import useTranslation from "next-translate/useTranslation";

import { Image, Popup } from "semantic-ui-react";
import { StyledProposalCard } from "../../../../../styles/StyledProposal";

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

  const isCardLocked = card?.settings?.includeInReviewSteps?.some(
    (step) => submitStatuses[step] === "SUBMITTED"
  );
  const isLocked = sectionSummary?.isLocked || isCardLocked;

  const router = useRouter();
  let status = card?.settings?.status ? card.settings.status : "Not started";
  let statusStyle = null;
  switch (status) {
    default:
      statusStyle = "notStarted";
      break;
    case t("card.status.inProgress", "In progress"):
    case "In progress":
      statusStyle = "inProgress";
      break;
    case t("card.status.completed", "Completed"):
    case "Completed":
      statusStyle = "completed";
      break;
    case t("card.status.helpNeeded", "Help needed"):
    case "Help needed":
      statusStyle = "helpNeeded";
      break;
    case t("card.status.comments", "Comments"):
    case "Comments":
      statusStyle = "comments";
      break;
    case t("card.status.notStarted", "Not started"):
    case "Not started":
      statusStyle = "notStarted";
      break;
    case t("card.status.needsRevision", "Needs revision"):
    case "Needs revision":
      statusStyle = "TriangleWarning";
      break;
  }

  return (
    <Draggable key={card.id}>
      <StyledProposalCard
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
          <div className="card-information">
            <div className="card-left-side">
              <Popup
                content={
                  card?.assignedTo.length
                    ? card?.assignedTo.map((user, i) => (
                        <div key={i} className="info-assigned">
                          {t("card.assignedTo", {
                            username: adminMode
                              ? user?.username ||
                                user?.publicReadableId ||
                                t("card.defaultUser", "John Doe")
                              : user?.username,
                          },
                          adminMode
                            ? `The card is assigned to ${user?.username || user?.publicReadableId || "John Doe"}`
                            : `The card is assigned to ${user?.username}`)}
                        </div>
                      ))
                    : t("card.notAssigned", "The card is not assigned to anyone")
                }
                trigger={
                  <Image
                    src={`/assets/icons/status/${statusStyle}.svg`}
                    avatar
                  />
                }
                size="huge"
              />
            </div>
            <div className="card-right-side">
              <div className="card-title">
                <div>
                  <div>{ReactHtmlParser(card.title)}</div>
                </div>
              </div>
            </div>
            {card?.settings?.includeInReport && (
              <>
                {isLocked ? (
                  <div className="card-public-status-submitted">
                    <img src="/assets/icons/status/publicTemplatesubmitted.svg" />
                  </div>
                ) : (
                  <div className="card-public-status">
                    <img src="/assets/icons/status/publicTemplate.svg" />
                  </div>
                )}
              </>
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
