import React, { Component } from "react";
import ReactHtmlParser from "react-html-parser";
import { Draggable } from "react-smooth-dnd";

import { 
  Icon, 
} from "semantic-ui-react";

export default function Card({
  card,
  proposalBuildMode,
  adminMode,
  openCard,
  onDeleteCard,
}) {
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
      <div
        className="card"
        onClick={() => {
          openCard(card.id);
        }}
      >
        <div className="card-drag-handle">
          <h4>{ReactHtmlParser(card.title)}</h4>
          {!proposalBuildMode && (
            <div className="card-information">
            
              <div className="info-assigned-container">
                {card?.assignedTo.length
                  ? card?.assignedTo.map((user, i) => (
                      <div key={i} className="info-assigned">
                        {adminMode
                          ? user?.username ||
                            user?.publicReadableId ||
                            "John Doe"
                          : user?.username}
                      </div>
                    ))
                  : ""}
              </div>
              {status && (
                <div className={`info-status ${statusStyle}`}>{status}</div>
              )}

              { card?.isEditedBy?.username && 
                <div className="editedByAvatar">
                  { card?.isEditedBy?.image?.image?.publicUrlTransformed ? (
                    <img src={card?.isEditedBy?.image?.image?.publicUrlTransformed} alt={card?.isEditedBy?.username} />
                      ) : (
                    <div>
                      <Icon name='user' aria-label={card?.isEditedBy?.username} /> 
                    </div>
                  ) }
                </div>
              }

            </div>
          )}
        </div>
      </div>
      {proposalBuildMode && !isPreview && (
        <div
          className="deleteBtn"
          onClick={() => {
            if (
              confirm(
                "Are you sure you want to delete this card? This action cannot be undone."
              )
            ) {
              onDeleteCard(card.id);
            }
          }}
        >
          Delete card
        </div>
      )}
    </Draggable>
  );
}
