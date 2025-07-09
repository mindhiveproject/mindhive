import { useMutation } from "@apollo/client";
import { Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { DELETE_UPDATE } from "../../Mutations/Update";
import { GET_UPDATES } from "../../Queries/Update";

export default function DeleteTag({ id }) {
  const { t } = useTranslation("common");
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
        if (confirm(t("update.deleteConfirm"))) {
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
