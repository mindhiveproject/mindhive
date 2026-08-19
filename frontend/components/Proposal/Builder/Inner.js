import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { v1 as uuidv1 } from "uuid";
import useTranslation from "next-translate/useTranslation";

import Sections from "./Sections";
import AddSectionModal from "./AddSectionModal";
import BoardColumnScroller from "./BoardColumnScroller";
import DeleteCardsConfirmModal from "./DeleteCardsConfirmModal";
import Button from "../../DesignSystem/Button";
import DropdownSelect from "../../DesignSystem/DropdownSelect";
import { MilestoneIcon, TrashIcon } from "../../DesignSystem/Icons";

import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import { DELETE_CARD, UPDATE_CARD_EDIT } from "../../Mutations/Proposal";
import { DELETE_TEMPLATE_MILESTONE } from "../../Mutations/Milestone";
import { RESOLVE_MILESTONES_FOR_BOARD } from "../../Queries/Milestone";
import {
  actionCardMatchesReviewStep,
  cardIncludedInReviewStep,
  getReviewStepOptions,
  isActionCard,
  parseCardSettings,
  setCardReviewStepMembership,
} from "../../../lib/milestones";
import { useBoardMilestones } from "../../../lib/useBoardMilestones";
import { mergeCardSettings } from "../../Utils/mergeCardSettings";

