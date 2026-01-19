import { Draggable } from "react-smooth-dnd";

import { StyledActionCard } from "../../styles/StyledProposal";
import { getActionCardVariant } from "../../utils/cardVariants";

import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

export default function ActionCard({
  card,
  proposalBuildMode,
  adminMode,
  openCard,
  onDeleteCard,
  settings,
  boardId,
  submitStatuses = {},
}) {
  const router = useRouter();
  const { t } = useTranslation("builder");

  // Get card variant
  const variant = getActionCardVariant(card?.type, submitStatuses);

  // Choose clipboard icon based on variant
  const clipboardIcon = variant === "ACTION_SUBMITTED" ? (
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.75 10.4166L17.2812 8.93748L10.4167 15.8021L7.71875 13.1146L6.25 14.5833L10.4167 18.75L18.75 10.4166ZM19.7917 4.16665H15.4375C15 2.95831 13.8542 2.08331 12.5 2.08331C11.1458 2.08331 10 2.95831 9.5625 4.16665H5.20833C5.0625 4.16665 4.92708 4.17706 4.79167 4.20831C4.38542 4.29165 4.02083 4.49998 3.73958 4.78123C3.55208 4.96873 3.39583 5.1979 3.29167 5.4479C3.1875 5.68748 3.125 5.95831 3.125 6.24998V20.8333C3.125 21.1146 3.1875 21.3958 3.29167 21.6458C3.39583 21.8958 3.55208 22.1146 3.73958 22.3125C4.02083 22.5937 4.38542 22.8021 4.79167 22.8854C4.92708 22.9062 5.0625 22.9166 5.20833 22.9166H19.7917C20.9375 22.9166 21.875 21.9791 21.875 20.8333V6.24998C21.875 5.10415 20.9375 4.16665 19.7917 4.16665ZM12.5 3.90623C12.9271 3.90623 13.2812 4.2604 13.2812 4.68748C13.2812 5.11456 12.9271 5.46873 12.5 5.46873C12.0729 5.46873 11.7188 5.11456 11.7188 4.68748C11.7188 4.2604 12.0729 3.90623 12.5 3.90623ZM19.7917 20.8333H5.20833V6.24998H19.7917V20.8333Z" fill="#336F8A"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 16H14V18H7V16ZM7 12H17V14H7V12ZM7 8H17V10H7V8ZM19 4H14.82C14.4 2.84 13.3 2 12 2C10.7 2 9.6 2.84 9.18 4H5C4.86 4 4.73 4.01 4.6 4.04C4.21 4.12 3.86 4.32 3.59 4.59C3.41 4.77 3.26 4.99 3.16 5.23C3.06 5.46 3 5.72 3 6V20C3 20.27 3.06 20.54 3.16 20.78C3.26 21.02 3.41 21.23 3.59 21.42C3.86 21.69 4.21 21.89 4.6 21.97C4.73 21.99 4.86 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM12 3.75C12.41 3.75 12.75 4.09 12.75 4.5C12.75 4.91 12.41 5.25 12 5.25C11.59 5.25 11.25 4.91 11.25 4.5C11.25 4.09 11.59 3.75 12 3.75ZM19 20H5V6H19V20Z" fill="#171717"/>
    </svg>
  );

  return (
    <Draggable key={card.id}>
      <StyledActionCard
        variant={variant}
        proposalBuildMode={proposalBuildMode}
        onClick={() => {
          openCard(card);
        }}
      >
        <div className="card-drag-handle">
          <div className="card-information">
            <div className="card-left-section">
              {clipboardIcon}
            </div>
            <div className="card-content">
              <div className="card-title">
                {card?.type === "ACTION_SUBMIT" && (
                  <div>
                    {t(
                      "actionCard.submitForProposalFeedback",
                      "Submit for Proposal Feedback"
                    )}
                  </div>
                )}

                {card?.type === "ACTION_PEER_FEEDBACK" && (
                  <div>
                    {t(
                      "actionCard.submitForPeerFeedback",
                      "Submit for Peer Feedback"
                    )}
                  </div>
                )}

                {card?.type === "ACTION_COLLECTING_DATA" && (
                  <div>
                    {t(
                      "actionCard.submitForDataCollection",
                      "Submit for Data Collection"
                    )}
                  </div>
                )}

                {card?.type === "ACTION_PROJECT_REPORT" && (
                  <div>
                    {t(
                      "actionCard.submitForProjectReport",
                      "Submit for Project Report"
                    )}
                  </div>
                )}
              </div>
              <div className="card-subtitle">
                {variant === "ACTION_SUBMITTED" ? "Submitted" : "Not Submitted"}
              </div>
            </div>
            <div className="card-right-section">
              {clipboardIcon}
            </div>
          </div>
        </div>
        {(proposalBuildMode || settings?.allowAddingCards) && (
          <div className="deleteCardBtn">
            <img
              src="/assets/icons/proposal/delete.svg"
              onClick={(e) => {
                e.stopPropagation();
                if (
                  confirm(
                    t(
                      "actionCard.deleteConfirm",
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
      </StyledActionCard>
    </Draggable>
  );
}
