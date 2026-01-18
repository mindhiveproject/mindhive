import { useQuery } from "@apollo/client";
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../Queries/Proposal";
import { useState } from "react";
import ProposalPDF from "./Board/PDF/Main";
import ProposalBuilder from "./Board/Builder/Main";
import ProposalHeader from "./Board/Builder/Header";

export default function ProposalPage({ user, proposalId }) {
  const [isPDF, setIsPDF] = useState(false);
  const { data, error, loading } = useQuery(OVERVIEW_PROPOSAL_BOARD_QUERY, {
    variables: {
      id: proposalId,
    },
  });

  const proposal = data?.proposalBoard || {};

  return (
    <div className="proposalBoard">
      <ProposalHeader
        user={user}
        proposal={proposal}
        proposalBuildMode={false}
        refetchQueries={[]}
        isPDF={isPDF}
        setIsPDF={setIsPDF}
      />
      {isPDF || proposal?.isSubmitted ? (
        <ProposalPDF proposalId={proposalId} user={user} />
      ) : (
        <ProposalBuilder
          user={user}
          proposal={proposal}
          onClose={() => {}}
          proposalBuildMode={false}
          refetchQueries={[]}
          isPDF={isPDF}
          setIsPDF={setIsPDF}
        />
      )}
    </div>
  );
}
