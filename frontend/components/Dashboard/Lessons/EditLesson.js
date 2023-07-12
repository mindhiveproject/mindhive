import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import { GET_LESSON } from "../../Queries/Lesson";
import { UPDATE_LESSON } from "../../Mutations/Lesson";

import useForm from "../../../lib/useForm";
import LessonForm from "./LessonForm";

export default function EditLesson({ selector, query, user }) {
  const router = useRouter();
  const [content, setContent] = useState("");

  const { id } = query;
  const { data, loading, error } = useQuery(GET_LESSON, {
    variables: { id },
  });
  const lesson = data?.lesson || {};

  const { inputs, handleChange } = useForm({
    ...lesson,
  });

  const [
    updateLesson,
    { data: updateData, loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_LESSON, {
    variables: inputs,
    refetchQueries: [{ query: GET_LESSON, variables: { id } }],
  });

  async function handleSave(e) {
    console.log({ e });
    e.preventDefault();
    // TO DO: create or update the lesson
    await updateLesson();
    router.push({
      pathname: `/dashboard/lessons`,
    });
  }

  return (
    <div>
      <LessonForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
