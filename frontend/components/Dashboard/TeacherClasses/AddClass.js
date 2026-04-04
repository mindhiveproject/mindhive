import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import useForm from "../../../lib/useForm";
import ClassForm from "./ClassForm";
import { stripHtml } from "../../Proposal/Card/Forms/utils";

import { CREATE_CLASS } from "../../Mutations/Classes";
import { GET_CLASSES } from "../../Queries/Classes";
import { CURRENT_USER_QUERY } from "../../Queries/User";

const ADD_CLASS_INITIAL_INPUTS = { title: "", description: "" };

/** TipTap often yields `<p></p>` when empty; treat as no description for the API. */
function normalizeClassDescriptionForSubmit(html) {
  if (html == null) return "";
  const s = String(html).trim();
  if (!s) return "";
  if (/<img[\s>]/i.test(s)) return s;
  return stripHtml(s).trim() === "" ? "" : s;
}

export default function AddClass({ user }) {
  const router = useRouter();
  const { t } = useTranslation("classes");
  const [clientError, setClientError] = useState(null);
  const { inputs, handleChange, resetForm } = useForm(ADD_CLASS_INITIAL_INPUTS);

  useEffect(() => {
    resetForm();
    // Intentionally run once on mount so each visit to “add class” starts with empty fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [createClass, { data, loading, error }] = useMutation(CREATE_CLASS, {
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
      {
        query: CURRENT_USER_QUERY,
      },
    ],
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setClientError(null);
    const titlePlain = stripHtml(inputs.title).trim();
    if (!titlePlain) {
      setClientError({
        message: t("classForm.titleRequired", "Please enter a class title."),
      });
      return;
    }
    await createClass({
      variables: {
        code: nanoid(),
        title: titlePlain,
        description: normalizeClassDescriptionForSubmit(inputs.description),
        settings: { assignableToStudents: false },
      },
    });
    router.push({
      pathname: "/dashboard/myclasses",
    });
  }

  return (
    <>
      <h1 style={{ fontSize: "32px", fontWeight: "500", marginBottom: "16px" }}>{t("addClass.addNewClass")}</h1>
      <ClassForm
        user={user}
        inputs={inputs}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        submitBtnName={t("addClass.create")}
        loading={loading}
        error={clientError || error}
      />
    </>
  );
}
