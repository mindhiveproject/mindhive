import React, { Component } from "react";
import { v1 as uuidv1 } from "uuid";
import Sections from "./Sections";

import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import useTranslation from 'next-translate/useTranslation';

class Inner extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "",
    };
    this.t = null;
  }

  componentDidMount() {
    // things to do after the component mounted
    // Set up translation
    const { t } = useTranslation('builder');
    this.t = t;
  }

  handleChange = (e) => {
    const { name, type, value } = e.target;
    const val = type === "number" ? parseFloat(value) : value;
    this.setState({
      [name]: value,
    });
  };

  createSection = (id) => {
    this.props.onCreateSection({
      variables: {
        boardId: id,
        title: this.state.title,
        position:
          this.props.sections && this.props.sections.length > 0
            ? this.props.sections[this.props.sections.length - 1].position +
              16384
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
          title: this.state.title,
          description: null,
          position:
            this.props.sections && this.props.sections.length > 0
              ? this.props.sections[this.props.sections.length - 1].position +
                16384
              : 16384,
          cards: [],
        },
      },
    });
    this.setState({
      title: "",
    });
  };

  deleteSection = (id) => {
    this.props.onDeleteSection({
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

  render() {
    const { board, sections, proposalBuildMode } = this.props;
    const t = this.t || (() => (key, fallback) => fallback);
    return (
      <div className="inner">
        <div className="scrollable">
          <Sections
            boardId={board?.id}
            sections={sections}
            onSetSections={this.props.onSetSections}
            deleteSection={this.deleteSection}
            onUpdateSection={this.props.onUpdateSection}
            openCard={this.props.openCard}
            proposalBuildMode={proposalBuildMode}
            adminMode={this.props.adminMode}
            isPreview={this.props.isPreview}
            settings={board?.settings}
          />
        </div>
        {(proposalBuildMode ||
          (!this.props.isPreview && board?.settings?.allowAddingSections)) && (
          <div>
            <div className="newInput">
              <div>{t('proposal.newSection', 'New section')}</div>
              <input
                type="text"
                id="sectionTitle"
                name="title"
                placeholder={t('proposal.sectionTitlePlaceholder', '')}
                value={this.state.title}
                onChange={this.handleChange}
                required
              />
              <div
                className="addBtn"
                onClick={() => this.createSection(board.id)}
              >
                {t('proposal.addSection', 'Add section')}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Inner;
