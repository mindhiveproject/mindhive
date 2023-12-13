import { Checkbox } from "semantic-ui-react";

import { useMutation } from "@apollo/client";

import { CHANGE_DATASET_STATUS } from "../../../../Mutations/Dataset";

import { GET_USER_RESULTS } from "../../../../Queries/Result";
import { GET_GUEST_RESULTS } from "../../../../Queries/Result";
import { GET_STUDY_PARTICIPANTS } from "../../../../Queries/User";

export default function ChangeDatasetStatuses({
  studyId,
  participantId,
  datasets,
  type,
}) {
  const areIncluded =
    datasets
      ?.filter((dataset) => dataset?.isCompleted)
      .map((dataset) => dataset?.isIncluded) || [];
  const allIncluded = areIncluded.length && areIncluded?.every((v) => !!v);

  const queriesToRefetch =
    type === "user"
      ? [
          { query: GET_USER_RESULTS, variables: { id: participantId } },
          { query: GET_STUDY_PARTICIPANTS, variables: { id: studyId } },
        ]
      : [
          { query: GET_GUEST_RESULTS, variables: { id: participantId } },
          { query: GET_STUDY_PARTICIPANTS, variables: { id: studyId } },
        ];

  const [changeStatus] = useMutation(CHANGE_DATASET_STATUS, {
    refetchQueries: queriesToRefetch,
  });

  const change = () => {
    datasets.forEach((dataset) => {
      changeStatus({
        variables: {
          token: dataset?.token,
          isIncluded: !allIncluded,
        },
      });
    });
  };

  if (areIncluded?.length) {
    return (
      <div>
        <Checkbox toggle checked={allIncluded} onClick={change} />
      </div>
    );
  } else {
    return <div></div>;
  }
}
