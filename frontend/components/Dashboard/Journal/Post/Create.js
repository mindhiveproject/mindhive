import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { Modal } from "semantic-ui-react";

import Form from "./Form";

import { CREATE_POST } from "../../../Mutations/Post";
import { GET_JOURNAL } from "../../../Queries/Journal";

export default function PostModal({ journal, user, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [createPost, { loading, error }] = useMutation(CREATE_POST, {
    variables: {
      journalId: journal?.id,
      title: title,
      content: content,
    },
    refetchQueries: [
      { query: GET_JOURNAL, variables: { code: journal?.code } },
    ],
  });

  async function handleSave(e) {
    e.preventDefault();
    await createPost();
    setTitle("");
    setContent("");
    setOpen(false);
  }

  return (
    <Modal
      closeIcon
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={children}
    >
      <Form
        journal={journal}
        user={user}
        content={content}
        setContent={setContent}
        title={title}
        setTitle={setTitle}
        handleSave={handleSave}
        headerTitle="Create post"
      />
    </Modal>
  );
}
