import { useState } from "react";
import { useQuery } from "@apollo/client";

import ProposalHeader from "./Header";
import ProposalBoard from "./Board";
import ProposalCard from "../Card/Main";

import { PROPOSAL_QUERY } from "../../Queries/Proposal";

export default function ProposalBuilder({
  user,
  proposalId,
  onClose,
  proposalBuildMode,
  isPreview,
  refetchQueries,
}) {
  const { loading, error, data } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
    pollInterval: 20000, // get new data every 20 seconds
  });

  const proposal = data?.proposalBoard || undefined;

  const [page, setPage] = useState("board");
  const [cardId, setCardId] = useState(null);

  const openCard = (cardId) => {
    setCardId(cardId);
    setPage("card");
  };

  const closeCard = () => {
    setPage("board");
    setCardId(null);
  };

  if (loading) return "Loading...";
  if (error) return `Error! ${error.message}`;

  if (page === "card") {
    return (
      <ProposalCard
        proposal={proposal}
        cardId={cardId}
        closeCard={closeCard}
        proposalBuildMode={proposalBuildMode}
        isPreview={isPreview}
      />
    );
  }

  return (
    <div>
      {proposalBuildMode && (
        <div className="goBackBtn">
          <span style={{ cursor: "pointer" }} onClick={onClose}>
            ← Back
          </span>
        </div>
      )}
      {isPreview ? (
        <>
          <h2>
            Preview of proposal template{" "}
            <span className="templateName">{proposal.title}</span>
          </h2>
          <p>{proposal.description}</p>
        </>
      ) : (
        <ProposalHeader
          user={user}
          proposal={proposal}
          proposalBuildMode={proposalBuildMode}
          refetchQueries={refetchQueries}
        />
      )}
      {proposal && (
        <ProposalBoard
          proposal={proposal}
          openCard={openCard}
          isPreview={isPreview}
        />
      )}
    </div>
  );
}
