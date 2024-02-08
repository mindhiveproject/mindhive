import useForm from "../../../../../lib/useForm";
import { useMutation } from "@apollo/client";
import AssignmentModal from "./Modal";

import { GET_CLASS } from "../../../../Queries/Classes";
import { EDIT_ASSIGNMENT } from "../../../../Mutations/Assignment";
import { GET_ASSIGNMENT } from "../../../../Queries/Assignment";

export default function EditAssignment({ assignment, myclass }) {
  const { inputs, handleChange, clearForm } = useForm({
    ...assignment,
  });

  const [editAssignment, { loading: editLoading }] = useMutation(
    EDIT_ASSIGNMENT,
    {
      variables: {
        id: assignment?.id,
        input: {
          title: inputs?.title,
          content: inputs?.content,
          classes: inputs?.classes
            ? { set: inputs?.classes.map((cl) => ({ id: cl?.id })) }
            : null, // [ { id: "123" }, { id: "234" } ]
          tags: inputs?.tags ? { set: inputs?.tags } : null,
        },
      },
      refetchQueries: [
        { query: GET_CLASS, variables: { code: myclass?.code } },
        { query: GET_ASSIGNMENT, variables: { code: assignment?.code } },
      ],
    }
  );

  const handleSave = () => {
    editAssignment();
    clearForm();
  };

  return (
    <AssignmentModal
      btnName="Save"
      inputs={inputs}
      handleChange={handleChange}
      submit={handleSave}
    >
      <div>
        <button>Edit assignment</button>
      </div>
    </AssignmentModal>
  );
}
