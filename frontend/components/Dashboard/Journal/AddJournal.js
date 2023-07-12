import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import useForm from "../../../lib/useForm";
import DisplayError from "../../ErrorMessage";

import { StyledForm } from "../../styles/StyledForm";
import JournalForm from "./JournalForm";

import { CREATE_JOURNAL } from "../../Mutations/Journal";
import { GET_MY_JOURNALS } from "../../Queries/Journal";

export default function AddClass({}) {
  const router = useRouter();
  const { t } = useTranslation("classes");
  const { inputs, handleChange, clearForm } = useForm({
    title: "",
    description: "",
  });

  const [createClass, { data, loading, error }] = useMutation(CREATE_JOURNAL, {
    variables: inputs,
    refetchQueries: [{ query: GET_MY_JOURNALS }],
  });

  async function handleSubmit(e) {
    e.preventDefault();
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
      submitBtnName={t("common.create")}
      loading={loading}
      error={error}
    />
  );
}
