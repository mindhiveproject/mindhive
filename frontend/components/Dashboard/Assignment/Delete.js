import { useMutation } from "@apollo/client";
import { DELETE_HOMEWORK } from "../../Mutations/Homework";
import { GET_MY_HOMEWORK_FOR_ASSIGNMENT } from "../../Queries/Homework";

export default function DeleteHomework({
  user,
  assignment,
  homework,
  children,
}) {
  const [deleteHomework, { loading }] = useMutation(DELETE_HOMEWORK, {
    variables: { id: homework?.id },
    refetchQueries: [
      {
        query: GET_MY_HOMEWORK_FOR_ASSIGNMENT,
        variables: { userId: user?.id, assignmentCode: assignment?.code },
      },
    ],
  });

  return (
    <div
      style={{ cursor: "pointer" }}
      onClick={() => {
        if (confirm("Are you sure you want to delete this homework?")) {
          deleteHomework().catch((err) => {
            alert(err.message);
          });
        }
      }}
    >
      {children}
    </div>
  );
}
