import React, { useState, useEffect, useRef } from "react";
import ReactHTMLParser from "react-html-parser";
import { useMutation } from "@apollo/client";
import sortBy from "lodash/sortBy";
import { Container } from "react-smooth-dnd";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";

import Card from "./Card";
import ActionCard from "./ActionCard";
import Button from "../../DesignSystem/Button";
import IconButton from "../../DesignSystem/IconButton";
import DropdownMenu from "../../DesignSystem/DropdownMenu";
import { MilestoneIcon, ProjectCardIcon } from "../../DesignSystem/Icons";

import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import { isActionCard } from "../../../lib/milestones";

import { UPDATE_CARD_POSITION } from "../../Mutations/Proposal";

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

  const addMilestoneOpenedRef = useRef(false);

  const openCreateProposalCard = () => {
    openCard?.({ createProposalCard: true, sectionId: section.id });
  };

  const openCreateMilestone = () => {
    openCard?.({ createMilestone: true, sectionId: section.id });
  };

  useEffect(() => {
    if (!autoOpenCreateCardAction || addMilestoneOpenedRef.current) return;
    addMilestoneOpenedRef.current = true;
    openCreateMilestone();
    onAddMilestoneModalOpened?.();
  }, [autoOpenCreateCardAction, onAddMilestoneModalOpened]);
  const [isEditingSectionTitle, setIsEditingSectionTitle] = useState(false);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");

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
                variant="subtle"
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
                onClick: () => openCreateProposalCard(),
              },
              {
                key: "milestone",
                icon: <MilestoneIcon width={18} height={18} />,
                label: t(
                  "section.addCardMenu.milestone",
                  {},
                  { default: "Milestone" }
                ),
                onClick: () => openCreateMilestone(),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default Section;
