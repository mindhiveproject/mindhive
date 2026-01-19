import React, { useState } from "react";
import ReactHTMLParser from "react-html-parser";
import { useMutation, useApolloClient, gql } from "@apollo/client";
import sortBy from "lodash/sortBy";
import { Container } from "react-smooth-dnd";
import { v1 as uuidv1 } from "uuid";
import useTranslation from "next-translate/useTranslation";

import Card from "./Card";
import ActionCard from "./ActionCard";

import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import {
  GET_SECTIONS_BY_BOARD,
  GET_CARDS_BY_SECTION,
} from "../../Queries/Proposal";

import {
  CREATE_CARD,
  UPDATE_CARD_POSITION,
  DELETE_CARD,
} from "../../Mutations/Proposal";

import { Modal, Button } from "semantic-ui-react";

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
  submitStatuses = {},
}) => {
  const { t } = useTranslation("builder");
  const { cards } = section;
  const numOfCards = cards.length;
  // const sortedCards = sortBy(cards, item => item.position);

  const [cardName, setCardName] = useState("");
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [newCardInfo, setNewCardInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const client = useApolloClient();
  const [createCard, createCardState] = useMutation(CREATE_CARD);
  const [updateCard, updateCardState] = useMutation(UPDATE_CARD_POSITION);
  const [deleteCard, deleteCardState] = useMutation(DELETE_CARD);

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
    if ((isPreview || !settings?.allowMovingCards) && !proposalBuildMode) {
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

  const propagateNewCardToClones = async (info, proposal) => {
    const { title, sectionTitle, publicId } = info;
    const clones = proposal.prototypeFor || [];

    for (const clone of clones) {
      let matchingSectionId = null;
      try {
        const { data: sectionsData } = await client.query({
          query: gql`
            query GetSectionsByBoard($boardId: ID!) {
              proposalSections(where: { board: { id: { equals: $boardId } } }) {
                id
                title
              }
            }
          `,
          variables: { boardId: clone.id },
        });

        const sections = sectionsData?.proposalSections || [];
        const matchingSection = sections.find(
          (sec) => sec.title === sectionTitle
        );

        if (matchingSection) {
          matchingSectionId = matchingSection.id;

          const { data: cardsData } = await client.query({
            query: gql`
              query GetCardsBySection($sectionId: ID!) {
                proposalCards(
                  where: { section: { id: { equals: $sectionId } } }
                ) {
                  id
                  title
                  position
                }
              }
            `,
            variables: { sectionId: matchingSectionId },
          });

          const cloneCards = cardsData?.proposalCards || [];
          const sortedCloneCards = sortBy(cloneCards, (card) => card.position);
          const position =
            sortedCloneCards.length > 0
              ? sortedCloneCards[sortedCloneCards.length - 1].position + 16384
              : 16384;

          await createCard({
            variables: {
              boardId: clone.id,
              title,
              sectionId: matchingSectionId,
              position,
              publicId,
            },
          });

          console.log(
            `Added new card to clone ${clone.id} in section ${matchingSectionId}`
          );
        } else {
          console.warn(
            `No matching section found in clone ${clone.id} for title "${sectionTitle}"`
          );
        }
      } catch (error) {
        console.error(`Failed to add card to clone ${clone.id}:`, error);
      }
    }
  };

  const addCardMutation = async (sectionId, title) => {
    if (!title) {
      return alert(t("section.enterNewTitle", "Please enter a title"));
    }
    setCardName("");

    const publicId = uuidv1();

    const newCard = await createCard({
      variables: {
        boardId,
        title,
        sectionId,
        position:
          cards && cards.length > 0
            ? cards[cards.length - 1].position + 16384
            : 16384,
        publicId,
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
          publicId,
        },
      },
    });

    const proposalQuery = await client.query({
      query: PROPOSAL_QUERY,
      variables: { id: boardId },
    });
    const proposal = proposalQuery?.data?.proposalBoard;

    if (proposalBuildMode && proposal?.prototypeFor?.length > 0) {
      setNewCardInfo({
        id: newCard?.data?.createProposalCard?.id,
        publicId: newCard?.data?.createProposalCard?.publicId || publicId,
        title,
        sectionTitle: section?.title,
        cloneCount: proposal?.prototypeFor?.length,
      });
      setShowCloneDialog(true);
    } else {
      openCard({ id: newCard?.data?.createProposalCard?.id });
    }
  };

  const handleCloneYes = async () => {
    setIsLoading(true);
    const proposalQuery = await client.query({
      query: PROPOSAL_QUERY,
      variables: { id: boardId },
    });
    const proposal = proposalQuery?.data?.proposalBoard;
    try {
      await propagateNewCardToClones(newCardInfo, proposal);
    } catch (error) {
      console.error("Failed to propagate new card to clones:", error);
    }
    setIsLoading(false);
    setShowCloneDialog(false);
    openCard({ id: newCardInfo?.id });
  };

  const handleCloneNo = () => {
    setShowCloneDialog(false);
    openCard({ id: newCardInfo?.id });
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
    <div className="section">
      <div className="column-drag-handle">
        <div className="firstLine">
          <div className="sectionTitle">{ReactHTMLParser(section.title)}</div>
          {!isPreview && (
            <img
              src="/assets/icons/proposal/edit.svg"
              onClick={() => {
                const title = prompt(
                  t("section.enterNewTitle", "Please enter a new title")
                );
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
        </div>
        {!isPreview && !proposalBuildMode && (
          <div className="infoLine">
            {t("section.cardsCount", { count: numOfCards })}
          </div>
        )}
      </div>
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
            (isPreview || !settings?.allowMovingCards) && !proposalBuildMode
              ? "undefined"
              : null
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
      {(proposalBuildMode || (!isPreview && settings?.allowAddingCards)) && (
        <div className="newInput">
          <input
            id={`input-${section.id}`}
            type="text"
            name={`input-${section.id}`}
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder={t(
              "section.newCardPlaceholder",
              "Enter a new card title"
            )}
          />
          <div
            className="addBtn"
            onClick={() => {
              addCardMutation(section.id, cardName);
            }}
          >
            {t("section.addCardBtn", "[ Click to add a card ]")}
          </div>
        </div>
      )}
      {(proposalBuildMode || settings?.allowAddingSections) && (
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

      {/* Clone Add Modal */}
      <Modal
        open={showCloneDialog}
        onClose={handleCloneNo}
        size="medium"
        style={{ borderRadius: "12px", overflow: "hidden" }}
      >
        <Modal.Header
          style={{
            background: "#f9fafb",
            borderBottom: "1px solid #e0e0e0",
            fontFamily: "Nunito",
            fontWeight: 600,
          }}
        >
          {t("builderSection.cloneDialog.title", "Add to Cloned Boards?")}
        </Modal.Header>
        <Modal.Content
          style={{ background: "#ffffff", padding: "24px", fontSize: "16px" }}
        >
          <p style={{ marginBottom: "16px", color: "#3b3b3b" }}>
            {t(
              "builderSection.cloneDialog.description",
              "This board has {count} cloned project board(s). Do you want to add this new card to the corresponding sections in all cloned project boards?",
              {
                count: newCardInfo?.cloneCount || 0,
              }
            )}
          </p>
        </Modal.Content>
        <Modal.Actions
          style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}
        >
          <Button
            onClick={handleCloneNo}
            style={{
              borderRadius: "100px",
              background: "white",
              fontSize: "16px",
              color: "#CF6D6A",
              border: "1px solid #CF6D6A",
              marginRight: "10px",
            }}
          >
            {t(
              "builderSection.cloneDialog.noOption",
              "No, add only to this board"
            )}
          </Button>
          <Button
            loading={isLoading || createCardState.loading}
            onClick={handleCloneYes}
            style={{
              borderRadius: "100px",
              background: "#336F8A",
              fontSize: "16px",
              color: "white",
              border: "1px solid #336F8A",
            }}
          >
            {t(
              "builderSection.cloneDialog.yesOption",
              "Yes, add to all clones"
            )}
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
};

export default Section;
