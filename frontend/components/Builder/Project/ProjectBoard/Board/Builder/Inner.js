import React, { Component } from "react";
import { v1 as uuidv1 } from "uuid";
import Sections from "./Sections";

import { PROPOSAL_QUERY } from "../../../../../Queries/Proposal";

class Inner extends Component {
  state = {
    title: "",
  };

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

  componentDidMount() {
    // things to do after the component mounted
  }

  render() {
    const { board, sections, proposalBuildMode } = this.props;

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
        {!this.props.isPreview && board?.settings?.allowAddingSections && (
          <div>
            <div className="newInput">
              <div>New section</div>
              <input
                type="text"
                id="sectionTitle"
                name="title"
                placeholder=""
                value={this.state.title}
                onChange={this.handleChange}
                required
              />
              <div
                className="addBtn"
                onClick={() => this.createSection(board.id)}
              >
                Add section
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Inner;
