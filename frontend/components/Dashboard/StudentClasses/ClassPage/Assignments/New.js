import useForm from "../../../../../lib/useForm";
import { useMutation } from "@apollo/client";
import AssignmentModal from "../../../Assignment/Modal";
import useTranslation from "next-translate/useTranslation";

import { GET_MY_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";
import { CREATE_ASSIGNMENT } from "../../../../Mutations/Assignment";

export default function NewAssignment({ user, myclass, assignment, children }) {
  const { t } = useTranslation("common");
  const { inputs, handleChange, clearForm } = useForm({
    title: assignment?.title || "",
    content: assignment?.content || "",
  });

  const [createAssignment, { loading }] = useMutation(CREATE_ASSIGNMENT, {
    variables: {
      input: {
        ...inputs,
        classes: inputs?.classes ? { connect: inputs?.classes } : null, // [ { id: "123" }, { id: "234" } ]
        tags: inputs?.tags ? { connect: inputs?.tags } : null,
      },
    },
    refetchQueries: [
      {
        query: GET_MY_CLASS_ASSIGNMENTS,
        variables: { userId: user?.id, classId: myclass?.id },
      },
    ],
  });

  const handleSave = () => {
    createAssignment();
    clearForm();
  };

  return (
    <AssignmentModal
      btnName={t("assignments.save")}
      inputs={inputs}
      handleChange={handleChange}
      submit={handleSave}
    >
      {children}
    </AssignmentModal>
  );
}

{
  /* <div>
<button>Create a new assignment</button>
</div> */
}
