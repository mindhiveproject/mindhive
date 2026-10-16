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

import { PROPOSAL_BOARD_VIEW_QUERY } from "../../Queries/Proposal";
import {
  CREATE_CARD,
  CREATE_SECTION,
  DELETE_CARD,
  UPDATE_CARD_EDIT,
} from "../../Mutations/Proposal";
import { DELETE_TEMPLATE_MILESTONE } from "../../Mutations/Milestone";
import { RESOLVE_MILESTONES_FOR_BOARD } from "../../Queries/Milestone";
import {
  actionCardMatchesReviewStep,
  cardIncludedInReviewStep,
  getMilestoneFromCard,
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
  // Milestones in the selection, captured when the remove modal opens:
  // deleting a section first can take their cards with it, and the teacher
  // can still choose to delete the milestones afterwards.
  const [removalMilestones, setRemovalMilestones] = useState([]);
  const [savingAssociate, setSavingAssociate] = useState(false);
  const [addingMilestoneKey, setAddingMilestoneKey] = useState("");
  // Milestone just added from the link dropdown: the bar then offers to link
  // cards to it or to edit it. { key, name, card }
  const [addedMilestone, setAddedMilestone] = useState(null);
  const { t } = useTranslation("builder");

  const [deleteCardMut] = useMutation(DELETE_CARD);
  const [deleteTemplateMilestoneMut] = useMutation(DELETE_TEMPLATE_MILESTONE);
  const [updateCardEdit] = useMutation(UPDATE_CARD_EDIT);
  const [createSectionMut] = useMutation(CREATE_SECTION);
  const [createCardMut] = useMutation(CREATE_CARD);

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
          query: PROPOSAL_BOARD_VIEW_QUERY,
          variables: { id: boardId },
        });
        if (data) {
          cache.writeQuery({
            query: PROPOSAL_BOARD_VIEW_QUERY,
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
    setAddedMilestone(null);
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

  // Opened from a milestone editor's "Link more cards": start the link flow
  // with that milestone already picked.
  const { initialAssociateMilestoneKey, onInitialAssociateHandled } = props;
  useEffect(() => {
    if (!initialAssociateMilestoneKey || !canAssociateCards) return;
    // Wait for the board's cards so the milestone's linked cards come pre-ticked.
    if (!allCards.length) return;
    const known = reviewStepOptions.some(
      (option) => option.value === initialAssociateMilestoneKey
    );
    if (!known) return;
    setBoardSelectMode("associate");
    applyAssociateMilestone(initialAssociateMilestoneKey);
    onInitialAssociateHandled?.();
  }, [
    initialAssociateMilestoneKey,
    canAssociateCards,
    allCards,
    reviewStepOptions,
    applyAssociateMilestone,
    onInitialAssociateHandled,
  ]);

  const handleAssociateMilestoneChange = useCallback(
    (nextKey) => {
      setAddedMilestone(null);
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

  // Deletes sections and cards, optionally unlinking the remaining cards from
  // milestones and deleting template milestones, then syncs student boards.
  const deleteBoardItems = async ({
    sectionIds = [],
    cardIds = [],
    unlinkMilestoneKeys = [],
    templateMilestoneIds = [],
  }) => {
    const cardIdsInSections = new Set(sectionIds.flatMap(getSectionCardIds));
    const cardIdsToDelete = cardIds.filter((id) => !cardIdsInSections.has(id));
    const deletedCardSet = new Set([...cardIdsInSections, ...cardIdsToDelete]);

    // Unlink before deleting, while the milestones still resolve.
    const unlinkedSettings = new Map();
    if (unlinkMilestoneKeys.length) {
      for (const { card } of allCards) {
        if (isActionCard(card) || deletedCardSet.has(card.id)) continue;
        const keys = unlinkMilestoneKeys.filter((key) =>
          cardIncludedInReviewStep(card, key, milestones)
        );
        if (!keys.length) continue;
        const settings = parseCardSettings(card);
        const nextSettings = keys.reduce(
          (acc, key) => setCardReviewStepMembership(acc, key, false, milestones),
          settings
        );
        const merged = mergeCardSettings(settings, nextSettings);
        await updateCardEdit({
          variables: { id: card.id, input: { settings: merged } },
        });
        unlinkedSettings.set(card.id, merged);
      }
    }

    for (const sectionId of sectionIds) {
      await deleteSection(sectionId, { skipPropagate: true });
    }

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

    // Removes template milestones only; linked review forms are kept but
    // become unavailable on this board. See deleteTemplateMilestone.ts and
    // DeleteCardsConfirmModal.js — update both when teachers can reassociate
    // forms to milestones.
    for (const milestoneId of templateMilestoneIds) {
      await deleteTemplateMilestoneMut({
        variables: { id: milestoneId },
        refetchQueries: [
          {
            query: RESOLVE_MILESTONES_FOR_BOARD,
            variables: { boardId: board.id },
          },
        ],
      });
    }

    const deletedSectionSet = new Set(sectionIds);
    props.onSetSections(
      sections
        .filter((section) => !deletedSectionSet.has(section.id))
        .map((section) => ({
          ...section,
          cards: (section.cards || [])
            .filter((card) => !deletedCardSet.has(card.id))
            .map((card) =>
              unlinkedSettings.has(card.id)
                ? { ...card, settings: unlinkedSettings.get(card.id) }
                : card
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

    return deletedCardSet;
  };

  // Each part of the remove modal runs on its own; true when it succeeded.
  const runRemoval = async (work) => {
    setDeleting(true);
    try {
      await work();
      return true;
    } catch (err) {
      alert(
        err?.message ||
          t("inner.deleteItemsFailed", {}, { default: "Failed to delete items." })
      );
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const openRemoveModal = () => {
    const inSelectedSections = new Set(
      selectedSectionIds.flatMap(getSectionCardIds)
    );
    setRemovalMilestones(
      selectedCards
        .filter((card) => isActionCard(card))
        .map((card) => {
          const milestone = getMilestoneFromCard(card, milestones);
          const option = reviewStepOptions.find((item) =>
            item.milestoneId
              ? item.milestoneId === milestone?.id
              : item.value === milestone?.key
          );
          return {
            cardId: card.id,
            milestone,
            name: option?.text || milestone?.title || card.title,
            inSelectedSection: inSelectedSections.has(card.id),
          };
        })
    );
    setConfirmOpen(true);
  };

  const handleDeleteSelectedItems = () =>
    runRemoval(async () => {
      const cardIds = cardsOnlyForDeletion
        .filter((card) => !isActionCard(card))
        .map((card) => card.id);
      // Milestone cards inside deleted sections go with them; unlink their
      // milestones now so no card keeps a label for a milestone off the board.
      const deleted = await deleteBoardItems({
        sectionIds: [...selectedSectionIds],
        cardIds,
        unlinkMilestoneKeys: [
          ...new Set(
            removalMilestones
              .filter((item) => item.inSelectedSection)
              .map((item) => item.milestone?.key)
              .filter(Boolean)
          ),
        ],
      });
      setSelectedSectionIds([]);
      setSelectedCardIds((prev) => prev.filter((id) => !deleted.has(id)));
    });

  // Both choices remove the milestone cards and unlink every remaining card
  // from those milestones. deleteMilestones: false keeps the milestones
  // available to add back from the link dropdown; true also deletes custom
  // (template) ones.
  const handleResolveMilestones = (deleteMilestones) =>
    runRemoval(async () => {
      const existingCardIds = new Set(allCards.map(({ card }) => card.id));
      const milestoneCardIds = removalMilestones.map((item) => item.cardId);
      const removalMilestoneList = removalMilestones
        .map((item) => item.milestone)
        .filter(Boolean);
      await deleteBoardItems({
        cardIds: milestoneCardIds.filter((id) => existingCardIds.has(id)),
        unlinkMilestoneKeys: [
          ...new Set(removalMilestoneList.map((m) => m.key).filter(Boolean)),
        ],
        templateMilestoneIds: deleteMilestones
          ? [
              ...new Set(
                removalMilestoneList
                  .filter((m) => m.scope === "template" && m.id)
                  .map((m) => m.id)
              ),
            ]
          : [],
      });
      setSelectedCardIds((prev) =>
        prev.filter((id) => !milestoneCardIds.includes(id))
      );
    });

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
  // Save a milestone's action card at the bottom of the board's last section
  // (creating "Column 1" on an empty board); the bar then asks whether to
  // link cards to it or edit it.
  const handleAddMilestoneToBoard = async (option) => {
    const milestone = milestones.find((m) => m.id === option.milestoneId);
    if (!milestone || !board?.id || addingMilestoneKey) return;

    setAddedMilestone(null);
    setAddingMilestoneKey(option.value);
    try {
      let lastSection = sections?.[sections.length - 1];
      if (!lastSection) {
        const result = await createSectionMut({
          variables: {
            boardId: board.id,
            title: t("inner.firstSectionTitle", {}, { default: "Column 1" }),
            position: 16384,
            publicId: uuidv1(),
          },
        });
        lastSection = { ...result?.data?.createProposalSection, cards: [] };
      }

      const lastCards = lastSection.cards || [];
      const created = await createCardMut({
        variables: {
          title: milestone.title || option.text,
          sectionId: lastSection.id,
          position: lastCards.length
            ? lastCards[lastCards.length - 1].position + 16384
            : 16384,
          publicId: uuidv1(),
          type: milestone.actionCardType || "ACTION",
          milestone: { connect: { id: milestone.id } },
          settings: { status: "Not started" },
        },
        refetchQueries: [
          { query: PROPOSAL_BOARD_VIEW_QUERY, variables: { id: board.id } },
          {
            query: RESOLVE_MILESTONES_FOR_BOARD,
            variables: { boardId: board.id },
          },
        ],
        awaitRefetchQueries: true,
      });

      if (props.autoUpdateStudentBoards && props.propagateToClones) {
        try {
          await props.propagateToClones();
        } catch (e) {
          console.error("Auto-propagate after adding a milestone failed:", e);
        }
      } else if (props.hasClones && props.onTemplateChangedWithoutPropagation) {
        props.onTemplateChangedWithoutPropagation();
      }

      setAddedMilestone({
        key: option.value,
        name: option.text,
        card: created?.data?.createProposalCard,
      });
    } catch (err) {
      alert(
        err?.message ||
          t(
            "inner.addMilestoneToBoardFailed",
            {},
            { default: "Failed to add the milestone to the board." }
          )
      );
    } finally {
      setAddingMilestoneKey("");
    }
  };

  const handleEditAddedMilestone = () => {
    if (!addedMilestone?.card) return;
    if (
      isAssociateDirty &&
      !window.confirm(
        t(
          "inner.associateCardsUnsavedLeave",
          {},
          {
            default:
              "You have unsaved card changes for this review step. Leave anyway and discard them?",
          }
        )
      )
    ) {
      return;
    }
    const { card } = addedMilestone;
    exitCardSelectMode();
    props.openCard?.(card);
  };

  // Order milestones as the teacher reads the board: by their action card,
  // section by section, top to bottom. Milestones without an action card on
  // the board come last, keeping their order, with a button to add one.
  const firstActionCardIndex = (option) => {
    const index = allCards.findIndex(({ card }) => {
      if (!isActionCard(card)) return false;
      const milestone = getMilestoneFromCard(card, milestones);
      return option.milestoneId
        ? milestone?.id === option.milestoneId
        : milestone?.key === option.value;
    });
    return index === -1 ? Infinity : index;
  };
  const notOnBoardGroup = t(
    "inner.milestonesNotOnBoard",
    {},
    { default: "Not on the board" }
  );
  const associateDropdownOptions = reviewStepOptions
    .map((option, order) => ({
      option,
      order,
      index: firstActionCardIndex(option),
    }))
    .sort((a, b) => a.index - b.index || a.order - b.order)
    .map(({ option, index }) => {
      const entry = {
        value: option.value,
        label: option.text,
        labelText: option.text,
      };
      if (index !== Infinity || !option.milestoneId) return entry;
      return {
        ...entry,
        group: notOnBoardGroup,
        action: {
          label:
            addingMilestoneKey === option.value
              ? t("inner.addingMilestoneToBoard", {}, { default: "Adding…" })
              : t("inner.addMilestoneToBoard", {}, { default: "Add to board" }),
          ariaLabel: t(
            "inner.addMilestoneToBoardAria",
            { title: option.text },
            { default: "Add {{title}} to the board" }
          ),
          disabled: !!addingMilestoneKey,
          onClick: () => handleAddMilestoneToBoard(option),
        },
      };
    });

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
                  onClick={openRemoveModal}
                  disabled={!hasSelection}
                  leadingIcon={trashIcon}
                  style={
                    hasSelection
                      ? {
                          background: "#FEECEB",
                          color: "var(--MH-Theme-Danger-Dark, #8f1f14)",
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
                    disabled={savingAssociate || !!addingMilestoneKey}
                  />
                </div>
                {addedMilestone && (
                  <>
                    <span className="boardInnerToolbarNote MH-Type-Body-Base">
                      {t(
                        "inner.milestoneAddedToBoard",
                        { title: addedMilestone.name },
                        { default: "{{title}} added to the board." }
                      )}
                    </span>
                    <Button
                      variant="filled"
                      onClick={() =>
                        handleAssociateMilestoneChange(addedMilestone.key)
                      }
                    >
                      {t("inner.linkCardsToAddedMilestone", {}, { default: "Link cards" })}
                    </Button>
                    <Button variant="outline" onClick={handleEditAddedMilestone}>
                      {t("inner.editAddedMilestone", {}, { default: "Edit milestone" })}
                    </Button>
                  </>
                )}
                {/* While the added-milestone choice shows, Save only appears
                    if there are ticks to save. */}
                {(!addedMilestone || isAssociateDirty) && (
                  <Button
                    variant="filled"
                    onClick={handleSaveAssociate}
                    disabled={!associateMilestoneKey || savingAssociate || !isAssociateDirty}
                  >
                    {savingAssociate
                      ? t("inner.associateCardsSaving", {}, { default: "Saving…" })
                      : t("inner.save", {}, { default: "Save" })}
                  </Button>
                )}
              </>
            ) : (
              <>
                {canAddSections && (
                  <Button
                    variant="subtle"
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
                    variant="subtle"
                    onClick={() => setBoardSelectMode("delete")}
                    leadingIcon={trashIcon}
                  >
                    {t("inner.deleteItems", {}, { default: "Delete items" })}
                  </Button>
                )}
                {canAssociateCards && (
                  <Button
                    variant="subtle"
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
        onFinished={exitCardSelectMode}
        sectionCount={selectedSectionIds.length}
        cardCount={
          cardsOnlyForDeletion.filter((card) => !isActionCard(card)).length
        }
        milestones={removalMilestones}
        onDeleteItems={handleDeleteSelectedItems}
        onResolveMilestones={handleResolveMilestones}
        deleting={deleting}
      />
    </>
  );
}

export default Inner;
