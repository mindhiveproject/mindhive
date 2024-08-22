import { useMutation } from "@apollo/client";
import { Icon } from "semantic-ui-react";

import { DELETE_JOURNAL } from "../../Mutations/Journal";
import { GET_MY_JOURNALS } from "../../Queries/Journal";

export default function DeleteJournal({ user, journal }) {
  const [deletePost, { loading }] = useMutation(DELETE_JOURNAL, {
    variables: { id: journal?.id },
    refetchQueries: [{ query: GET_MY_JOURNALS, variables: { id: user?.id } }],
  });

  return (
    <div
      style={{ cursor: "pointer", color: "red" }}
      onClick={() => {
        if (journal?.posts.length) {
          return alert("Please delete all notes in your journal first");
        }
        if (confirm("Are you sure you want to delete this journal?")) {
          deletePost().catch((err) => {
            alert(err.message);
          });
        }
      }}
    >
      <Icon name="trash" />
    </div>
  );
}
