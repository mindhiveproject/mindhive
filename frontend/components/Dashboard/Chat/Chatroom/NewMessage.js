import { useState } from "react";

import { useMutation } from "@apollo/client";
import { CREATE_NEW_MESSAGE } from "../../../Mutations/Chat";
import { GET_CHAT } from "../../../Queries/Chat";

import Form from "./Form";
import { CREATE_UPDATE } from "../../../Mutations/Update";

export default function NewMessage({
  chat,
  btnName,
  isMain,
  parentMessageId,
  membersIds,
}) {
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState({});

  const [createMessage, { loading }] = useMutation(CREATE_NEW_MESSAGE, {
    variables: {
      input: {
        talk: { connect: { id: chat?.id } },
        parent: parentMessageId ? { connect: { id: parentMessageId } } : null,
        message: message,
        isMain: isMain,
        settings: settings,
      },
    },
    refetchQueries: [{ query: GET_CHAT, variables: { id: chat?.id } }],
  });

  const [sendUpdate, { loading: updateLoading }] = useMutation(CREATE_UPDATE, {
    variables: {
      updateArea: "CHAT",
      link: `/dashboard/chats/${chat?.id}`,
      content: {
        message: `There is a new message in the chat ${chat?.settings?.title}`,
      },
    },
  });

  const sendMessage = async () => {
    createMessage();
    // send updates to all members
    await membersIds.map(async (userId) => {
      const res = await sendUpdate({
        variables: {
          userId,
        },
      });
      console.log({ res });
    });
  };

  return (
    <Form
      btnName={btnName}
      message={message}
      setMessage={setMessage}
      submit={sendMessage}
    >
      <button>{btnName}</button>
    </Form>
  );
}
