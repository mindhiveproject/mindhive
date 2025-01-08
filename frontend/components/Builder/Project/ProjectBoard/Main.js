import { useQuery } from "@apollo/client";
import { Sidebar } from "semantic-ui-react";

import CardWrapper from "./Board/Card/Wrapper";
import Navigation from "../Navigation/Main";
import ProposalPage from "./ProposalPage";

import { PROPOSAL_QUERY } from "../../../Queries/Proposal";

import { StyledProposal } from "../../../styles/StyledProposal";

export default function Proposal({ query, user, tab, toggleSidebar }) {
  const proposalId = query?.selector;
  const cardId = query?.card;

  const { data, error, loading } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
  });

  const proposal = data?.proposalBoard || {};

  if (cardId) {
    return (
      <CardWrapper
        query={query}
        tab={tab}
        user={user}
        proposalId={proposalId}
        proposal={proposal}
        cardId={cardId}
        closeCard={() => {}}
        proposalBuildMode={false}
        isPreview={false}
      />
    );
  }

  return (
    <Sidebar.Pushable>
      {proposalId && (
        <>
          <Navigation
            proposalId={proposalId}
            query={query}
            user={user}
            tab={tab}
            toggleSidebar={toggleSidebar}
          />
          <StyledProposal>
            <ProposalPage user={user} proposalId={proposalId} />
          </StyledProposal>
        </>
      )}
    </Sidebar.Pushable>
  );
}
