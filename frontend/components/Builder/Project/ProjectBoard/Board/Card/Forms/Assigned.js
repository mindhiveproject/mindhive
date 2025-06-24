import React from "react";
import { Dropdown } from "semantic-ui-react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

const StyledDropdown = styled.div`
  input,
  button,
  label,
  icon {
    all: unset;
  }
`;

export default function Assigned(props) {
  const { t } = useTranslation("builder");

  const onChange = (event, data) => {
    props.onAssignedToChange(data.value);
  };

  return (
    <StyledDropdown>
      <Dropdown
        placeholder={t("assigned.typeUsername", "Type username")}
        fluid
        multiple
        selection
        options={props.users}
        onChange={onChange}
        value={props.assignedTo?.map((obj) => obj["id"]) || []}
      />
    </StyledDropdown>
  );
}
