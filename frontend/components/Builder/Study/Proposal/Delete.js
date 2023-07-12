import { useMutation } from "@apollo/client";
import { DELETE_COMPLETE_PROPOSAL } from "../../../Mutations/Proposal";
import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Proposal";

export default function DeleteProposal({ children, proposalId, studyId }) {
  const [deleteProposal, { loading }] = useMutation(DELETE_COMPLETE_PROPOSAL, {
    variables: {
      id: proposalId,
    },
    refetchQueries: [{ query: STUDY_PROPOSALS_QUERY, variables: { studyId } }],
  });

  return (
    <div
      style={{ cursor: "pointer" }}
      onClick={() => {
        if (
          confirm(
            "Are you sure you want to delete this proposal? All sections and cards in this proposal will be deleted as well."
          )
        ) {
          deleteProposal().catch((err) => {
            alert(err.message);
          });
        }
      }}
    >
      {children}
    </div>
  );
}
