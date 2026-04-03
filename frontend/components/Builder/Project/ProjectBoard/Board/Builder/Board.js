import React, { useState, useEffect, useRef, useCallback } from "react";
import sortBy from "lodash/sortBy";
import useTranslation from "next-translate/useTranslation";

import { useQuery, useMutation } from "@apollo/client";
import { PROPOSAL_QUERY } from "../../../../../Queries/Proposal";
import { UPDATE_CARD_EDIT } from "../../../../../Mutations/Proposal";
import { v1 as uuidv1 } from "uuid";

import Inner from "./Inner";

import {
  CREATE_SECTION,
  UPDATE_SECTION,
  DELETE_SECTION,
} from "../../../../../Mutations/Proposal";
import { isClassTemplateBoard } from "../../../../../Utils/proposalBoard";

const Board = ({
  proposalId,
  openCard,
  proposalBuildMode,
  adminMode,
  isPreview,
  autoUpdateStudentBoards,
  propagateToClones,
  onTemplateChangedWithoutPropagation,
}) => {
  const { t } = useTranslation("builder");
  const { loading, error, data } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
    pollInterval: 20000, // get new data every 20 seconds
  });
  const proposal = data?.proposalBoard || undefined;

  const submitStatuses = {
    ACTION_SUBMIT: proposal?.submitProposalStatus,
    ACTION_PEER_FEEDBACK: proposal?.peerFeedbackStatus,
    ACTION_COLLECTING_DATA: proposal?.study?.dataCollectionStatus,
    ACTION_PROJECT_REPORT: proposal?.projectReportStatus,
  };

  const [sections, setSections] = useState([]);
  const [createSectionMut, createSectionState] = useMutation(CREATE_SECTION);
  const [updateSectionMut, updateSectionState] = useMutation(UPDATE_SECTION);
  const [deleteSectionMut, deleteSectionState] = useMutation(DELETE_SECTION);
  const [updateCardEdit] = useMutation(UPDATE_CARD_EDIT);

  const hasClones = proposal?.prototypeFor?.length > 0;

  const createSection = useCallback(
    async (opts) => {
      await createSectionMut(opts);
      if (autoUpdateStudentBoards && propagateToClones) {
        try {
          await propagateToClones();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Auto-propagate after section create failed:", e);
        }
      } else if (hasClones && onTemplateChangedWithoutPropagation) {
        onTemplateChangedWithoutPropagation();
      }
    },
    [
      createSectionMut,
      autoUpdateStudentBoards,
      propagateToClones,
      hasClones,
      onTemplateChangedWithoutPropagation,
    ]
  );

  const deleteSection = useCallback(
    async (opts) => {
      await deleteSectionMut(opts);
      if (autoUpdateStudentBoards && propagateToClones) {
        try {
          await propagateToClones();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Auto-propagate after section delete failed:", e);
        }
      } else if (hasClones && onTemplateChangedWithoutPropagation) {
        onTemplateChangedWithoutPropagation();
      }
    },
    [
      deleteSectionMut,
      autoUpdateStudentBoards,
      propagateToClones,
      hasClones,
      onTemplateChangedWithoutPropagation,
    ]
  );

  const updateSection = useCallback(
    async (opts) => {
      await updateSectionMut(opts);
      if (autoUpdateStudentBoards && propagateToClones) {
        try {
          await propagateToClones();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Auto-propagate after section update failed:", e);
        }
      } else if (hasClones && onTemplateChangedWithoutPropagation) {
        onTemplateChangedWithoutPropagation();
      }
    },
    [
      updateSectionMut,
      autoUpdateStudentBoards,
      propagateToClones,
      hasClones,
      onTemplateChangedWithoutPropagation,
    ]
  );

  const backfillPublicIdDoneRef = useRef(null);

  useEffect(() => {
    if (proposal) {
      const newSections = proposal.sections;
      const sortedSections = sortBy(newSections, [
        (section) => section.position,
      ]);
      const sortedCardsSections = sortedSections.map((section) => {
        const sortedSection = {
          ...section,
          cards: sortBy(section.cards, (item) => item.position),
        };
        return sortedSection;
      });
      setSections(sortedCardsSections);
    }
  }, [proposal]);

  useEffect(() => {
    if (!proposal?.id || !isClassTemplateBoard(proposal)) return;
    if (backfillPublicIdDoneRef.current === proposal.id) return;

    const templateSections = proposal.sections || [];
    const cardsWithoutPublicId = templateSections
      .flatMap((section) => section?.cards || [])
      .filter((card) => card && !card.publicId);

    if (cardsWithoutPublicId.length === 0) {
      backfillPublicIdDoneRef.current = proposal.id;
      return;
    }

    cardsWithoutPublicId.forEach((card) => {
      updateCardEdit({
        variables: {
          id: card.id,
          input: {
            publicId: uuidv1(),
          },
        },
        refetchQueries: [
          { query: PROPOSAL_QUERY, variables: { id: proposalId } },
        ],
      }).catch((e) => {
        // eslint-disable-next-line no-console
        console.error(
          "Failed to backfill card publicId in ProjectBoard Builder:",
          e
        );
      });
    });

    backfillPublicIdDoneRef.current = proposal.id;
  }, [proposal, proposalId, updateCardEdit]);

  if (loading) return t("board.loading");
  if (error) return t("board.error", { message: error.message });

  return (
    <Inner
      board={proposal}
      sections={sections}
      onCreateSection={createSection}
      onUpdateSection={updateSection}
      onSetSections={setSections}
      onDeleteSection={deleteSection}
      openCard={openCard}
      proposalBuildMode={proposalBuildMode}
      adminMode={adminMode}
      isPreview={isPreview}
      submitStatuses={submitStatuses}
    />
  );
};

export default Board;
