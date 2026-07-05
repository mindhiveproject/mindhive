import React, { useState } from "react";
import { v1 as uuidv1 } from "uuid";
import Sections from "./Sections";
import AddSectionModal from "./AddSectionModal";
import Button from "../../DesignSystem/Button";

import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import useTranslation from "next-translate/useTranslation";

function Inner(props) {
  const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
  const { t } = useTranslation("builder");

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

  const deleteSection = (id) => {
    props.onDeleteSection({
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
    });
  };

  const { board, sections, proposalBuildMode } = props;
  const canAddSections =
    proposalBuildMode ||
    (!props.isPreview && board?.settings?.allowAddingSections);

  return (
    <>
      <div className="boardInner">
        {canAddSections && (
          <div className="boardInnerToolbar">
            <Button
              variant="primary"
              size="small"
              onClick={() => setAddSectionModalOpen(true)}
              leadingIcon={<img src="../../assets/icons/add_column.svg" alt="Add section" style={{filter: "invert(1)"}}/>}
            >
             {t("inner.addSection", {}, { default: "Add section" })}
            </Button>
          </div>
        )}
        <div className="scrollable">
          <Sections
            board={board}
            boardId={board?.id}
            sections={sections}
            onSetSections={props.onSetSections}
            deleteSection={deleteSection}
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
          />
        </div>
      </div>
      <AddSectionModal
        open={addSectionModalOpen}
        onClose={() => setAddSectionModalOpen(false)}
        onSubmit={(sectionTitle) => createSection(board.id, sectionTitle)}
      />
    </>
  );
}

export default Inner;
