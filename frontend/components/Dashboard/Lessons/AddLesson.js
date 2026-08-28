import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import useForm from "../../../lib/useForm";
import DisplayError from "../../ErrorMessage";

import LessonForm from "./LessonForm";
import Button from "../../DesignSystem/Button";

import { CREATE_LESSON } from "../../Mutations/Lesson";
import { GET_MY_LESSONS } from "../../Queries/Lesson";

export default function AddLesson({ user }) {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const { inputs, handleChange, clearForm } = useForm({
    title: "",
    description: "",
    content: "",
  });

  const [createLesson, { data, loading, error }] = useMutation(CREATE_LESSON, {
    variables: inputs,
    refetchQueries: [{ query: GET_MY_LESSONS, variables: { id: user?.id } }],
  });

  async function handleSave(e) {
    e.preventDefault();
    await createLesson({
      variables: {
        code: nanoid(),
      },
    });
    router.push({
      pathname: "/dashboard/lessons",
    });
  }

  return (
    <div>
      <LessonForm inputs={inputs} handleChange={handleChange} />
      <Button variant="filled" type="button" onClick={handleSave}>
        {t("lessons.save", {}, { default: "Save" })}
      </Button>
    </div>
  );
}
