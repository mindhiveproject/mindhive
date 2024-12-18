import Navigation from "../Navigation/Main";
import ProposalPage from "./ProposalPage";

import { StyledProposal } from "../../../styles/StyledProposal";

import { Sidebar } from "semantic-ui-react";
import CardWrapper from "./Board/Card/Wrapper";

export default function Proposal({ query, user, tab, toggleSidebar }) {
  const boardId = query?.selector;
  const cardId = query?.card;

  if (cardId) {
    return (
      <CardWrapper
        query={query}
        tab={tab}
        user={user}
        boardId={boardId}
        proposal={null}
        cardId={cardId}
        closeCard={() => {}}
        proposalBuildMode={false}
        isPreview={false}
      />
    );
  }

  return (
    <Sidebar.Pushable>
      {boardId && (
        <>
          <Navigation
            proposalId={boardId}
            query={query}
            user={user}
            tab={tab}
            toggleSidebar={toggleSidebar}
          />
          <StyledProposal>
            <ProposalPage user={user} proposalId={boardId} />
          </StyledProposal>
        </>
      )}
    </Sidebar.Pushable>
  );
}
