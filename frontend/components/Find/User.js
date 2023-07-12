import { useQuery } from "@apollo/client";
import { GET_USERNAMES } from "../Queries/User";

import { Dropdown } from "semantic-ui-react";

export default function FindUser({ authorId, setAuthorId }) {
  const { data, error, loading } = useQuery(GET_USERNAMES);

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
