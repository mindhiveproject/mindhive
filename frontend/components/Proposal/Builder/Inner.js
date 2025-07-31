import React, { useState } from "react";
import { v1 as uuidv1 } from "uuid";
import Sections from "./Sections";

import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import useTranslation from 'next-translate/useTranslation';

function Inner(props) {
  const [title, setTitle] = useState("");
  const { t } = useTranslation('builder');

  const handleChange = (e) => {
    const { name, type, value } = e.target;
    const val = type === "number" ? parseFloat(value) : value;
    setTitle(value);
  };

  const createSection = (id) => {
    props.onCreateSection({
      variables: {
        boardId: id,
        title: title,
        position:
          props.sections && props.sections.length > 0
            ? props.sections[props.sections.length - 1].position + 16384
            : 16384,
      },
      update: (cache, { data: { createProposalSection } }) => {
        const data = cache.readQuery({
          query: PROPOSAL_QUERY,
          variables: { id },
        });
        if (data) {
          cache.writeQuery({
            query: PROPOSAL_QUERY,
            variables: { id },
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
          boardId: id,
          title: title,
          description: null,
          position:
            props.sections && props.sections.length > 0
              ? props.sections[props.sections.length - 1].position + 16384
              : 16384,
          cards: [],
        },
      },
    });
    setTitle("");
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
  return (
    <div className="inner">
      <div className="scrollable">
        <Sections
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
        />
      </div>
      {(proposalBuildMode ||
        (!props.isPreview && board?.settings?.allowAddingSections)) && (
        <div>
          <div className="newInput">
            <div>{t('proposal.newSection', 'New section')}</div>
            <input
              type="text"
              id="sectionTitle"
              name="title"
              placeholder={t('proposal.sectionTitlePlaceholder', '')}
              value={title}
              onChange={handleChange}
              required
            />
            <div
              className="addBtn"
              onClick={() => createSection(board.id)}
            >
              {t('proposal.addSection', 'Add section')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inner;
