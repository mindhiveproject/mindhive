import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { Icon } from "semantic-ui-react";
import { DELETE_POST } from "../../../Mutations/Post";
import { GET_JOURNAL } from "../../../Queries/Journal";
import useTranslation from "next-translate/useTranslation";

export default function DeletePost({ postId, code, index }) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [deletePost, { loading }] = useMutation(DELETE_POST, {
    variables: { id: postId },
    refetchQueries: [{ query: GET_JOURNAL, variables: { code } }],
  });
  return (
    <div
      style={{ cursor: "pointer", color: "red" }}
      onClick={() => {
        if (confirm(t("journal.deletePostConfirm"))) {
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
