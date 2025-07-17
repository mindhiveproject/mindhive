import { useMutation } from "@apollo/client";
import { Icon } from "semantic-ui-react";
import { DELETE_JOURNAL } from "../../Mutations/Journal";
import { GET_MY_JOURNALS } from "../../Queries/Journal";
import useTranslation from "next-translate/useTranslation";

export default function DeleteJournal({ user, journal }) {
  const { t } = useTranslation("common");
  const [deletePost, { loading }] = useMutation(DELETE_JOURNAL, {
    variables: { id: journal?.id },
    refetchQueries: [{ query: GET_MY_JOURNALS, variables: { id: user?.id } }],
  });
  return (
    <div
      style={{ cursor: "pointer", color: "red" }}
      onClick={() => {
        if (journal?.posts.length) {
          return alert(t("journal.deleteNotesFirst"));
        }
        if (confirm(t("journal.deleteConfirm"))) {
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
