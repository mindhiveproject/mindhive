import Overview from "./Overview/Main";
import ProjectReviewBoard from "./ProjectReview/Main";

import { StyledDasboardReview } from "../../styles/StyledReview";

export default function ReviewMain({ query, user }) {
  const { selector } = query;

  // Project review
  if (selector === "project") {
    return (
      <StyledDasboardReview>
        <ProjectReviewBoard query={query} user={user} />
      </StyledDasboardReview>
    );
  }

  // Overview
  return (
    <StyledDasboardReview>
      <Overview query={query} user={user} />
    </StyledDasboardReview>
  );
}
