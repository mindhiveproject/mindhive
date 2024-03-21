import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { Icon } from "semantic-ui-react";

import { DELETE_POST } from "../../../Mutations/Post";
import { GET_JOURNAL } from "../../../Queries/Journal";

export default function DeletePost({ postId, code, index }) {
  const router = useRouter();
  const [deletePost, { loading }] = useMutation(DELETE_POST, {
    variables: { id: postId },
    refetchQueries: [{ query: GET_JOURNAL, variables: { code } }],
  });

  return (
    <div
      style={{ cursor: "pointer", color: "red" }}
      onClick={() => {
        if (confirm("Are you sure you want to delete this post?")) {
          deletePost().catch((err) => {
            alert(err.message);
          });
        }
      }}
    >
      <Icon size="large" name="trash" />
    </div>
  );
}
