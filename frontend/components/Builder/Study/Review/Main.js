import { useState } from "react";
import { useQuery } from "@apollo/client";

import Navigation from "../Navigation/Main";
import Wrapper from "./Wrapper";

import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Proposal";

import { StyledReviewPage } from "../../../styles/StyledReview";

export default function Review({ query, user, tab, toggleSidebar }) {
  const studyId = query?.selector;

  const { data, loading, error } = useQuery(STUDY_PROPOSALS_QUERY, {
    variables: {
      studyId: studyId,
    },
  });

  const proposals = data?.proposalBoards || [];

  const [proposalId, setProposalId] = useState(
    (proposals.length && proposals[0].id) || null
  );

  if (proposalId) {
    return (
      <>
        <Navigation query={query} user={user} tab={tab} />
        <StyledReviewPage>
          <Wrapper
            user={user}
            proposals={proposals}
            proposalId={proposalId}
            setProposalId={setProposalId}
          />
        </StyledReviewPage>
      </>
    );
  }

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
      />
      <div>There are no proposals</div>;
    </>
  );
}
