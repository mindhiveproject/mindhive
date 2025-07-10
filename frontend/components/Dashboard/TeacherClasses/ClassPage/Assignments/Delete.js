import { useMutation } from "@apollo/client";
import { DELETE_ASSIGNMENT } from "../../../../Mutations/Assignment";
import { GET_MY_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";
import useTranslation from "next-translate/useTranslation";

export default function DeleteAssignment({ user, myclass, id, children }) {
  const { t } = useTranslation("classes");
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
        if (confirm(t("assignment.deleteConfirm"))) {
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
