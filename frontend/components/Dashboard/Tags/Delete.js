import { useMutation } from "@apollo/client";
import { Icon } from "semantic-ui-react";

import { DELETE_TAG } from "../../Mutations/Tag";
import { GET_TAGS } from "../../Queries/Tag";

export default function DeleteTag({ id }) {
  const [deleteTag, { loading }] = useMutation(DELETE_TAG, {
    variables: { id },
    refetchQueries: [{ query: GET_TAGS }],
  });

  return (
    <div
      style={{ cursor: "pointer", color: "red" }}
      onClick={() => {
        if (confirm("Are you sure you want to delete this tag?")) {
          deleteTag().catch((err) => {
            alert(err.message);
          });
        }
      }}
    >
      <Icon name="trash" />
    </div>
  );
}
