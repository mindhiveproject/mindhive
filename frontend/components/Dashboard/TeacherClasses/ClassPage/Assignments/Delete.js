import { useMutation } from "@apollo/client";
import { DELETE_ASSIGNMENT } from "../../../../Mutations/Assignment";
import { GET_MY_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";

export default function DeleteAssignment({ user, myclass, id, children }) {
  const [deleteAssignment, { loading }] = useMutation(DELETE_ASSIGNMENT, {
    variables: { id },
    refetchQueries: [
      {
        query: GET_MY_CLASS_ASSIGNMENTS,
        variables: { userId: user?.id, classId: myclass?.id },
      },
    ],
  });

  return (
    <div
      style={{ cursor: "pointer" }}
      onClick={() => {
        if (confirm("Are you sure you want to delete this assignment?")) {
          deleteAssignment().catch((err) => {
            alert(err.message);
          });
        }
      }}
    >
      {children}
    </div>
  );
}
