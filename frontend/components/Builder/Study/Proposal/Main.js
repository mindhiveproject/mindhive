import { useQuery } from "@apollo/client";

import Navigation from "../Navigation/Main";
import InDev from "../../../Global/InDev";
import ProposalWrapper from "./Wrapper";

import { PROPOSAL_TEMPLATES_QUERY } from "../../../Queries/Proposal";

import { StyledProposal } from "../../../styles/StyledProposal";

import { 
  Sidebar, 
} from "semantic-ui-react";

export default function Proposal({ query, user, tab }) {
  const { data, error, loading } = useQuery(PROPOSAL_TEMPLATES_QUERY);

  const templates = data?.proposalBoards || [];

  if (templates.length === 0) {
    return (
      <>
        <Navigation query={query} user={user} tab={tab} />
        <InDev
          header="🤷🏻 Sorry, there are no proposal templates"
          message="If you need help, please contact the tech support at info@mindhive.science"
        />
      </>
    );
  }

  return (
    <>
      <div>

      </div>
      <Sidebar.Pushable>
      <Navigation query={query} user={user} tab={tab} />
      <StyledProposal>
        <ProposalWrapper query={query} user={user} templates={templates} />
      </StyledProposal>
    </Sidebar.Pushable>
    </>
   
  );
}
