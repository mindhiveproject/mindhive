import ReactHtmlParser from "react-html-parser";
import { Draggable } from "react-smooth-dnd";

import { Image, Popup } from "semantic-ui-react";
import { StyledActionCard } from "../../../../../../styles/StyledProposal";

import Link from "next/link";
import { useRouter } from "next/router";

export default function SubmitCard({
  card,
  proposalBuildMode,
  adminMode,
  openCard,
  onDeleteCard,
  settings,
  boardId,
}) {
  const router = useRouter();

  return (
    <StyledActionCard
      onClick={() => {
        router.push({
          pathname: `/builder/projects`,
          query: {
            selector: boardId,
            card: card?.id,
          },
        });
      }}
      type={card?.type}
    >
      <div className="card-drag-handle">
        <div className="card-information">
          <div className="card-left-side">
            <img src="/assets/icons/status/publicTemplate.svg" />
          </div>
          <div className="card-right-side">
            <div className="card-title">
              <div>Submit for Peer Feedback</div>
              <p>Click to submit for Feedback</p>
            </div>
          </div>
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
    </StyledActionCard>
  );
}
