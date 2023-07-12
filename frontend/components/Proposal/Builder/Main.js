import { useState } from "react";

import ProposalHeader from "./Header";
import ProposalBoard from "./Board";
import ProposalCard from "../Card/Main";

export default function ProposalBuilder({
  user,
  studyId,
  proposal,
  proposalId,
  onClose,
  proposalBuildMode,
  isPreview,
}) {
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

  if (page === "card") {
    return (
      <ProposalCard
        proposal={proposal}
        studyId={studyId}
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
          studyId={studyId}
        />
      )}
      {proposalId && (
        <ProposalBoard
          proposalId={proposalId}
          settings={proposal?.settings}
          openCard={openCard}
          isPreview={isPreview}
        />
      )}
    </div>
  );
}
