import { useQuery } from "@apollo/client";

import Navigation from "../Navigation/Main";
import Proposal from "./Proposal";

import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";

import { StyledReviewPage } from "../../../styles/StyledReview";

export default function Review({ query, user, tab, toggleSidebar }) {
  const studyId = query?.selector;

  const { data, loading, error } = useQuery(STUDY_PROPOSALS_QUERY, {
    variables: {
      id: studyId,
    },
  });

  const study = data?.study || {};

  return (
    <>
      <Navigation query={query} user={user} tab={tab} />
      <StyledReviewPage>
        <Proposal query={query} user={user} study={study} />
      </StyledReviewPage>
    </>
  );
}
