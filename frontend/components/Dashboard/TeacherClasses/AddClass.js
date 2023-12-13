import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import useForm from "../../../lib/useForm";
import DisplayError from "../../ErrorMessage";

import { StyledForm } from "../../styles/StyledForm";
import ClassForm from "./ClassForm";

import { CREATE_CLASS } from "../../Mutations/Classes";
import { GET_CLASSES } from "../../Queries/Classes";

export default function AddClass({ user }) {
  const router = useRouter();
  const { t } = useTranslation("classes");
  const { inputs, handleChange, clearForm } = useForm({
    title: "",
    description: "",
  });

  const [createClass, { data, loading, error }] = useMutation(CREATE_CLASS, {
    variables: inputs,
    refetchQueries: [
      {
        query: GET_CLASSES,
        variables: {
          input: {
            OR: [
              {
                creator: {
                  id: { equals: user?.id },
                },
              },
              {
                mentors: {
                  some: { id: { equals: user?.id } },
                },
              },
            ],
          },
        },
      },
    ],
  });

  async function handleSubmit(e) {
    e.preventDefault();
    await createClass({
      variables: {
        code: nanoid(),
      },
    });
    router.push({
      pathname: "/dashboard/myclasses",
    });
  }

  return (
    <>
      <h1>Add new class</h1>
      <ClassForm
        inputs={inputs}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        submitBtnName={t("common.create")}
        loading={loading}
        error={error}
      />
    </>
  );
}
