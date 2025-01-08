import ReactHtmlParser from "react-html-parser";
import { Draggable } from "react-smooth-dnd";

import { Image, Popup } from "semantic-ui-react";
import { StyledProposalCard } from "../../../../../../styles/StyledProposal";

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
      type={card?.type}
    >
      <div className="card-drag-handle">
        {!proposalBuildMode && (
          <div className="card-information">
            <div className="card-left-side">
              {/* <Popup
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
                    src={`/assets/icons/proposal/${statusStyle}.svg`}
                    avatar
                  />
                }
                size="huge"
              /> */}
            </div>
            <div className="card-right-side">
              <div>
                <span>
                  {/* {card?.type.charAt(0).toUpperCase() +
                    card?.type.slice(1).toLowerCase()} */}
                  ---
                </span>
              </div>
              <div className="card-title">
                <div>
                  SUBMIT
                  {/* <div>{ReactHtmlParser(card.title)}</div> */}
                  {/* {status && <div className="status">{status}</div>} */}
                </div>
                <div className="editedByAvatar">
                  {card?.isEditedBy?.username && (
                    <Popup
                      content={`The card is currently being edited by ${card?.isEditedBy?.username}`}
                      trigger={
                        card?.isEditedBy?.image?.image?.publicUrlTransformed ? (
                          <Image
                            src={
                              card?.isEditedBy?.image?.image
                                ?.publicUrlTransformed
                            }
                            avatar
                          />
                        ) : (
                          <Image src="/assets/icons/builder/page.svg" avatar />
                        )
                      }
                      size="huge"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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
  );
}
