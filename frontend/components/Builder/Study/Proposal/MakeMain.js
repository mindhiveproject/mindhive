import { useMutation } from "@apollo/client";

import { DELETE_COMPLETE_PROPOSAL } from "../../../Mutations/Proposal";
import { UPDATE_STUDY } from "../../../Mutations/Study";

export default function MakeMain({
  children,
  studyId,
  proposalId,
  refetchQueries,
}) {
  const [updateStudy, { loading }] = useMutation(UPDATE_STUDY, {
    variables: {
      id: studyId,
      input: {
        proposalMain: { connect: { id: proposalId } },
      },
    },
    refetchQueries: [...refetchQueries],
  });

  return (
    <div
      style={{ cursor: "pointer" }}
      onClick={() => {
        if (
          confirm("Are you sure you want to make this proposal the main one?")
        ) {
          updateStudy().catch((err) => {
            alert(err.message);
          });
        }
      }}
    >
      {children}
    </div>
  );
}
