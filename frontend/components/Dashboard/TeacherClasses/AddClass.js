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
import { teacherClassesRefetch } from "../../Queries/Classes";
import { CURRENT_USER_QUERY } from "../../Queries/User";

const ADD_CLASS_INITIAL_INPUTS = {
  title: "",
  description: "",
  isDoe: false,
  school: "",
};

// Keep in step with keystone/lib/doe/doe.ts.
const DOE_STAFF_DOMAIN = "@schools.nyc.gov";

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
  // A DOE staff address ticks "NYC public school" for the teacher; they can
  // untick it for a class run elsewhere.
  const { inputs, handleChange, resetForm } = useForm({
    ...ADD_CLASS_INITIAL_INPUTS,
    isDoe: String(user?.email || "")
      .toLowerCase()
      .endsWith(DOE_STAFF_DOMAIN),
  });

  useEffect(() => {
    resetForm();
    // Intentionally run once on mount so each visit to “add class” starts with empty fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [createClass, { data, loading, error }] = useMutation(CREATE_CLASS, {
    refetchQueries: [
      teacherClassesRefetch(user?.id),
      {
        query: CURRENT_USER_QUERY,
      },
    ],
  });

  async function handleSubmit(e, latestInputs = inputs) {
    e.preventDefault();
    setClientError(null);
    const titlePlain = stripHtml(latestInputs.title).trim();
    if (!titlePlain) {
      setClientError({
        message: t(
          "classForm.titleRequired",
          {},
          { default: "Please enter a class title." },
        ),
      });
      return;
    }
    await createClass({
      variables: {
        code: nanoid(),
        title: titlePlain,
        description: normalizeClassDescriptionForSubmit(latestInputs.description),
        settings: { assignableToStudents: false },
        dataOwner: latestInputs.isDoe ? "NYC_DOE" : null,
        school: latestInputs.isDoe
          ? String(latestInputs.school || "").trim().toUpperCase()
          : "",
      },
    });
    router.push({
      pathname: "/dashboard/myclasses",
    });
  }

  return (
    <>
      <h1 className="MH-Type-Heading-Small" style={{ marginBottom: "16px" }}>
        {t("addClass.addNewClass", {}, { default: "Add new class" })}
      </h1>
      <ClassForm
        user={user}
        inputs={inputs}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        submitBtnName={t("addClass.create", {}, { default: "Create" })}
        loading={loading}
        error={clientError || error}
      />
    </>
  );
}
