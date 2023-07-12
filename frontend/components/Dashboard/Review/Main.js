import Wrapper from "./Wrapper";
import ReviewBoard from "./Board/Main";

import { StyledDasboardReview } from "../../styles/StyledReview";

export default function ReviewMain({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return (
      <StyledDasboardReview>
        <Wrapper page="featured" query={query} user={user} />
      </StyledDasboardReview>
    );
  }

  if (selector === "proposal") {
    return (
      <StyledDasboardReview>
        <ReviewBoard query={query} user={user} />
      </StyledDasboardReview>
    );
  }

  return (
    <StyledDasboardReview>
      <Wrapper page={selector} query={query} user={user} />
    </StyledDasboardReview>
  );
}
