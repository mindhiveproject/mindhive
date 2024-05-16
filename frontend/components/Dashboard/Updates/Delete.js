import { useMutation } from "@apollo/client";
import { Icon } from "semantic-ui-react";

import { DELETE_UPDATE } from "../../Mutations/Update";
import { GET_UPDATES } from "../../Queries/Update";

export default function DeleteTag({ id }) {
  const [deleteTag, { loading }] = useMutation(DELETE_UPDATE, {
    variables: { id },
    refetchQueries: [
      { query: GET_UPDATES, variables: { updateArea: "PLATFORM" } },
    ],
  });

  return (
    <div
      style={{ cursor: "pointer", color: "red" }}
      onClick={() => {
        if (confirm("Are you sure you want to delete this update?")) {
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
