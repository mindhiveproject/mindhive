import ReactHtmlParser from "react-html-parser";
import { Draggable } from "react-smooth-dnd";

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
    case "In progress":
      statusStyle = "inProgress";
      break;
    case "Completed":
      statusStyle = "completed";
      break;
    case "Help needed":
      statusStyle = "helpNeeded";
      break;
    case "Comments":
      statusStyle = "comments";
      break;
    case "Not started":
      statusStyle = "notStarted";
      break;
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
                          {`The card is assigned to ${
                            adminMode
                              ? user?.username ||
                                user?.publicReadableId ||
                                "John Doe"
                              : user?.username
                          }`}
                        </div>
                      ))
                    : "The card is not assigned to anyone"
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
                    "Are you sure you want to delete this card? This action cannot be undone."
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
