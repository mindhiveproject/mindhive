import React, { useState, useEffect } from "react";
import sortBy from "lodash/sortBy";

import { useMutation, useQuery } from "@apollo/client";

import Inner from "./Inner";

import { PROPOSAL_QUERY } from "../../Queries/Proposal";

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
  settings,
}) => {
  const { loading, error, data } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
    pollInterval: 20000, // get new data every 20 seconds
  });

  const [sections, setSections] = useState([]);
  const [createSection, createSectionState] = useMutation(CREATE_SECTION);
  const [updateSection, updateSectionState] = useMutation(UPDATE_SECTION);
  const [deleteSection, deleteSectionState] = useMutation(DELETE_SECTION);

  useEffect(() => {
    if (data) {
      const newSections = data.proposalBoard.sections;
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
  }, [data]);

  if (loading) return "Loading...";
  if (error) return `Error! ${error.message}`;

  return (
    <Inner
      board={data?.proposalBoard}
      sections={sections}
      onCreateSection={createSection}
      onUpdateSection={updateSection}
      onSetSections={setSections}
      onDeleteSection={deleteSection}
      openCard={openCard}
      proposalBuildMode={proposalBuildMode}
      adminMode={adminMode}
      isPreview={isPreview}
      settings={settings}
    />
  );
};

export default Board;
