import { useState } from "react";
import styled from "styled-components";
import { Sidebar } from "semantic-ui-react";

import Navigation from "../../Project/Navigation/Main";
import ProposalWrapper from "./Wrapper";

import { StyledProposal } from "../../../styles/StyledProposal";

const StudyBoardShell = styled(Sidebar.Pushable)`
  display: flex;
  flex-direction: column;
  grid-row: 1 / -1;
  align-self: stretch;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  .navigation {
    flex-shrink: 0;
  }

  .studyBoardPane {
    flex: 1;
    min-height: 0;
    height: auto;
    align-items: stretch;
    align-content: stretch;
  }
`;

export default function Proposal({ query, user, tab, toggleSidebar }) {
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  return (
    <StudyBoardShell>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
        connectModalOpen={connectModalOpen}
        onConnectModalOpenChange={setConnectModalOpen}
      />
      <StyledProposal className="studyBoardPane">
        <ProposalWrapper
          query={query}
          user={user}
          onRequestConnectClass={() => setConnectModalOpen(true)}
        />
      </StyledProposal>
    </StudyBoardShell>
  );
}
