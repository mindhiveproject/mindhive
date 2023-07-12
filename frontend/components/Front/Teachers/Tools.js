import React, { Component } from "react";
import { Menu } from "semantic-ui-react";

import styled from "styled-components";

const StyledTools = styled.div`
  display: grid;

  .toolsMenu {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(6, auto);
    cursor: pointer;

    .toolsMenuTitle {
      padding-bottom: 10px !important;
      display: grid;
      justify-content: center;
      width: auto;
      p {
        font-size: 18px;
      }
    }
    .selectedMenuTitle {
      border-bottom: 4px solid #ffc107 !important;
      p {
        color: #1a1a1a;
      }
    }
  }

  .imageArea {
    display: grid;
    text-align: center;
    min-height: 500px;
    .inner {
      display: grid;
      justify-items: center;
      grid-gap: 3rem;
      .innerText {
        max-width: 1000px;
      }
    }
  }
`;

class Tools extends Component {
  state = {
    tab: this.props.tab || "proposal",
  };

  handleItemClick = (e, { name }) => this.setState({ tab: name });

  sections = [
    { title: "Proposal Board", value: "proposal" },
    { title: "Study Builder", value: "builder" },
    { title: "Peer Review", value: "review" },
    { title: "Collect & Analyze", value: "collect" },
    { title: "Assignments & Messages", value: "assignments" },
    { title: "Classroom Management", value: "classroom" },
  ];

  render() {
    const { tab } = this.state;
    return (
      <StyledTools>
        <Menu text stackable className="toolsMenu">
          {this.sections.map((section) => (
            <Menu.Item
              name={section.value}
              active={tab === section.value}
              onClick={this.handleItemClick}
              className={
                tab === section.value
                  ? "toolsMenuTitle selectedMenuTitle"
                  : "toolsMenuTitle"
              }
            >
              <p>{section.title}</p>
            </Menu.Item>
          ))}
        </Menu>

        <div className="imageArea">
          {this.state.tab === "proposal" && (
            <div className="inner">
              <img src="/assets/teachers/tools/proposal.png" />
              <p className="innerText">
                The <strong>Proposal Board</strong> consists of text-based
                “cards” designed to help students create realistic collaboration
                plans. Students can assign different sections to themselves and
                each other; provide and receive comments from their teachers,
                peers, and scientists; and toggle between ‘draft’ and ‘print’
                views of their proposal. By deconstructing proposals into
                pre-organized tasks, a variety of learners can successfully
                navigate and engage with complex material.
              </p>
            </div>
          )}
          {this.state.tab === "builder" && (
            <div>
              <img src="/assets/teachers/tools/proposal.png" />
            </div>
          )}
          {this.state.tab === "review" && (
            <div>
              <img src="/assets/teachers/tools/proposal.png" />
            </div>
          )}
          {this.state.tab === "collect" && (
            <div>
              <img src="/assets/teachers/tools/proposal.png" />
            </div>
          )}
          {this.state.tab === "assignments" && (
            <div>
              <img src="/assets/teachers/tools/proposal.png" />
            </div>
          )}
          {this.state.tab === "classroom" && (
            <div>
              <img src="/assets/teachers/tools/proposal.png" />
            </div>
          )}
        </div>
      </StyledTools>
    );
  }
}

export default Tools;
