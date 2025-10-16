import useForm from "../../../../../lib/useForm";
import { useMutation } from "@apollo/client";
import AssignmentModal from "./Modal";
import useTranslation from "next-translate/useTranslation";

import { GET_MY_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";
import { CREATE_ASSIGNMENT } from "../../../../Mutations/Assignment";

export default function NewAssignment({ user, myclass, assignment, children }) {
  const { t } = useTranslation("classes");
  const { inputs, handleChange, clearForm } = useForm({
    title: assignment?.title || "",
    content: assignment?.content || "",
    placeholder: assignment?.placeholder || "",
    classes: assignment?.classes || [{ id: myclass?.id }],
  });

  const [createAssignment, { loading }] = useMutation(CREATE_ASSIGNMENT, {
    variables: {
      input: {
        ...inputs,
        classes: inputs?.classes
          ? { connect: inputs?.classes.map((cl) => ({ id: cl?.id })) }
          : null,
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
      btnName={t("assignment.saveOwnCopy")}
      assignment={assignment}
      inputs={inputs}
      handleChange={handleChange}
      submit={handleSave}
      user={user}
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
