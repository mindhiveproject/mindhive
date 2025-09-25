import moment from "moment";
import { useEffect, useRef } from "react";
import useForm from "../../../lib/useForm";
import { useMutation } from "@apollo/client";
import HomeworkModal from "./Modal";

import { CREATE_HOMEWORK } from "../../Mutations/Homework";
import { GET_MY_HOMEWORKS_FOR_ASSIGNMENT } from "../../Queries/Homework";

export default function NewHomework({ user, assignment, children }) {
  const { inputs, handleChange, clearForm } = useForm({
    settings: { status: "Started" },
    title: "Homework | " + assignment?.title + " | " + moment().format("YYYY-MM-DD") + " | " + user?.username || "",
    placeholder: assignment?.placeholder || "",
  });

  const content = useRef("");
  
  useEffect(() => {
    if (!content.current && inputs.placeholder) {
      content.current = inputs.placeholder;
    }
  }, [inputs.placeholder]);

  const updateContent = async (newContent) => {
    content.current = newContent;
  };

  const [createHomework, { loading }] = useMutation(CREATE_HOMEWORK, {
    refetchQueries: [
      {
        query: GET_MY_HOMEWORKS_FOR_ASSIGNMENT,
        variables: { userId: user?.id, assignmentCode: assignment?.code },
      },
    ],
  });

  const handleSave = () => {
    createHomework({
      variables: {
        ...inputs,
        content: content?.current,
        assignmentId: assignment?.id,
      },
    });
    clearForm();
  };

  return (
    <HomeworkModal
      btnName="Save"
      inputs={inputs}
      content={content}
      updateContent={updateContent}
      handleChange={handleChange}
      submit={handleSave}
    >
      {children}
    </HomeworkModal>
  );
}
