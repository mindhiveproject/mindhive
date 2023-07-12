import { useQuery } from "@apollo/client";
import { GET_USERNAMES } from "../Queries/User";

import { Dropdown } from "semantic-ui-react";

const DropdownExampleMultipleSelection = ({
  usernames,
  members,
  handleChange,
}) => {
  const onChange = (event, data) => {
    handleChange({
      target: {
        value: data.value,
        name: "members",
        type: "array",
      },
    });
  };

  return (
    <Dropdown
      placeholder="Type username"
      fluid
      multiple
      search
      selection
      options={usernames}
      onChange={onChange}
      value={members}
    />
  );
};

export default function FindMembers({ members, handleChange }) {
  const { data, error, loading } = useQuery(GET_USERNAMES);

  const usernames = data?.profiles?.map((user) => ({
    key: user.username,
    text: user.username,
    value: user.id,
  }));

  return (
    <div>
      <DropdownExampleMultipleSelection
        usernames={usernames || []}
        members={members}
        handleChange={handleChange}
      />
    </div>
  );
}
