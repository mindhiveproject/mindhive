import { useState } from "react";

import Wrapper from "./Wrapper";

import { StyledReviewPage } from "../../../styles/StyledReview";

export default function Review({ user, study }) {
  const [proposalId, setProposalId] = useState(
    (study?.proposal.length && study?.proposal[0].id) || null
  );

  if (proposalId) {
    return (
      <StyledReviewPage>
        <Wrapper
          user={user}
          study={study}
          proposalId={proposalId}
          setProposalId={setProposalId}
        />
        ;
      </StyledReviewPage>
    );
  }
  return <div>There are no proposals</div>;
}
