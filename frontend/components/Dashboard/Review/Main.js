import { StyledDasboardReview } from "../../styles/StyledReview";
import Overview from "./Overview/Main";
// import View from "./View/Main";
import ReviewBoard from "./ProjectReview/Main";

export default function ReviewMain({ query, user }) {
  const { selector } = query;

  // if (selector === "study") {
  //   return (
  //     <StyledDasboardReview>
  //       <View query={query} user={user} />
  //     </StyledDasboardReview>
  //   );
  // }

  // if (selector === "comment") {
  //   return (
  //     <StyledDasboardReview>
  //       <ReviewBoard query={query} user={user} />
  //     </StyledDasboardReview>
  //   );
  // }

  if (selector === "project") {
    return (
      <StyledDasboardReview>
        <ReviewBoard query={query} user={user} />
      </StyledDasboardReview>
    );
  }

  return (
    <StyledDasboardReview>
      <Overview query={query} user={user} />
    </StyledDasboardReview>
  );
}
