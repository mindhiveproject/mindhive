import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { v1 as uuidv1 } from "uuid";
import useTranslation from "next-translate/useTranslation";

import Sections from "./Sections";
import AddSectionModal from "./AddSectionModal";
import BoardColumnScroller from "./BoardColumnScroller";
import DeleteCardsConfirmModal from "./DeleteCardsConfirmModal";
import Button from "../../DesignSystem/Button";
import { TrashIcon } from "../../DesignSystem/Icons";

import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import { DELETE_CARD } from "../../Mutations/Proposal";
import { DELETE_TEMPLATE_MILESTONE } from "../../Mutations/Milestone";
import { RESOLVE_MILESTONES_FOR_BOARD } from "../../Queries/Milestone";
import { isActionCard } from "../../../lib/milestones";

function Inner(props) {
  const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
  const [cardSelectMode, setCardSelectMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { t } = useTranslation("builder");

  const [deleteCardMut] = useMutation(DELETE_CARD);
  const [deleteTemplateMilestoneMut] = useMutation(DELETE_TEMPLATE_MILESTONE);

  const createSection = (boardId, sectionTitle) => {
    const publicId = uuidv1();
    props.onCreateSection({
      variables: {
        boardId,
        title: sectionTitle,
        position:
          props.sections && props.sections.length > 0
            ? props.sections[props.sections.length - 1].position + 16384
            : 16384,
        publicId,
      },
      update: (cache, { data: { createProposalSection } }) => {
        const data = cache.readQuery({
          query: PROPOSAL_QUERY,
          variables: { id: boardId },
        });
        if (data) {
          cache.writeQuery({
            query: PROPOSAL_QUERY,
            variables: { id: boardId },
            data: {
              proposalBoard: {
                ...data?.proposalBoard,
                sections: [
                  ...data?.proposalBoard?.sections,
                  createProposalSection,
                ],
              },
            },
          });
        }
      },
      optimisticResponse: {
        __typename: "Mutation",
        createProposalSection: {
          __typename: "ProposalSection",
          id: uuidv1(),
          boardId,
          title: sectionTitle,
          description: null,
          position:
            props.sections && props.sections.length > 0
              ? props.sections[props.sections.length - 1].position + 16384
              : 16384,
          publicId,
          cards: [],
        },
      },
    });
    setAddSectionModalOpen(false);
  };

  const deleteSection = (id, { skipPropagate = false } = {}) => {
    return props.onDeleteSection(
      {
        variables: {
          id,
        },
        update: (cache, payload) => {
          cache.evict({ id: cache.identify(payload.data.deleteProposalSection) });
        },
        optimisticResponse: {
          __typename: "Mutation",
          deleteProposalSection: {
            id,
            __typename: "ProposalSection",
          },
        },
      },
      { skipPropagate }
    );
  };

  const { board, sections, proposalBuildMode } = props;
  const canAddSections =
    proposalBuildMode ||
    (!props.isPreview && board?.settings?.allowAddingSections);
  const canDeleteCards =
    proposalBuildMode ||
    (!props.isPreview && board?.settings?.allowAddingCards);
  const showToolbar =
    !props.isPreview && (canAddSections || canDeleteCards);

  const allCards = useMemo(
    () =>
      (sections || []).flatMap((section) =>
        (section?.cards || []).map((card) => ({ card, section }))
      ),
    [sections]
  );

  const selectedCards = useMemo(
    () =>
      allCards
        .filter(({ card }) => selectedCardIds.includes(card.id))
        .map(({ card }) => card),
    [allCards, selectedCardIds]
  );

  const cardIdToSectionId = useMemo(() => {
    const map = new Map();
    for (const section of sections || []) {
      for (const card of section?.cards || []) {
        map.set(card.id, section.id);
      }
    }
    return map;
  }, [sections]);

  const cardsOnlyForDeletion = useMemo(
    () =>
      selectedCards.filter(
        (card) => !selectedSectionIds.includes(cardIdToSectionId.get(card.id))
      ),
    [selectedCards, selectedSectionIds, cardIdToSectionId]
  );

  const getSectionCardIds = useCallback(
    (sectionId) => {
      const section = (sections || []).find((item) => item.id === sectionId);
      return (section?.cards || []).map((card) => card.id);
    },
    [sections]
  );

  const hasSelection =
    selectedCardIds.length > 0 || selectedSectionIds.length > 0;

  const exitCardSelectMode = useCallback(() => {
    setCardSelectMode(false);
    setSelectedCardIds([]);
    setSelectedSectionIds([]);
    setConfirmOpen(false);
  }, []);

  useEffect(() => {
    if (!cardSelectMode || confirmOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        exitCardSelectMode();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cardSelectMode, confirmOpen, exitCardSelectMode]);

  const toggleSectionSelection = useCallback(
    (sectionId) => {
      const cardIds = getSectionCardIds(sectionId);
      setSelectedSectionIds((prev) => {
        const isSelected = prev.includes(sectionId);
        if (isSelected) {
          setSelectedCardIds((cardIdsPrev) =>
            cardIdsPrev.filter((id) => !cardIds.includes(id))
          );
          return prev.filter((id) => id !== sectionId);
        }
        setSelectedCardIds((cardIdsPrev) => [
          ...new Set([...cardIdsPrev, ...cardIds]),
        ]);
        return [...prev, sectionId];
      });
    },
    [getSectionCardIds]
  );

  const toggleCardSelection = useCallback((cardId, sectionId) => {
    setSelectedCardIds((prev) => {
      const isSelected = prev.includes(cardId);
      if (isSelected) {
        setSelectedSectionIds((sectionIds) =>
          sectionIds.filter((id) => id !== sectionId)
        );
        return prev.filter((id) => id !== cardId);
      }
      return [...prev, cardId];
    });
  }, []);

  const handleConfirmDelete = async () => {
    if (!hasSelection) return;

    setDeleting(true);
    try {
      const templateMilestoneIds = new Set();
      for (const card of selectedCards) {
        if (
          isActionCard(card) &&
          card?.milestone?.scope === "template" &&
          card?.milestone?.id
        ) {
          templateMilestoneIds.add(card.milestone.id);
        }
      }

      const sectionIdsToDelete = [...selectedSectionIds];
      const cardIdsRemovedBySectionDelete = new Set();
      for (const sectionId of sectionIdsToDelete) {
        getSectionCardIds(sectionId).forEach((id) =>
          cardIdsRemovedBySectionDelete.add(id)
        );
      }

      for (const sectionId of sectionIdsToDelete) {
        await deleteSection(sectionId, { skipPropagate: true });
      }

      const cardIdsToDelete = selectedCardIds.filter(
        (id) => !cardIdsRemovedBySectionDelete.has(id)
      );
      for (const id of cardIdsToDelete) {
        await deleteCardMut({
          variables: { id },
          update: (cache, payload) => {
            cache.evict({
              id: cache.identify(payload.data.deleteProposalCard),
            });
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
      }

      const milestoneRefetch =
        board?.id && templateMilestoneIds.size
          ? [
              {
                query: RESOLVE_MILESTONES_FOR_BOARD,
                variables: { boardId: board.id },
              },
            ]
          : [];

      // Removes template milestones only; linked review forms are kept but
      // become unavailable on this board. See deleteTemplateMilestone.ts and
      // DeleteCardsConfirmModal.js — update both when teachers can reassociate
      // forms to milestones.
      for (const milestoneId of templateMilestoneIds) {
        await deleteTemplateMilestoneMut({
          variables: { id: milestoneId },
          refetchQueries: milestoneRefetch,
        });
      }

      const deletedSectionSet = new Set(sectionIdsToDelete);
      const deletedCardSet = new Set(cardIdsToDelete);
      props.onSetSections(
        sections
          .filter((section) => !deletedSectionSet.has(section.id))
          .map((section) => ({
            ...section,
            cards: (section.cards || []).filter(
              (card) => !deletedCardSet.has(card.id)
            ),
          }))
      );

      if (props.autoUpdateStudentBoards && props.propagateToClones) {
        try {
          await props.propagateToClones();
        } catch (e) {
          console.error("Auto-propagate after bulk delete failed:", e);
        }
      } else if (props.hasClones && props.onTemplateChangedWithoutPropagation) {
        props.onTemplateChangedWithoutPropagation();
      }

      exitCardSelectMode();
    } catch (err) {
      alert(
        err?.message ||
          t("inner.deleteItemsFailed", {}, { default: "Failed to delete items." })
      );
    } finally {
      setDeleting(false);
    }
  };

  const trashIcon = <TrashIcon />;

  return (
    <>
      <div className="boardInner">
        {showToolbar && (
          <div className="boardInnerToolbar">
            {cardSelectMode ? (
              <>
                <Button variant="subtle" onClick={exitCardSelectMode}>
                  {t("inner.cancel", {}, { default: "Cancel" })}
                </Button>
                <Button
                  variant="filled"
                  onClick={() => setConfirmOpen(true)}
                  disabled={!hasSelection}
                  leadingIcon={trashIcon}
                  style={
                    hasSelection
                      ? {
                          background: "#FEECEB",
                          color: "var(--MH-Theme-Danger-Dark, #8F1F14)",
                        }
                      : undefined
                  }
                >
                  {t("inner.deleteItems", {}, { default: "Delete items" })}
                </Button>
              </>
            ) : (
              <>
                {canAddSections && (
                  <Button
                    variant="tonal"
                    style={{
                      background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
                    }}
                    onClick={() => setAddSectionModalOpen(true)}
                    leadingIcon={
                      <img src="../../assets/icons/add_column.svg" alt="" />
                    }
                  >
                    {t("inner.addSection", {}, { default: "Add section" })}
                  </Button>
                )}
                {canDeleteCards && (
                  <Button
                    variant="tonal"
                    style={{
                      background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
                    }}
                    onClick={() => setCardSelectMode(true)}
                    leadingIcon={trashIcon}
                  >
                    {t("inner.deleteItems", {}, { default: "Delete items" })}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
        <BoardColumnScroller>
          <Sections
            board={board}
            boardId={board?.id}
            sections={sections}
            onSetSections={props.onSetSections}
            onUpdateSection={props.onUpdateSection}
            openCard={props.openCard}
            proposalBuildMode={proposalBuildMode}
            adminMode={props.adminMode}
            isPreview={props.isPreview}
            settings={board?.settings}
            autoUpdateStudentBoards={props.autoUpdateStudentBoards}
            propagateToClones={props.propagateToClones}
            onTemplateChangedWithoutPropagation={
              props.onTemplateChangedWithoutPropagation
            }
            hasClones={props.hasClones}
            addMilestoneTargetSectionId={props.addMilestoneTargetSectionId}
            onAddMilestoneModalOpened={props.onAddMilestoneModalOpened}
            cardSelectMode={cardSelectMode}
            selectedCardIds={selectedCardIds}
            selectedSectionIds={selectedSectionIds}
            onToggleCardSelection={toggleCardSelection}
            onToggleSectionSelection={toggleSectionSelection}
          />
        </BoardColumnScroller>
      </div>
      <AddSectionModal
        open={addSectionModalOpen}
        onClose={() => setAddSectionModalOpen(false)}
        onSubmit={(sectionTitle) => createSection(board.id, sectionTitle)}
      />
      <DeleteCardsConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        selectedCards={selectedCards}
        cardsOnlyForDeletion={cardsOnlyForDeletion}
        selectedSectionIds={selectedSectionIds}
        deleting={deleting}
      />
    </>
  );
}

export default Inner;
