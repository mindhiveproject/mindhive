import { useQuery } from "@apollo/client";
import { GET_USERNAMES_OF_CLASS } from "../Queries/User";

import { Dropdown } from "semantic-ui-react";

export default function FindUser({ userClasses, authorId, setAuthorId }) {
  const { data, loading, error } = useQuery(GET_USERNAMES_OF_CLASS, {
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

  const users = data?.profiles?.map((user) => ({
    key: user.username,
    text: user.username,
    value: user.id,
  }));

  return (
    <Dropdown
      placeholder="Type username"
      search
      selection
      options={users || []}
      onChange={(event, data) => {
        setAuthorId(data?.value);
      }}
      value={authorId}
    />
  );
}
