import { useQuery } from "@apollo/client";

import Navigation from "../Navigation/Main";
import Proposal from "./Proposal";

import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../Queries/Proposal";

import { StyledReviewPage } from "../../../styles/StyledReview";

export default function Review({ query, user, tab, toggleSidebar }) {
  const projectId = query?.selector;

  const { data, loading, error } = useQuery(OVERVIEW_PROPOSAL_BOARD_QUERY, {
    variables: {
      id: projectId,
    },
  });

  const project = data?.proposalBoard || {};

  return (
    <>
      <Navigation proposalId={projectId} query={query} user={user} tab={tab} />
      <StyledReviewPage>
        <Proposal query={query} user={user} project={project} />
      </StyledReviewPage>
    </>
  );
}
