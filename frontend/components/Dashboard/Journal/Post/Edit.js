import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { GET_POST } from "../../../Queries/Post";
import { UPDATE_POST } from "../../../Mutations/Post";
import { GET_JOURNAL } from "../../../Queries/Journal";
import Form from "./Form";
import useTranslation from "next-translate/useTranslation";

export default function EditPost({ code, journal, user, postId, index }) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { data, loading } = useQuery(GET_POST, {
    variables: { id: postId },
  });
  const post = data?.post || {};
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  useEffect(() => {
    setTitle(post?.title);
    setContent(post?.content);
  }, [post]);
  const [updatePost, { error }] = useMutation(UPDATE_POST, {
    variables: {
      id: postId,
      title: title,
      content: content,
    },
    refetchQueries: [
      { query: GET_JOURNAL, variables: { code: journal?.code } },
    ],
  });
  async function handleSave(e) {
    e.preventDefault();
    await updatePost();
    setTitle("");
    setContent("");
    router.push({
      pathname: `/dashboard/journals/${code}`,
      query: { index: index || 0 },
    });
  }
  return (
    <Form
      journal={journal}
      user={user}
      content={content}
      setContent={setContent}
      title={title}
      setTitle={setTitle}
      handleSave={handleSave}
      headerTitle={t("journal.editNote")}
    />
  );
}
