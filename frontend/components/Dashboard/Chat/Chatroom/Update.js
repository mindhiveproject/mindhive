import { useEffect, useState } from "react";
import Form from "./Form";
import { useMutation } from "@apollo/client";
import { Icon } from "semantic-ui-react";

import { UPDATE_MESSAGE } from "../../../Mutations/Chat";
import { GET_CHAT } from "../../../Queries/Chat";

export default function Update({ chatId, btnName, oldMessage }) {
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState({});

  useEffect(() => {
    setMessage(oldMessage?.message);
    setSettings(oldMessage?.settings);
  }, [oldMessage]); // Only re-run the effect if chat changes

  const [updateMessage, { loading }] = useMutation(UPDATE_MESSAGE, {
    variables: {
      id: oldMessage?.id,
      message: message,
      settings: settings,
    },
    refetchQueries: [{ query: GET_CHAT, variables: { id: chatId } }],
  });

  return (
    <Form
      btnName={btnName}
      message={message}
      setMessage={setMessage}
      submit={updateMessage}
    >
      <div className="editButton">
        <Icon name="edit" />
      </div>
    </Form>
  );
}
