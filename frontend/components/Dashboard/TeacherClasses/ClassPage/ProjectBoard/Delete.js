import { useMutation } from "@apollo/client";

import { DELETE_COMPLETE_PROPOSAL } from "../../../../Mutations/Proposal";
import useTranslation from "next-translate/useTranslation";
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
  const { t } = useTranslation("builder");
  return (
    <div
      style={{ cursor: "pointer" }}
      onClick={() => {
        if (
          confirm(
            t("deleteProposal.confirm")
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
