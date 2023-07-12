import { useQuery } from "@apollo/client";
import { GET_USERNAMES } from "../Queries/User";

import { Dropdown } from "semantic-ui-react";

export default function Collaborators({ collaborators, handleChange }) {
  const { data, loading, error } = useQuery(GET_USERNAMES);
  const profiles = data?.profiles || [];

  const usernames = profiles.map((user) => ({
    key: user.username,
    text: user.username,
    value: user.id,
  }));

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "collaborators",
        value: data.value.map((id) => ({
          id,
          username: data.options
            .filter((o) => o.value === id)
            .map((o) => o.key)[0],
        })),
      },
    });
  };

  return (
    <div>
      <Dropdown
        placeholder="Type username"
        fluid
        multiple
        search
        selection
        lazyLoad
        options={usernames}
        onChange={onChange}
        value={collaborators}
      />
    </div>
  );
}

// const DropdownExampleMultipleSelection = ({
//   usernames,
//   collaborators,
//   handleChange,
// }) => {

//   return (
//     <Dropdown
//       placeholder="Type username"
//       fluid
//       multiple
//       search
//       selection
//       lazyLoad
//       options={usernames}
//       onChange={onChange}
//       value={collaborators}
//     />
//   );
// };
