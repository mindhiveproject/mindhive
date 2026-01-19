import React, { useState } from "react";
import ReactHTMLParser from "react-html-parser";
import { useMutation } from "@apollo/client";
import sortBy from "lodash/sortBy";
import { Container } from "react-smooth-dnd";
import { v1 as uuidv1 } from "uuid";
import useTranslation from "next-translate/useTranslation";

import Card from "./Card";

import { PROPOSAL_QUERY } from "../../../../../Queries/Proposal";

import {
  CREATE_CARD,
  UPDATE_CARD_POSITION,
  DELETE_CARD,
} from "../../../../../Mutations/Proposal";
import ActionCard from "./Actions/ActionCard";

const Section = ({
  section,
  sections,
  boardId,
  onUpdateSection,
  deleteSection,
  onCardChange,
  openCard,
  proposalBuildMode,
  adminMode,
  isPreview,
  settings,
  submitStatuses,
}) => {
  const { t } = useTranslation("builder");
  const { cards } = section;

  const actionCards = cards
    ?.filter(
      (card) =>
        card?.type === "ACTION_SUBMIT" ||
        card?.type === "ACTION_PEER_FEEDBACK" ||
        card?.type === "ACTION_COLLECTING_DATA" ||
        card?.type === "ACTION_PROJECT_REPORT"
    )
    .map((c) => c?.type);
  const submissionStage = (actionCards?.length && actionCards[0]) || undefined;
  const submissionStatus = submitStatuses[submissionStage];

  const [cardName, setCardName] = useState("");
  const [createCard, createCardState] = useMutation(CREATE_CARD);
  const [updateCard, updateCardState] = useMutation(UPDATE_CARD_POSITION);
  const [deleteCard, deleteCardState] = useMutation(DELETE_CARD);

  const sectionSummary = {
    submissionStage,
    submissionStatus,
    isLocked: submissionStatus === "SUBMITTED",
    numOfCards: cards?.length,
    numOfCardsCompleted: cards?.length,
  };

  const onUpdateCard = (payload, sectionId, position, isDiffColumn) => {
    const { id, title, content, isEditedBy, assignedTo, settings } = payload;
    updateCard({
      variables: {
        id,
        sectionId,
        position,
      },
      update: (cache, { data: { updateProposalCard } }) => {
        // Read the data from the cache for this query.
        const data = cache.readQuery({
          query: PROPOSAL_QUERY,
          variables: { id: boardId },
        });
        if (data) {
          let newSections;
          if (isDiffColumn) {
            newSections = data.proposalBoard.sections.map((section) => {
              if (section.id === sectionId) {
                if (!section.cards) {
                  section.cards = [];
                }
                const newSection = {
                  ...section,
                  cards: [...section.cards, updateProposalCard],
                };
                return newSection;
              }
              const newFilteredSection = {
                ...section,
                cards: section.cards.filter((card) => card.id !== id),
              };
              return newFilteredSection;
            });
          } else {
            newSections = data.proposalBoard.sections.map((section) => {
              if (section.id === sectionId) {
                const newCards = section.cards.map((card) => {
                  if (card.id === id) {
                    const newCard = { ...card, ...updateProposalCard };
                    return newCard;
                  }
                  return card;
                });
                const newSection = {
                  ...section,
                  cards: newCards,
                };
                return newSection;
              }
              return section;
            });
          }

          cache.writeQuery({
            query: PROPOSAL_QUERY,
            variables: { id: boardId },
            data: {
              proposalBoard: {
                ...data?.proposalBoard,
                sections: newSections,
              },
            },
          });
        }
      },
      optimisticResponse: {
        __typename: "Mutation",
        updateProposalCard: {
          __typename: "ProposalCard",
          id,
          title,
          content,
          settings,
          isEditedBy,
          assignedTo,
          section: {
            __typename: "ProposalSection",
            id: sectionId,
          },
          position,
        },
      },
    });
  };

  const calculatePosition = (removedIndex, addedIndex, arr) => {
    let position;
    if (addedIndex === arr.length - 1) {
      position = arr[arr.length - 1].position + 16384;
    } else if (addedIndex === 0) {
      position = arr[0].position / 2;
    } else if (addedIndex < removedIndex) {
      const beforePOS = arr[addedIndex - 1].position;
      const afterPOS = arr[addedIndex].position;
      position = (beforePOS + afterPOS) / 2;
    } else if (addedIndex > removedIndex) {
      const beforePOS = arr[addedIndex + 1].position;
      const afterPOS = arr[addedIndex].position;
      position = (beforePOS + afterPOS) / 2;
    }
    return position;
  };

  const onCardDrop = (columnId, addedIndex, removedIndex, payload) => {
    if (isPreview || !settings?.allowMovingCards) {
      return;
    }

    let updatedPOS;
    if (addedIndex !== null && removedIndex !== null) {
      if (addedIndex === removedIndex) {
        return;
      }
      const boardCards = sections.filter((p) => p.id === columnId)[0];

      updatedPOS = calculatePosition(
        removedIndex,
        addedIndex,
        boardCards.cards
      );

      let newCards = cards.map((item) => {
        if (item.id === payload.id) {
          return {
            ...item,
            position: updatedPOS,
          };
        }
        return item;
      });
      newCards = sortBy(newCards, (item) => item.position);

      onCardChange(columnId, newCards);
      onUpdateCard(payload, columnId, updatedPOS, false);
    } else if (removedIndex !== null) {
      const newCards = cards.filter((item) => item.id !== payload.id);
      onCardChange(columnId, newCards);
    } else if (addedIndex !== null) {
      const newColumn = sections.filter((p) => p.id === columnId)[0];
      const columnIndex = sections.indexOf(newColumn);

      if (newColumn.cards.length === 0) {
        updatedPOS = 16384;
      } else if (addedIndex === 0) {
        updatedPOS = newColumn.cards[0].position / 2;
      } else if (addedIndex === newColumn.cards.length) {
        updatedPOS =
          newColumn.cards[newColumn.cards.length - 1].position + 16384;
      } else {
        const afterCardPOS = newColumn.cards[addedIndex].position;
        const beforeCardPOS = newColumn.cards[addedIndex - 1].position;
        updatedPOS = (afterCardPOS + beforeCardPOS) / 2;
      }

      let newCards = cards.concat({ ...payload, position: updatedPOS });

      newCards = sortBy(newCards, (item) => item.position);
      onCardChange(columnId, newCards);
      onUpdateCard(payload, columnId, updatedPOS, true);
    }
  };

  const addCardMutation = async (sectionId, title) => {
    if (!title) {
      return alert("Please enter a title");
    }
    setCardName("");
    const newCard = await createCard({
      variables: {
        boardId,
        title,
        sectionId,
        position:
          cards && cards.length > 0
            ? cards[cards.length - 1].position + 16384
            : 16384,
      },
      update: (cache, { data: { createProposalCard } }) => {
        const data = cache.readQuery({
          query: PROPOSAL_QUERY,
          variables: { id: boardId },
        });
        if (data) {
          const sections = data.proposalBoard.sections.map((section) => {
            if (section.id === sectionId) {
              if (!section.cards) {
                section.cards = [];
              }
              const newSection = {
                ...section,
                cards: [...section.cards, createProposalCard],
              };
              return newSection;
            }
            return section;
          });

          cache.writeQuery({
            query: PROPOSAL_QUERY,
            variables: { id: boardId },
            data: {
              proposalBoard: {
                ...data?.proposalBoard,
                sections,
              },
            },
          });
        }
      },
      optimisticResponse: {
        __typename: "Mutation",
        createProposalCard: {
          __typename: "ProposalCard",
          id: uuidv1(),
          boardId,
          title,
          content: null,
          position:
            cards && cards.length > 0
              ? cards[cards.length - 1].position + 16384
              : 16384,
          section: {
            __typename: "ProposalSection",
            id: sectionId,
          },
          assignedTo: [],
          settings: null,
        },
      },
    });
    // openCard({ id: newCard?.data?.createProposalCard?.id });
  };

  const deleteCardMutation = (id) => {
    deleteCard({
      variables: {
        id,
      },
      update: (cache, payload) => {
        cache.evict({ id: cache.identify(payload.data.deleteProposalCard) });
      },
      optimisticResponse: {
        __typename: "Mutation",
        deleteProposalCard: {
          id,
          __typename: "ProposalCard",
          section: null,
        },
      },
    });
  };

  return (
    <div className="section" id="section">
      <div className="column-drag-handle">
        <div className="firstLine">
          {settings?.allowAddingCards && (
            <img
              src="/assets/icons/proposal/edit.svg"
              onClick={() => {
                const title = prompt(t("section.newTitlePrompt", "Please enter a new title"));
                if (title != null) {
                  onUpdateSection({
                    variables: {
                      id: section.id,
                      boardId,
                      title,
                    },
                  });
                }
              }}
            />
          )}

          <div className="sectionTitle">{ReactHTMLParser(section.title)}</div>
        </div>
        {/* {!isPreview && (
          <div className="infoLine">
            {sectionSummary?.numOfCards} {sectionSummary?.numOfCards == 1 ? t("section.card", "card") : t("section.cards", "cards")}
          </div>
        )} */}
      </div>
      <hr />
      <div>
        <Container
          orientation="vertical"
          groupName="col"
          onDrop={(e) => {
            if (e) {
              onCardDrop(section.id, e.addedIndex, e.removedIndex, e.payload);
            }
          }}
          dragClass="card-ghost"
          dropClass="card-ghost-drop"
          onDragEnter={() => {}}
          getChildPayload={(index) => cards[index]}
          onDragLeave={() => {}}
          dropPlaceholder={{
            animationDuration: 150,
            showOnTop: true,
            className: "drop-preview",
          }}
          dropPlaceholderAnimationDuration={200}
          lockAxis={
            isPreview || !settings?.allowMovingCards ? "undefined" : null
          }
        >
          {cards && cards.length ? (
            cards.map((card) => {
              if (
                card?.type === "ACTION_SUBMIT" ||
                card?.type === "ACTION_PEER_FEEDBACK" ||
                card?.type === "ACTION_COLLECTING_DATA" ||
                card?.type === "ACTION_PROJECT_REPORT"
              ) {
                return (
                  <ActionCard
                    key={card.id}
                    card={card}
                    onDeleteCard={deleteCardMutation}
                    boardId={boardId}
                    openCard={openCard}
                    proposalBuildMode={proposalBuildMode}
                    adminMode={adminMode}
                    isPreview={isPreview}
                    settings={settings}
                    submitStatuses={submitStatuses}
                  />
                );
              } else {
                return (
                  <Card
                    key={card.id}
                    card={card}
                    onDeleteCard={deleteCardMutation}
                    boardId={boardId}
                    openCard={openCard}
                    proposalBuildMode={proposalBuildMode}
                    adminMode={adminMode}
                    isPreview={isPreview}
                    settings={settings}
                    sectionSummary={sectionSummary}
                    submitStatuses={submitStatuses}
                  />
                );
              }
            })
          ) : (
            <div></div>
          )}
        </Container>
      </div>

      {!isPreview && settings?.allowAddingCards && (
        <div className="newInput">
          <div>{t("section.newCard", "New card")}</div>

          <input
            id={`input-${section.id}`}
            type="text"
            name={`input-${section.id}`}
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
          />

          <div
            className="addBtn"
            onClick={() => {
              addCardMutation(section.id, cardName);
            }}
          >
            {t("section.addCard", "Add card")}
          </div>
        </div>
      )}

      {settings?.allowAddingSections && (
        <div className="deleteBtn">
          <img
            src="/assets/icons/proposal/delete.svg"
            onClick={() => {
              if (section?.cards?.length === 0) {
                deleteSection(section.id);
                return;
              }
              if (
                confirm(
                  t(
                    "section.deleteSectionConfirm",
                    "Are you sure you want to delete this proposal section? All cards in this section will be deleted as well. This action cannot be undone."
                  )
                )
              ) {
                deleteSection(section.id);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Section;
