import ReactHtmlParser from "react-html-parser";
import { Draggable } from "react-smooth-dnd";

import { Image, Popup } from "semantic-ui-react";
import { StyledProposalCard } from "../../styles/StyledProposal";
import useTranslation from "next-translate/useTranslation";

export default function Card({
  card,
  proposalBuildMode,
  adminMode,
  openCard,
  onDeleteCard,
  settings,
  isPreview,
}) {
  const { t } = useTranslation("builder");
  let status = card?.settings?.status ? card.settings.status : "Not started";

  let statusStyle = null;
  switch (status) {
    default:
      statusStyle = "status-not-started";
      break;
    case "Started":
      statusStyle = "status-started";
      break;
    case "Needs feedback":
      statusStyle = "status-needs-feedback";
      break;
    case "Feedback given":
      statusStyle = "status-feedback-given";
      break;
    case "Completed":
      statusStyle = "status-completed";
      break;
    // in case any cards are still tagged 'Closed' or 'On-Hold'
    case "Closed":
      status = "Started";
      statusStyle = "status-started";
      break;
    case "On-Hold":
      status = "Needs feedback";
      statusStyle = "status-needs-feedback";
  }

  return (
    <Draggable key={card.id}>
      <StyledProposalCard
        onClick={() => {
          openCard(card);
        }}
      >
        <div className="card-drag-handle">
          <div className="card-information">
            <div className="card-left-side">
              {proposalBuildMode && <img src="/assets/icons/pencil.svg" />}

              {!proposalBuildMode && !isPreview && (
                <Popup
                  content={
                    card?.assignedTo.length
                      ? card?.assignedTo.map((user, i) => (
                          <div key={i} className="info-assigned">
                            {t("card.assignedTo", {
                              username: adminMode
                                ? user?.username ||
                                  user?.publicReadableId ||
                                  "John Doe"
                                : user?.username,
                            })}
                          </div>
                        ))
                      : t("card.notAssigned")
                  }
                  trigger={
                    <Image
                      src={`/assets/icons/proposal/${statusStyle}.svg`}
                      avatar
                    />
                  }
                  size="huge"
                />
              )}
            </div>
            <div className="card-right-side">
              <div className="card-title">
                <div>
                  <div>{ReactHtmlParser(card.title)}</div>
                </div>
                {!proposalBuildMode && (
                  <div className="editedByAvatar">
                    {card?.isEditedBy?.username && (
                      <Popup
                        content={t("card.editingBy", {
                          username: card?.isEditedBy?.username,
                        })}
                        trigger={
                          card?.isEditedBy?.image?.image
                            ?.publicUrlTransformed ? (
                            <Image
                              src={
                                card?.isEditedBy?.image?.image
                                  ?.publicUrlTransformed
                              }
                              avatar
                            />
                          ) : (
                            <Image
                              src="/assets/icons/builder/page.svg"
                              avatar
                            />
                          )
                        }
                        size="huge"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            {card?.settings?.includeInReport && (
              <div className="card-public-status-build-mode">
                <img src="/assets/icons/status/publicTemplate.svg" />
              </div>
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
