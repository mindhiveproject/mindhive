import { useMutation } from "@apollo/client";
import { DELETE_MESSAGE } from "../../../Mutations/Chat";

import { Icon } from "semantic-ui-react";
import { GET_CHAT } from "../../../Queries/Chat";

export default function Delete({ chatId, messageId }) {
  const [deleteMessage, { loading }] = useMutation(DELETE_MESSAGE, {
    variables: { id: messageId },
    refetchQueries: [{ query: GET_CHAT, variables: { id: chatId } }],
  });
  return (
    <div
      className="deleteButton"
      onClick={() => {
        if (confirm("Are you sure you want to delete this message?")) {
          deleteMessage();
        }
      }}
    >
      <Icon name="trash" />
    </div>
  );
}
