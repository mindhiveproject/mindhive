import { useQuery } from "@apollo/client";
import { GET_USERNAMES_WHERE } from "../Queries/User";

import { Dropdown } from "semantic-ui-react";

export default function Collaborators({
  userClasses,
  collaborators,
  handleChange,
}) {
  const { data, loading, error } = useQuery(GET_USERNAMES_WHERE, {
    variables: {
      input: {
        OR: [
          { permissions: { some: { name: { equals: "ADMIN" } } } }, // get all admins
          { studentIn: { some: { id: { in: userClasses } } } },
          { teacherIn: { some: { id: { in: userClasses } } } },
          { mentorIn: { some: { id: { in: userClasses } } } },
        ],
      },
    },
  });
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
  );
}
