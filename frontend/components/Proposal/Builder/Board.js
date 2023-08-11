import React, { useState, useEffect } from "react";
import sortBy from "lodash/sortBy";

import { useMutation } from "@apollo/client";

import Inner from "./Inner";

import {
  CREATE_SECTION,
  UPDATE_SECTION,
  DELETE_SECTION,
} from "../../Mutations/Proposal";

const Board = ({
  proposal,
  openCard,
  proposalBuildMode,
  adminMode,
  isPreview,
}) => {
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
    />
  );
};

export default Board;
