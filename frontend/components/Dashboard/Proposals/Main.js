import Link from "next/link";
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
  return (
    <StyledProposal>
      <ProposalBuilder 
        user={user} 
        proposalId={query?.id} 
        refetchQueries={[]} 
        proposalBuildMode 
      />
    </StyledProposal>
  );
}
