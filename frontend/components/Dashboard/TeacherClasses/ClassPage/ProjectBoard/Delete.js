import { useMutation } from "@apollo/client";

import { DELETE_COMPLETE_PROPOSAL } from "../../../../Mutations/Proposal";

export default function DeleteProposal({
  children,
  proposalId,
  refetchQueries,
}) {
  const [deleteProposal, { loading }] = useMutation(DELETE_COMPLETE_PROPOSAL, {
    variables: {
      id: proposalId,
    },
    refetchQueries: [...refetchQueries],
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
