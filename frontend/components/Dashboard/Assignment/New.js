import moment from "moment";
import useForm from "../../../lib/useForm";
import { useMutation } from "@apollo/client";
import HomeworkModal from "./Modal";

import { CREATE_HOMEWORK } from "../../Mutations/Homework";
import { GET_MY_HOMEWORK_FOR_ASSIGNMENT } from "../../Queries/Homework";

export default function NewHomework({ user, assignment, children }) {
  const { inputs, handleChange, clearForm } = useForm({
    title:
      assignment?.title + "-homework-" + moment().format("YYYY-MM-DD") || "",
    content: "",
  });

  const [createHomework, { loading }] = useMutation(CREATE_HOMEWORK, {
    variables: {
      ...inputs,
      assignmentId: assignment?.id,
    },
    refetchQueries: [
      {
        query: GET_MY_HOMEWORK_FOR_ASSIGNMENT,
        variables: { userId: user?.id, assignmentCode: assignment?.code },
      },
    ],
  });

  const handleSave = () => {
    createHomework();
    clearForm();
  };

  return (
    <HomeworkModal
      btnName="Save"
      inputs={inputs}
      handleChange={handleChange}
      submit={handleSave}
    >
      {children}
    </HomeworkModal>
  );
}
