import React, { useState, useEffect } from "react";
import sortBy from "lodash/sortBy";
import useTranslation from "next-translate/useTranslation";

import { useQuery, useMutation } from "@apollo/client";
import { PROPOSAL_QUERY } from "../../../../../Queries/Proposal";

import Inner from "./Inner";

import {
  CREATE_SECTION,
  UPDATE_SECTION,
  DELETE_SECTION,
} from "../../../../../Mutations/Proposal";

const Board = ({
  proposalId,
  openCard,
  proposalBuildMode,
  adminMode,
  isPreview,
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
  const [createSection, createSectionState] = useMutation(CREATE_SECTION);
  const [updateSection, updateSectionState] = useMutation(UPDATE_SECTION);
  const [deleteSection, deleteSectionState] = useMutation(DELETE_SECTION);

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
