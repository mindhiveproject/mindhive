import React, { Component } from "react";
import styled from "styled-components";
import CheckModal from "./Modal";

const StyledItem = styled.div`
  display: grid;
  grid-template-columns: 40px auto;
  height: 88px;
  background: #ffffff;
  border: 1px solid #e6e6e6;
  box-sizing: border-box;
  border-radius: 4px;

  input[type="checkbox"] {
    transform: scale(2);
    cursor: pointer;
  }
  box-shadow: 0px 2px 4px 0px #00000026;
  transition: box-shadow 300ms ease-out;
  :hover {
    box-shadow: 0px 2px 24px 0px #0000001a;
  }
  .checkboxHolder {
    display: grid;
    align-items: center;
    justify-content: end;
  }
  .triggerArea {
    display: grid;
    align-items: center;
    padding: 20px 29px 20px 29px;
    cursor: pointer;
  }
`;

class ChecklistItem extends Component {
  render() {
    const { name, title, description, action } = this.props.item;
    const { isComplete, toggleCheckTo, isSubmitted } = this.props;
    return (
      <StyledItem>
        <div className="checkboxHolder">
          <input
            type="checkbox"
            checked={isComplete}
            onChange={() => toggleCheckTo(name, !isComplete)}
            disabled={isSubmitted}
          />
        </div>

        <CheckModal
          name={name}
          title={title}
          description={description}
          action={action}
          takeAction={this.props.takeAction}
          isComplete={isComplete}
          toggleCheckTo={toggleCheckTo}
          isSubmitted={isSubmitted}
        />
      </StyledItem>
    );
  }
}

export default ChecklistItem;
