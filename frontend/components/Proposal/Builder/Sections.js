import React, { Component } from "react";
import { Container, Draggable } from "react-smooth-dnd";
import sortBy from "lodash/sortBy";

import Section from "./Section";

import { PROPOSAL_QUERY } from "../../Queries/Proposal";

class Sections extends Component {
  calculatePosition = (removedIndex, addedIndex, arr) => {
    let position;
    if (addedIndex === arr.length - 1) {
      position = arr[arr.length - 1].position + 16384;
    } else if (addedIndex === 0) {
      position = arr[0].position / 2;
    } else if (addedIndex < removedIndex) {
      const beforePOS = arr[addedIndex - 1].position;
      const afterPOS = arr[addedIndex].position;
      position = (beforePOS + afterPOS) / 2;
    } else if (addedIndex > removedIndex) {
      const beforePOS = arr[addedIndex + 1].position;
      const afterPOS = arr[addedIndex].position;
      position = (beforePOS + afterPOS) / 2;
    }
    return position;
  };

  onColumnDrop = ({ removedIndex, addedIndex, payload }) => {
    if (
      (this.props.isPreview || !this.props.settings?.allowMovingSections) &&
      !this.props.proposalBuildMode
    ) {
      return;
    }

    if (!payload || removedIndex === null || addedIndex === null) {
      return;
    }

    if (this.props.sections) {
      const updatePOS = this.calculatePosition(
        removedIndex,
        addedIndex,
        this.props.sections
      );
      const newSections = this.props.sections.map((section) => {
        if (section.id === payload.id) {
          return { ...section, position: updatePOS };
        }
        return section;
      });

      const sortedSections = sortBy(newSections, [
        (section) => section.position,
      ]);

      this.props.onSetSections([...sortedSections]);

      this.props.onUpdateSection({
        variables: {
          id: payload.id,
          boardId: this.props.boardId,
          position: updatePOS,
        },
        update: (cache, { data: { updateProposalSection } }) => {
          const data = cache.readQuery({
            query: PROPOSAL_QUERY,
            variables: { id: this.props.boardId },
          });
          if (data) {
            const sections = data.proposalBoard.sections.map((section) => {
              if (section.id === payload.id) {
                const newSection = {
                  ...section,
                  position: updateProposalSection.position,
                };
                return newSection;
              }
              return section;
            });
            cache.writeQuery({
              query: PROPOSAL_QUERY,
              variables: { id: this.props.boardId },
              data: {
                proposalBoard: {
                  ...data?.proposalBoard,
                  sections,
                },
              },
            });
          }
        },
        optimisticResponse: {
          __typename: "Mutation",
          updateProposalSection: {
            __typename: "ProposalSection",
            id: payload.id,
            title: payload.title,
            description: payload.description,
            cards: payload.cards,
            boardId: this.props.boardId,
            position: updatePOS,
          },
        },
      });
    }
  };

  onCardChange = (columnId, newCards) => {
    const newSections = this.props.sections.map((section) => {
      if (section.id === columnId) {
        const updatedSection = { ...section };
        updatedSection.cards = newCards;
        return updatedSection;
      }
      return section;
    });
    this.props.onSetSections([...newSections]);
  };

  render() {
    const { sections, settings } = this.props;
    return (
      <div className="sections">
        <Container
          onDrop={this.onColumnDrop}
          orientation="horizontal"
          onDragStart={() => {}}
          dropPlaceholder={{
            animationDuration: 150,
            showOnTop: true,
            className: "cards-drop-preview",
          }}
          getChildPayload={(index) => sections[index]}
          dragHandleSelector=".column-drag-handle"
          lockAxis={
            (this.props.isPreview || !settings?.allowMovingSections) &&
            !this.props.proposalBuildMode
              ? "undefined"
              : null
          }
        >
          {sections.map((section) => (
            <Draggable key={section.id}>
              <Section
                boardId={this.props.boardId}
                sections={sections}
                section={section}
                onUpdateSection={this.props.onUpdateSection}
                deleteSection={this.props.deleteSection}
                onCardChange={this.onCardChange}
                openCard={this.props.openCard}
                proposalBuildMode={this.props.proposalBuildMode}
                adminMode={this.props.adminMode}
                isPreview={this.props.isPreview}
                settings={settings}
                autoUpdateStudentBoards={this.props.autoUpdateStudentBoards}
                propagateToClones={this.props.propagateToClones}
                onTemplateChangedWithoutPropagation={this.props.onTemplateChangedWithoutPropagation}
                hasClones={this.props.hasClones}
              />
            </Draggable>
          ))}
        </Container>
      </div>
    );
  }
}

export default Sections;
