import { useMutation } from "@apollo/client";
import { Icon } from "semantic-ui-react";
import { DELETE_DATASET } from "../../../../../Mutations/Dataset";
import { GET_PARTICIPANT_RESULTS } from "../../../../../Queries/Result";

export default function DeleteRecord({ studyId, participantId, dataset }) {
  const [deleteDataset] = useMutation(DELETE_DATASET, {
    variables: { id: dataset?.id },
    refetchQueries: [
      {
        query: GET_PARTICIPANT_RESULTS,
        variables: { studyId: studyId, participantId: participantId },
      },
    ],
  });

  const deleteRecord = () => {
    deleteDataset();
  };

  return (
    <div className="downloadArea" onClick={deleteRecord}>
      <Icon color="red" size="large" name="delete" />
      <a>Delete invalid record</a>
    </div>
  );
}
