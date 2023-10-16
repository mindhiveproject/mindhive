import React, { Component } from "react";
import { Dropdown } from "semantic-ui-react";
import styled from "styled-components";

const StyledDropdown = styled.div`
  input,
  button,
  label,
  icon {
    all: unset;
  }
`;

class Assigned extends Component {
  onChange = (event, data) => {
    this.props.onAssignedToChange(data.value);
  };

  render() {
    return (
      <StyledDropdown>
        <Dropdown
          placeholder="Type username"
          fluid
          multiple
          selection
          options={this.props.users}
          onChange={this.onChange}
          value={this.props.assignedTo?.map((obj) => obj["id"]) || []}
        />
      </StyledDropdown>
    );
  }
}

export default Assigned;
