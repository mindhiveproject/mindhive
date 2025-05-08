import {
  StyledReviewSection,
  StyledReviewBoard,
  StyledReviewCard,
} from "../../../styles/StyledReview";

import Feedback from "./Reviews/Main";

export default function Proposal({ user, query, project }) {
  const proposal = project || {};

  return (
    <StyledReviewSection>
      <StyledReviewBoard>
        <StyledReviewCard className="submit">
          <h2>Feedback</h2>
          <p>
            Once you submit your proposal or study, your reviews will appear
            here.
          </p>
          <Feedback user={user} query={query} proposal={proposal} />
        </StyledReviewCard>
      </StyledReviewBoard>
    </StyledReviewSection>
  );
}
