import React, { useState, useEffect, useRef } from "react";
import ReactHTMLParser from "react-html-parser";
import { useMutation, useApolloClient } from "@apollo/client";
import sortBy from "lodash/sortBy";
import { Container } from "react-smooth-dnd";
import { v1 as uuidv1 } from "uuid";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";

import Card from "./Card";
import ActionCard from "./ActionCard";
import CreateCardModal from "./CreateCardModal";
import Button from "../../DesignSystem/Button";
import IconButton from "../../DesignSystem/IconButton";
import DropdownMenu from "../../DesignSystem/DropdownMenu";
import { MilestoneIcon, ProjectCardIcon } from "../../DesignSystem/Icons";
import { CARD_CATEGORY_ACTION, CARD_CATEGORY_PROPOSAL } from "./cardTypeOptions";

import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import {
  CREATE_TEMPLATE_MILESTONE,
  RESOLVE_MILESTONES_FOR_BOARD,
} from "../../Queries/Milestone";
import { isActionCard } from "../../../lib/milestones";

import {
  CREATE_CARD,
  UPDATE_CARD_POSITION,
} from "../../Mutations/Proposal";

const Section = ({
  board,
  section,
  sections,
  boardId,
  onUpdateSection,
  onCardChange,
  openCard,
  proposalBuildMode,
  adminMode,
  isPreview,
  settings,
  submitStatuses = {},
  autoUpdateStudentBoards,
  propagateToClones,
  onTemplateChangedWithoutPropagation,
  hasClones,
  autoOpenCreateCardAction = false,
  onAddMilestoneModalOpened,
  cardSelectMode = false,
  selectKind = null,
  selectedCardIds = [],
  selectedSectionIds = [],
  associateActiveActionCardId = null,
  onToggleCardSelection,
  onToggleSectionSelection,
}) => {
  const { t } = useTranslation("builder");
  const { cards } = section;
  const numOfCards = cards.length;
  // const sortedCards = sortBy(cards, item => item.position);

  const [createCardModalOpen, setCreateCardModalOpen] = useState(false);
  const [createCardInitialCategory, setCreateCardInitialCategory] = useState("");
  const addMilestoneOpenedRef = useRef(false);

  const openCreateCardModal = (category) => {
    setCreateCardInitialCategory(category);
    setCreateCardModalOpen(true);
  };

  useEffect(() => {
    if (!autoOpenCreateCardAction || addMilestoneOpenedRef.current) return;
    addMilestoneOpenedRef.current = true;
    openCreateCardModal(CARD_CATEGORY_ACTION);
    onAddMilestoneModalOpened?.();
  }, [autoOpenCreateCardAction, onAddMilestoneModalOpened]);
  const [isEditingSectionTitle, setIsEditingSectionTitle] = useState(false);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");

  const client = useApolloClient();
  const [createCard, createCardState] = useMutation(CREATE_CARD);
  const [createTemplateMilestone, createTemplateMilestoneState] = useMutation(
    CREATE_TEMPLATE_MILESTONE
  );
  const [updateCard, updateCardState] = useMutation(UPDATE_CARD_POSITION);

  const isSectionSelected = selectedSectionIds.includes(section.id);
  const isDeleteSelect = cardSelectMode && selectKind !== "associate";

  const handleSectionHeaderClick = () => {
    if (isDeleteSelect) {
      onToggleSectionSelection?.(section.id);
    }
  };

  const onUpdateCard = (payload, sectionId, position, isDiffColumn) => {
    const { id, title, content, isEditedBy, assignedTo, settings } = payload;
    updateCard({
      variables: {
        id,
        sectionId,
        position,
      },
      onCompleted: () => {
        if (autoUpdateStudentBoards && propagateToClones) {
          propagateToClones().catch((e) =>
            console.error("Auto-propagate after card move failed:", e)
          );
        } else if (hasClones && onTemplateChangedWithoutPropagation) {
          onTemplateChangedWithoutPropagation();
        }
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

  const finishAfterCardCreate = async (cardId) => {
    const openCreatedCard = () => {
      if (cardId) {
        openCard({ id: cardId });
      }
    };

    const proposalQuery = await client.query({
      query: PROPOSAL_QUERY,
      variables: { id: boardId },
      fetchPolicy: "network-only",
    });
    const proposal = proposalQuery?.data?.proposalBoard;

    if (proposalBuildMode && proposal?.prototypeFor?.length > 0) {
      if (autoUpdateStudentBoards && propagateToClones) {
        try {
          await propagateToClones();
        } catch (error) {
          console.error("Auto-propagate after card add failed:", error);
        }
        openCreatedCard();
      } else {
        onTemplateChangedWithoutPropagation?.();
        openCreatedCard();
      }
    } else {
      openCreatedCard();
    }
  };

  const addCardMutation = async ({ sectionId, title, type, milestoneId }) => {
    if (!title) {
      return alert(
        t("section.enterNewTitle", {}, { default: "Please enter a title" })
      );
    }

    const publicId = uuidv1();
    const position =
      cards && cards.length > 0
        ? cards[cards.length - 1].position + 16384
        : 16384;

    const newCard = await createCard({
      variables: {
        boardId,
        title,
        sectionId,
        position,
        publicId,
        type,
        milestone: milestoneId ? { connect: { id: milestoneId } } : null,
        settings: { status: "Not started" },
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
        // PROPOSAL_QUERY.sections.cards selects many fields on ProposalCard.
        // We enumerate them here so Apollo's cache write doesn't emit
        // "Missing field" warnings and downstream Card / ActionCard render
        // paths don't crash on `card.milestone.key` etc. during the
        // optimistic window. Nested Milestone fields are given null
        // placeholders; the real values arrive via the mutation response
        // (and via refetchQueries if configured).
        __typename: "Mutation",
        createProposalCard: {
          __typename: "ProposalCard",
          id: uuidv1(),
          boardId,
          publicId,
          title,
          content: null,
          revisedContent: null,
          comment: null,
          type,
          position,
          settings: { status: "Not started" },
          section: {
            __typename: "ProposalSection",
            id: sectionId,
            title: null,
          },
          milestone: milestoneId
            ? {
                __typename: "Milestone",
                id: milestoneId,
                key: null,
                actionCardType: null,
                reviewStage: null,
                statusTarget: null,
                legacyBoardStatusField: null,
                legacyOpenForCommentsField: null,
                logEventName: null,
                formDefinitionKeyPattern: null,
                title: null,
                formDefinition: null,
              }
            : null,
          assignedTo: [],
          isEditedBy: null,
        },
      },
    });

    setCreateCardModalOpen(false);
    await finishAfterCardCreate(newCard?.data?.createProposalCard?.id);
  };

  const createCustomMilestone = async ({
    title,
    description,
    sectionId,
    clonedFromMilestoneId,
    sourceFormDefinitionKey,
    canReviewPermissionNames,
  }) => {
    if (!title) {
      alert(
        t("section.enterNewTitle", {}, { default: "Please enter a title" })
      );
      return null;
    }

    const result = await createTemplateMilestone({
      variables: {
        input: {
          templateBoardId: boardId,
          title,
          description,
          sectionId,
          clonedFromMilestoneId,
          sourceFormDefinitionKey,
          canReviewPermissionNames,
          showInFeedbackCenter: true,
          statusTarget: "board",
        },
      },
      refetchQueries: [
        { query: PROPOSAL_QUERY, variables: { id: boardId } },
        { query: RESOLVE_MILESTONES_FOR_BOARD, variables: { boardId } },
      ],
      awaitRefetchQueries: true,
    });

    // Return the created milestone (including formDefinition.id) so the
    // modal can transition to the embedded form-editor step. The modal
    // stays open; final close + finishAfterCardCreate happens once the
    // user clicks Finish (via onFinishCustomMilestoneEdit below).
    return result?.data?.createTemplateMilestone || null;
  };

  const finishCustomMilestoneEdit = async (milestone) => {
    const actionCardId = milestone?.actionCards?.[0]?.id || null;
    setCreateCardModalOpen(false);
    await finishAfterCardCreate(actionCardId);
  };

  const startSectionTitleEdit = () => {
    setEditingSectionTitle(section.title || "");
    setIsEditingSectionTitle(true);
  };

  const handleSectionTitleSubmit = () => {
    const trimmed = editingSectionTitle.trim();
    if (trimmed && trimmed !== section.title) {
      onUpdateSection({
        variables: {
          id: section.id,
          boardId,
          title: trimmed,
        },
      });
    }
    setIsEditingSectionTitle(false);
  };

  const handleSectionTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSectionTitleSubmit();
    } else if (e.key === "Escape") {
      setEditingSectionTitle(section.title || "");
      setIsEditingSectionTitle(false);
    }
  };

  return (
    <div
      className={clsx(
        "section",
        isDeleteSelect && isSectionSelected && "sectionSelectSelected"
      )}
    >
      <div
        className="column-drag-handle"
        onClick={isDeleteSelect ? handleSectionHeaderClick : undefined}
      >
        <div
          className={clsx("firstLine", isDeleteSelect && "firstLineSelectMode")}
        >
          {isDeleteSelect ? (
            <input
              type="checkbox"
              className="sectionSelectCheckbox"
              checked={isSectionSelected}
              readOnly
              tabIndex={-1}
              aria-label={t(
                "inner.selectSection",
                {},
                { default: "Select section" }
              )}
            />
          ) : null}
          {isEditingSectionTitle && !cardSelectMode ? (
            <input
              className="sectionTitleInput"
              type="text"
              value={editingSectionTitle}
              onChange={(e) => setEditingSectionTitle(e.target.value)}
              onBlur={handleSectionTitleSubmit}
              onKeyDown={handleSectionTitleKeyDown}
              placeholder={t(
                "section.sectionTitlePlaceholder",
                "Enter section title"
              )}
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <>
              <div
                className="sectionTitle"
                onClick={
                  !isPreview && !cardSelectMode ? startSectionTitleEdit : undefined
                }
                style={
                  !isPreview && !cardSelectMode ? { cursor: "pointer" } : undefined
                }
              >
                {ReactHTMLParser(section.title)}
              </div>
              {!isPreview && !cardSelectMode && (
                <IconButton
                  variant="subtle"
                  style={{
                    background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
                  }}
                  ariaLabel={t("section.editTitle", {}, {
                    default: "Edit section title",
                  })}
                  title={t("section.editTitle", {}, {
                    default: "Edit section title",
                  })}
                  onClick={(event) => {
                    event.stopPropagation();
                    startSectionTitleEdit();
                  }}
                  onMouseDown={(event) => event.stopPropagation()}
                  icon={<img src="/assets/icons/pencil.svg" alt="" />}
                />
              )}
            </>
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
            cardSelectMode ||
            ((isPreview || !settings?.allowMovingCards) && !proposalBuildMode)
              ? "undefined"
              : null
          }
        >
          {cards && cards.length ? (
            cards.map((card) => {
              if (isActionCard(card)) {
                return (
                  <ActionCard
                    key={card.id}
                    card={card}
                    sectionId={section.id}
                    boardId={boardId}
                    openCard={openCard}
                    proposalBuildMode={proposalBuildMode}
                    adminMode={adminMode}
                    isPreview={isPreview}
                    settings={settings}
                    submitStatuses={submitStatuses}
                    cardSelectMode={cardSelectMode}
                    selectKind={selectKind}
                    isSelected={selectedCardIds.includes(card.id)}
                    isAssociateActive={associateActiveActionCardId === card.id}
                    onToggleCardSelection={onToggleCardSelection}
                  />
                );
              } else {
                return (
                  <Card
                    key={card.id}
                    card={card}
                    sectionId={section.id}
                    boardId={boardId}
                    openCard={openCard}
                    proposalBuildMode={proposalBuildMode}
                    adminMode={adminMode}
                    isPreview={isPreview}
                    settings={settings}
                    submitStatuses={submitStatuses}
                    cardSelectMode={cardSelectMode}
                    selectKind={selectKind}
                    isSelected={selectedCardIds.includes(card.id)}
                    onToggleCardSelection={onToggleCardSelection}
                  />
                );
              }
            })
          ) : (
            <div></div>
          )}
        </Container>
      </div>
      {!cardSelectMode &&
        (proposalBuildMode || (!isPreview && settings?.allowAddingCards)) && (
        <div className="newInput">
          <DropdownMenu
            ariaLabel={t(
              "section.addCardMenu.ariaLabel",
              {},
              { default: "Add a card or milestone" }
            )}
            renderTrigger={({ onClick, open, ariaLabel }) => (
              <Button
                variant="tonal"
                style={{
                  background: "var(--MH-Theme-Secondary-Dark, #E6E6E6)",
                }}
                leadingIcon={<img src="/assets/icons/plus.svg" alt="" />}
                type="button"
                aria-label={ariaLabel}
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={onClick}
              >
                {t("section.addCard", {}, { default: "Add" })}
              </Button>
            )}
            items={[
              {
                key: "project",
                icon: <ProjectCardIcon width={18} height={18} />,
                label: t(
                  "section.addCardMenu.project",
                  {},
                  { default: "Card" }
                ),
                onClick: () => openCreateCardModal(CARD_CATEGORY_PROPOSAL),
              },
              {
                key: "milestone",
                icon: <MilestoneIcon width={18} height={18} />,
                label: t(
                  "section.addCardMenu.milestone",
                  {},
                  { default: "Milestone" }
                ),
                onClick: () => openCreateCardModal(CARD_CATEGORY_ACTION),
              },
            ]}
          />
        </div>
      )}
      <CreateCardModal
        board={board}
        creating={
          createCardState.loading || createTemplateMilestoneState.loading
        }
        onClose={() => {
          setCreateCardModalOpen(false);
          setCreateCardInitialCategory("");
        }}
        onCreateCard={addCardMutation}
        onCreateCustomMilestone={createCustomMilestone}
        onFinishCustomMilestoneEdit={finishCustomMilestoneEdit}
        open={createCardModalOpen}
        sectionId={section.id}
        sections={sections}
        initialCardCategory={createCardInitialCategory}
      />
    </div>
  );
};

export default Section;
