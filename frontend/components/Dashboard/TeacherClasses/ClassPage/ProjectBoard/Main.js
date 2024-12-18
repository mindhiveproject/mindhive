import { useQuery } from "@apollo/client";
import Link from "next/link";

import InDev from "../../../../Global/InDev";
import ProposalWrapper from "./Wrapper";

import { PROPOSAL_TEMPLATES_QUERY } from "../../../../Queries/Proposal";

import { StyledProposal } from "../../../../styles/StyledProposal";

import { Sidebar } from "semantic-ui-react";

export default function ProjectBoard({ myclass, query, user }) {
  const { data, error, loading } = useQuery(PROPOSAL_TEMPLATES_QUERY);

  const templates = data?.proposalBoards || [];

  if (templates.length === 0) {
    return (
      <>
        <InDev
          header="🤷🏻 Sorry, there are no proposal templates"
          message="If you need help, please contact the tech support at info@mindhive.science"
        />
      </>
    );
  }

  return (
    <Sidebar.Pushable>
      <Link
        href={{
          pathname: `/dashboard/myclasses/${myclass?.code}`,
          query: {
            page: "projects",
          },
        }}
      >
        <div>← Back</div>
      </Link>

      <StyledProposal>
        <ProposalWrapper
          myclass={myclass}
          query={query}
          user={user}
          templates={templates}
        />
      </StyledProposal>
    </Sidebar.Pushable>
  );
}
