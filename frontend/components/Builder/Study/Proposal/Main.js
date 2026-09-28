import { useState } from "react";
import styled from "styled-components";

import Navigation from "../../Project/Navigation/Main";
import ProposalWrapper from "./Wrapper";

import { StyledProposal } from "../../../styles/StyledProposal";

const StudyBoardShell = styled.div`
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

export default function Proposal({ query, user, tab }) {
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  return (
    <StudyBoardShell>
      <Navigation
        query={query}
        user={user}
        tab={tab}
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
