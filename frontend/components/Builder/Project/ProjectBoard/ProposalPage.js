import { useQuery } from "@apollo/client";
import styled from "styled-components";
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../Queries/Proposal";
import { useState, useEffect } from "react";
import ProposalPDF from "./Board/PDF/Main";
import ProposalBuilder from "./Board/Builder/Main";
import ProposalHeader from "./Board/Builder/Header";

const BoardFontWrapper = styled.div`
  font-family: "Inter", sans-serif;
  &,
  & * {
    font-family: "Inter", sans-serif !important;
  }
`;

export default function ProposalPage({
  user,
  proposalId,
  onCardOpenChange,
}) {
  const [isPDF, setIsPDF] = useState(false);
  const [hasUnsavedChangesInPDFView, setHasUnsavedChangesInPDFView] = useState(false);
  // Persist filter selections across view toggles
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedReviewSteps, setSelectedReviewSteps] = useState([]);
  const [selectedAssignedUsers, setSelectedAssignedUsers] = useState([]);
  // Lift card state so we can hide header when card is open
  const [page, setPage] = useState("board");
  const [card, setCard] = useState(null);

  const { data, error, loading } = useQuery(OVERVIEW_PROPOSAL_BOARD_QUERY, {
    variables: {
      id: proposalId,
    },
  });

  const proposal = data?.proposalBoard || {};
  const isCardOpen = page === "card";

  useEffect(() => {
    onCardOpenChange?.(isCardOpen);
  }, [isCardOpen, onCardOpenChange]);

  return (
    <BoardFontWrapper
      className="proposalBoard"
      style={
        isCardOpen
          ? {
              flex: 1,
              minHeight: 0,
              margin: 0,
            }
          : undefined
      }
    >
      {!isCardOpen && (
        <ProposalHeader
          user={user}
          proposal={proposal}
          proposalBuildMode={false}
          refetchQueries={[]}
          isPDF={isPDF}
          setIsPDF={setIsPDF}
          hasUnsavedChangesInPDFView={hasUnsavedChangesInPDFView}
          selectedStatuses={selectedStatuses}
          selectedReviewSteps={selectedReviewSteps}
          selectedAssignedUsers={selectedAssignedUsers}
        />
      )}
      {isPDF || proposal?.isSubmitted ? (
        <ProposalPDF
          proposalId={proposalId}
          user={user}
          onUnsavedChangesChange={setHasUnsavedChangesInPDFView}
          selectedStatuses={selectedStatuses}
          setSelectedStatuses={setSelectedStatuses}
          selectedReviewSteps={selectedReviewSteps}
          setSelectedReviewSteps={setSelectedReviewSteps}
          selectedAssignedUsers={selectedAssignedUsers}
          setSelectedAssignedUsers={setSelectedAssignedUsers}
        />
      ) : (
        <div
          style={
            isCardOpen
              ? {
                  gridRow: "1 / -1",
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  height: "100%",
                }
              : undefined
          }
        >
          <ProposalBuilder
            user={user}
            proposal={proposal}
            onClose={() => {}}
            proposalBuildMode={false}
            refetchQueries={[]}
            isPDF={isPDF}
            setIsPDF={setIsPDF}
            page={page}
            setPage={setPage}
            card={card}
            setCard={setCard}
          />
        </div>
      )}
    </BoardFontWrapper>
  );
}
