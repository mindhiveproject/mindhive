import { Checkbox } from "semantic-ui-react";

import { useMutation } from "@apollo/client";

import { CHANGE_DATASET_STATUS } from "../../../../../Mutations/Dataset";
import { GET_PARTICIPANT_RESULTS } from "../../../../../Queries/Result";

export default function ChangeDatasetStatus({
  studyId,
  participantId,
  dataset,
}) {
  const { isIncluded } = dataset;

  const [changeStatus] = useMutation(CHANGE_DATASET_STATUS, {
    variables: { token: dataset?.token, isIncluded: !isIncluded },
    refetchQueries: [
      {
        query: GET_PARTICIPANT_RESULTS,
        variables: {
          studyId,
          participantId,
        },
      },
    ],
  });

  const change = () => {
    changeStatus();
  };

  return (
    <div>
      <Checkbox toggle checked={isIncluded} onClick={change} />
    </div>
  );
}
