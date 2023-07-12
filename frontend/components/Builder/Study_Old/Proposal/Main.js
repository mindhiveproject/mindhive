import { useQuery } from "@apollo/client";
import { PROPOSAL_TEMPLATES_QUERY } from "../../../Queries/Proposal";

import InDev from "../../../Global/InDev";
import ProposalWrapper from "./Wrapper";
import { StyledProposal } from "../../../styles/StyledProposal";

export default function Proposal({ user, study }) {
  const { data, error, loading } = useQuery(PROPOSAL_TEMPLATES_QUERY);

  const templates = data?.proposalBoards || [];

  if (templates.length === 0) {
    return (
      <InDev
        header="🤷🏻 Sorry, there are no proposal templates"
        message="If you need help, please contact the tech support at info@mindhive.science"
      />
    );
  }

  return (
    <StyledProposal>
      <ProposalWrapper user={user} study={study} templates={templates} />;
    </StyledProposal>
  );
}
