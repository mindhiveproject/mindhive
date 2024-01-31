import Link from "next/link";

import { useQuery } from "@apollo/client";
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../Queries/Proposal";

import AddProposal from "./AddProposal";
import ProposalsList from "./ProposalsList";
import ProposalBuilder from "../../Proposal/Builder/Main";

import { StyledProposal } from "../../styles/StyledProposal";

export default function ProposalsMain({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return (
      <>
        <h1>My proposal templates</h1>
        <Link href="/dashboard/proposals/add">
          <button>Create proposal template</button>
        </Link>
        <ProposalsList query={query} user={user} />
      </>
    );
  }
  if (selector === "add") {
    return <AddProposal user={user} />;
  }

  const { data, error, loading } = useQuery(OVERVIEW_PROPOSAL_BOARD_QUERY, {
    variables: {
      id: query?.id,
    },
  });

  const proposal = data?.proposalBoard || {};

  return (
    <StyledProposal>
      <div className="goBackBtn">
        <Link href="/dashboard/proposals">
          <span style={{ cursor: "pointer" }}>← Back</span>
        </Link>
      </div>
      <ProposalBuilder
        user={user}
        proposal={proposal}
        refetchQueries={[]}
        proposalBuildMode
      />
    </StyledProposal>
  );
}
