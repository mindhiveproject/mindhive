import React, { useState, useEffect, useCallback } from "react";
import sortBy from "lodash/sortBy";

import { useQuery, useMutation } from "@apollo/client";
import { PROPOSAL_QUERY } from "../../Queries/Proposal";

import Inner from "./Inner";
import useTranslation from "next-translate/useTranslation";

import { Message } from "semantic-ui-react";

import {
  CREATE_SECTION,
  UPDATE_SECTION,
  DELETE_SECTION,
} from "../../Mutations/Proposal";

const Board = ({
  proposalId,
  openCard,
  proposalBuildMode,
  adminMode,
  isPreview,
  autoUpdateStudentBoards,
  propagateToClones,
}) => {
  const { t } = useTranslation("builder");
  const { loading, error, data } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
    pollInterval: 20000, // get new data every 20 seconds
  });
  const proposal = data?.proposalBoard || undefined;

  const [sections, setSections] = useState([]);
  const [createSectionMut, createSectionState] = useMutation(CREATE_SECTION);
  const [updateSectionMut, updateSectionState] = useMutation(UPDATE_SECTION);
  const [deleteSectionMut, deleteSectionState] = useMutation(DELETE_SECTION);

  const createSection = useCallback(
    async (opts) => {
      await createSectionMut(opts);
      if (autoUpdateStudentBoards && propagateToClones) {
        try {
          await propagateToClones();
        } catch (e) {
          console.error("Auto-propagate after section create failed:", e);
        }
      }
    },
    [createSectionMut, autoUpdateStudentBoards, propagateToClones]
  );

  const deleteSection = useCallback(
    async (opts) => {
      await deleteSectionMut(opts);
      if (autoUpdateStudentBoards && propagateToClones) {
        try {
          await propagateToClones();
        } catch (e) {
          console.error("Auto-propagate after section delete failed:", e);
        }
      }
    },
    [deleteSectionMut, autoUpdateStudentBoards, propagateToClones]
  );

  const updateSection = useCallback(
    async (opts) => {
      await updateSectionMut(opts);
      if (autoUpdateStudentBoards && propagateToClones) {
        try {
          await propagateToClones();
        } catch (e) {
          console.error("Auto-propagate after section update failed:", e);
        }
      }
    },
    [updateSectionMut, autoUpdateStudentBoards, propagateToClones]
  );

  const [errors, setErrors] = useState([]);

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

  // Check for duplicate action cards only in proposalBuildMode
  const actionTypes = [
    "ACTION_SUBMIT",
    "ACTION_PEER_FEEDBACK",
    "ACTION_COLLECTING_DATA",
    "ACTION_PROJECT_REPORT",
  ];

  useEffect(() => {
    if (proposalBuildMode && proposal?.sections) {
      let allCards = [];
      proposal.sections.forEach((section) => {
        if (section.cards) {
          allCards = allCards.concat(section.cards);
        }
      });

      let counts = {};
      allCards.forEach((card) => {
        if (actionTypes.includes(card.type)) {
          counts[card.type] = (counts[card.type] || 0) + 1;
        }
      });

      let newErrors = [];
      for (let type in counts) {
        if (counts[type] > 1) {
          newErrors.push(
            `There are ${counts[type]} cards of type ${type}. There should not be more than one action card of this type.`
          );
        }
      }
      setErrors(newErrors);
    } else {
      setErrors([]);
    }
  }, [proposal, proposalBuildMode]);

  if (loading) return t("board.loading", "Loading...");
  if (error)
    return t(
      "board.error",
      { message: error.message },
      `Error! ${error.message}`
    );

  return (
    <>
      {proposalBuildMode && errors.length > 0 && (
        <Message error>
          <Message.Header>Error: Duplicate Action Cards</Message.Header>
          <Message.List>
            {errors.map((error, index) => (
              <Message.Item key={index}>{error}</Message.Item>
            ))}
          </Message.List>
        </Message>
      )}
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
        autoUpdateStudentBoards={autoUpdateStudentBoards}
        propagateToClones={propagateToClones}
      />
    </>
  );
};

export default Board;
