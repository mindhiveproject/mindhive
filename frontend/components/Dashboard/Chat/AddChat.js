import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import useForm from "../../../lib/useForm";
import DisplayError from "../../ErrorMessage";

import { StyledForm } from "../../styles/StyledForm";
import ChatForm from "./ChatForm";

import { CREATE_CHAT } from "../../Mutations/Chat";
import { GET_MY_CHATS } from "../../Queries/Chat";

export default function AddChat({ user }) {
  const router = useRouter();
  const { t } = useTranslation("classes");
  const { inputs, handleChange, clearForm } = useForm({
    title: "",
    members: [],
    classes: [],
    studies: [],
  });

  const [createChat, { data, loading, error }] = useMutation(CREATE_CHAT, {
    refetchQueries: [{ query: GET_MY_CHATS, variables: { id: user?.id } }],
  });

  // To do: remove errors from this way of creating connections with members
  async function handleSubmit(e) {
    e.preventDefault();
    await createChat({
      variables: {
        settings: {
          title: inputs?.title,
        },
        members: inputs?.members.map((m) => ({ id: m })),
        classes: inputs?.classes.map((cl) => ({ id: cl })),
        studies: inputs?.studies.map((st) => ({ id: st })),
      },
    });
    router.push({
      pathname: "/dashboard/chats",
    });
  }

  return (
    <ChatForm
      user={user}
      inputs={inputs}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      submitBtnName={t("common.create")}
      loading={loading}
      error={error}
    />
  );
}
