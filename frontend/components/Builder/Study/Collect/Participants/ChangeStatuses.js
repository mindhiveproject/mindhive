import { Checkbox } from "semantic-ui-react";

import { useMutation } from "@apollo/client";

import { CHANGE_DATASET_STATUS } from "../../../../Mutations/Dataset";

import { GET_USER_RESULTS } from "../../../../Queries/Result";
import { GET_GUEST_RESULTS } from "../../../../Queries/Result";

export default function ChangeDatasetStatuses({
  participantId,
  datasets,
  type,
}) {
  const areIncluded = datasets?.map((dataset) => dataset?.isIncluded) || [];
  const allIncluded = areIncluded.length && areIncluded?.every((v) => !!v);

  const queryToRefetch =
    type === "user"
      ? { query: GET_USER_RESULTS, variables: { id: participantId } }
      : { query: GET_GUEST_RESULTS, variables: { id: participantId } };

  const [changeStatus] = useMutation(CHANGE_DATASET_STATUS, {
    refetchQueries: [queryToRefetch],
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
