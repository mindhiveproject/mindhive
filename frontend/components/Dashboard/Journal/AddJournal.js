import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import useForm from "../../../lib/useForm";
import JournalForm from "./JournalForm";

import { CREATE_JOURNAL } from "../../Mutations/Journal";
import { GET_MY_JOURNALS } from "../../Queries/Journal";

export default function AddJournal({ user }) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { inputs, handleChange, clearForm } = useForm({
    title: "",
    description: "",
  });

  const [createClass, { data, loading, error }] = useMutation(CREATE_JOURNAL, {
    variables: inputs,
    refetchQueries: [{ query: GET_MY_JOURNALS, variables: { id: user?.id } }],
  });

  async function handleSubmit(e) {
    if (!inputs.title) {
      return alert(t("journal.enterTitle"));
    }
    await createClass({
      variables: {
        code: nanoid(),
      },
    });
    router.push({
      pathname: "/dashboard/journals",
    });
  }

  return (
    <JournalForm
      inputs={inputs}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      submitBtnName={t("journal.createNewJournal")}
      loading={loading}
      error={error}
    />
  );
}
