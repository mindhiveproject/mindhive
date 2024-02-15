import { useQuery, useMutation } from "@apollo/client";

import moment from "moment";
import useForm from "../../../../lib/useForm";

import Editor from "./Editor";

import {
  GET_MY_HOMEWORK,
  GET_MY_HOMEWORKS_FOR_ASSIGNMENT,
} from "../../../Queries/Homework";
import { EDIT_HOMEWORK } from "../../../Mutations/Homework";

export default function Homework({
  user,
  assignmentCode,
  homeworkCode,
  btnName,
}) {
  const { data, loading, error } = useQuery(GET_MY_HOMEWORK, {
    variables: { userId: user?.id, code: homeworkCode },
  });

  const homeworks = data?.homeworks || [];
  const homework = (homeworks.length && homeworks[0]) || null;

  const { inputs, handleChange, clearForm } = useForm({
    ...homework,
  });

  const [editHomework, { loading: editLoading }] = useMutation(EDIT_HOMEWORK, {
    variables: {
      ...inputs,
    },
    refetchQueries: [
      {
        query: GET_MY_HOMEWORK,
        variables: { userId: user?.id, code: homeworkCode },
      },
      {
        query: GET_MY_HOMEWORKS_FOR_ASSIGNMENT,
        variables: { userId: user?.id, assignmentCode: assignmentCode },
      },
    ],
  });

  if (homework) {
    return (
      <Editor
        user={user}
        assignmentCode={assignmentCode}
        homeworkCode={homeworkCode}
        btnName={btnName}
        inputs={inputs}
        initialContent={homework?.content}
        handleChange={handleChange}
        editHomework={editHomework}
      />
    );
  }
}