function Inner(props) {
  const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
  const [boardSelectMode, setBoardSelectMode] = useState("idle");
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [associateMilestoneKey, setAssociateMilestoneKey] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingAssociate, setSavingAssociate] = useState(false);
  const { t } = useTranslation("builder");

  const [deleteCardMut] = useMutation(DELETE_CARD);
  const [deleteTemplateMilestoneMut] = useMutation(DELETE_TEMPLATE_MILESTONE);
  const [updateCardEdit] = useMutation(UPDATE_CARD_EDIT);

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
  const { milestones } = useBoardMilestones(board?.id, { skip: !board?.id });
  const reviewStepOptions = useMemo(
    () => getReviewStepOptions(milestones, t),
    [milestones, t]
  );
  const canAddSections =
    proposalBuildMode ||
    (!props.isPreview && board?.settings?.allowAddingSections);
  const canDeleteCards =
    proposalBuildMode ||
    (!props.isPreview && board?.settings?.allowAddingCards);
  const canAssociateCards = proposalBuildMode && !props.isPreview;
  const showToolbar =
    !props.isPreview &&
    (canAddSections || canDeleteCards || canAssociateCards);
  const cardSelectMode = boardSelectMode !== "idle";
  const selectKind = boardSelectMode === "idle" ? null : boardSelectMode;

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

  const memberCardIdsForStep = useCallback(
    (milestoneKey) => {
      if (!milestoneKey) return [];
      return allCards
        .filter(
          ({ card }) =>
            !isActionCard(card) &&
            cardIncludedInReviewStep(card, milestoneKey, milestones)
        )
        .map(({ card }) => card.id);
    },
    [allCards, milestones]
  );

  const associateActiveActionCardId = useMemo(() => {
    if (boardSelectMode !== "associate" || !associateMilestoneKey) return null;
    const match = allCards.find(({ card }) =>
      actionCardMatchesReviewStep(card, associateMilestoneKey, milestones)
    );
    return match?.card?.id ?? null;
  }, [allCards, associateMilestoneKey, boardSelectMode, milestones]);

  const isAssociateDirty = useMemo(() => {
    if (boardSelectMode !== "associate" || !associateMilestoneKey) return false;
    const baseline = [...memberCardIdsForStep(associateMilestoneKey)].sort();
    const current = [...selectedCardIds].sort();
    if (baseline.length !== current.length) return true;
    return baseline.some((id, index) => id !== current[index]);
  }, [
    associateMilestoneKey,
    boardSelectMode,
    memberCardIdsForStep,
    selectedCardIds,
  ]);

  const exitCardSelectMode = useCallback(() => {
    setBoardSelectMode("idle");
    setSelectedCardIds([]);
    setSelectedSectionIds([]);
    setAssociateMilestoneKey("");
    setConfirmOpen(false);
  }, []);

  const applyAssociateMilestone = useCallback(
    (nextKey) => {
      setAssociateMilestoneKey(nextKey);
      setSelectedCardIds(memberCardIdsForStep(nextKey));
    },
    [memberCardIdsForStep]
  );

  const handleAssociateMilestoneChange = useCallback(
    (nextKey) => {
      if (nextKey === associateMilestoneKey) return;
      if (isAssociateDirty) {
        const confirmed = window.confirm(
          t(
            "inner.associateCardsUnsavedSwitch",
            {},
            {
              default:
                "You have unsaved card changes for this review step. Switch anyway and discard them?",
            }
          )
        );
        if (!confirmed) return;
      }
      applyAssociateMilestone(nextKey);
    },
    [applyAssociateMilestone, associateMilestoneKey, isAssociateDirty, t]
  );

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

  useEffect(() => {
    if (boardSelectMode !== "associate" || !associateActiveActionCardId) {
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => {
      const node = document.querySelector(
        '[data-associate-active-step="true"]'
      );
      node?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [associateActiveActionCardId, boardSelectMode]);

  const toggleSectionSelection = useCallback(
    (sectionId) => {
      if (boardSelectMode !== "delete") return;
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
    [boardSelectMode, getSectionCardIds]
  );

  const toggleCardSelection = useCallback(
    (cardId, sectionId) => {
      if (boardSelectMode === "associate" && !associateMilestoneKey) return;
      setSelectedCardIds((prev) => {
        const isSelected = prev.includes(cardId);
        if (isSelected) {
          if (boardSelectMode === "delete") {
            setSelectedSectionIds((sectionIds) =>
              sectionIds.filter((id) => id !== sectionId)
            );
          }
          return prev.filter((id) => id !== cardId);
        }
        return [...prev, cardId];
      });
    },
    [associateMilestoneKey, boardSelectMode]
  );

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

  const handleSaveAssociate = async () => {
    if (!associateMilestoneKey || boardSelectMode !== "associate") return;

    const option =
      reviewStepOptions.find((item) => item.value === associateMilestoneKey) ||
      { value: associateMilestoneKey, key: associateMilestoneKey };
    const selectedSet = new Set(selectedCardIds);
    const changes = [];

    for (const { card } of allCards) {
      if (isActionCard(card)) continue;
      const wasMember = cardIncludedInReviewStep(
        card,
        associateMilestoneKey,
        milestones
      );
      const isMember = selectedSet.has(card.id);
      if (wasMember === isMember) continue;
      const nextSettings = setCardReviewStepMembership(
        parseCardSettings(card),
        option,
        isMember,
        milestones
      );
      changes.push({
        card,
        nextSettings: mergeCardSettings(parseCardSettings(card), nextSettings),
      });
    }

    setSavingAssociate(true);
    try {
      for (const { card, nextSettings } of changes) {
        await updateCardEdit({
          variables: {
            id: card.id,
            input: { settings: nextSettings },
          },
        });
      }

      if (changes.length) {
        const changeMap = new Map(
          changes.map(({ card, nextSettings }) => [card.id, nextSettings])
        );
        props.onSetSections(
          sections.map((section) => ({
            ...section,
            cards: (section.cards || []).map((card) =>
              changeMap.has(card.id)
                ? { ...card, settings: changeMap.get(card.id) }
                : card
            ),
          }))
        );
      }

      if (props.autoUpdateStudentBoards && props.propagateToClones) {
        try {
          await props.propagateToClones();
        } catch (e) {
          console.error("Auto-propagate after link a milestone to cards failed:", e);
        }
      } else if (props.hasClones && props.onTemplateChangedWithoutPropagation) {
        props.onTemplateChangedWithoutPropagation();
      }

      exitCardSelectMode();
    } catch (err) {
      alert(
        err?.message ||
          t(
            "inner.associateCardsFailed",
            {},
            { default: "Failed to update review step cards." }
          )
      );
    } finally {
      setSavingAssociate(false);
    }
  };

  const trashIcon = <TrashIcon />;
  const milestoneIcon = <MilestoneIcon />;
  const associateDropdownOptions = reviewStepOptions.map((option) => ({
    value: option.value,
    label: option.text,
    labelText: option.text,
  }));

  return (
    <>
      <div className="boardInner">
        {showToolbar && (
          <div className="boardInnerToolbar">
            {boardSelectMode === "delete" ? (
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
            ) : boardSelectMode === "associate" ? (
              <>
                <Button variant="subtle" onClick={exitCardSelectMode}>
                  {t("inner.cancel", {}, { default: "Cancel" })}
                </Button>
                <div className="boardInnerToolbarSelect">
                  <DropdownSelect
                    value={associateMilestoneKey}
                    onChange={handleAssociateMilestoneChange}
                    options={associateDropdownOptions}
                    placeholder={t(
                      "inner.associateCardsPlaceholder",
                      {},
                      { default: "Choose a milestone" }
                    )}
                    ariaLabel={t(
                      "inner.associateCardsPlaceholder",
                      {},
                      { default: "Choose a milestone" }
                    )}
                    disabled={savingAssociate}
                  />
                </div>
                <Button
                  variant="filled"
                  onClick={handleSaveAssociate}
                  disabled={!associateMilestoneKey || savingAssociate || !isAssociateDirty}
                >
                  {savingAssociate
                    ? t("inner.associateCardsSaving", {}, { default: "Saving…" })
                    : t("inner.save", {}, { default: "Save" })}
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
                    onClick={() => setBoardSelectMode("delete")}
                    leadingIcon={trashIcon}
                  >
                    {t("inner.deleteItems", {}, { default: "Delete items" })}
                  </Button>
                )}
                {canAssociateCards && (
                  <Button
                    variant="tonal"
                    style={{
                      background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
                    }}
                    onClick={() => setBoardSelectMode("associate")}
                    leadingIcon={milestoneIcon}
                  >
                    {t("inner.linkMilestoneToCards", {}, { default: "Link a milestone to cards" })}
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
            selectKind={selectKind}
            selectedCardIds={selectedCardIds}
            selectedSectionIds={selectedSectionIds}
            associateActiveActionCardId={associateActiveActionCardId}
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
