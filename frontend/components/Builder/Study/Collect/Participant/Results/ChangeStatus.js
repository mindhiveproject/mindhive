import { Checkbox, Loader } from "semantic-ui-react";

import { useMutation } from "@apollo/client";

import { CHANGE_DATASET_STATUS } from "../../../../../Mutations/Dataset";
import { GET_PARTICIPANT_RESULTS } from "../../../../../Queries/Result";
import { GET_STUDY_RESULTS } from "../../../../../Queries/Study";

export default function ChangeDatasetStatus({
  studyId,
  participantId,
  dataset,
}) {
  const { isIncluded } = dataset;

  const [changeStatus, { loading }] = useMutation(CHANGE_DATASET_STATUS, {
    variables: { token: dataset?.token, isIncluded: !isIncluded },
    refetchQueries: [
      {
        query: GET_PARTICIPANT_RESULTS,
        variables: {
          studyId,
          participantId,
        },
      },
      {
        query: GET_STUDY_RESULTS,
        variables: {
          id: studyId,
        },
      },
    ],
  });

  const change = () => {
    changeStatus();
  };

  return (
    <div>
      {loading ? (
        <Loader active inline />
      ) : (
        <Checkbox checked={isIncluded} onClick={change} />
      )}
    </div>
  );
}
