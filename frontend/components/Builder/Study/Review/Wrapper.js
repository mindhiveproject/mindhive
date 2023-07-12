import { useState } from "react";
import { useQuery } from "@apollo/client";
import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";

import Proposal from "./Proposal";
import Review from "./Reviews/Review";

export default function Wrapper({ proposals, proposalId, setProposalId }) {
  const [page, setPage] = useState("proposal");
  const [review, setReview] = useState(null);
  const [reviewNumber, setReviewNumber] = useState(null);

  const { data, loading, error } = useQuery(PROPOSAL_REVIEWS_QUERY, {
    variables: { id: proposalId },
  });
  const proposal = data?.proposalBoard || {};

  const selectReview = (review, reviewNumber) => {
    setPage("review");
    setReview(review);
    setReviewNumber(reviewNumber);
  };

  const closeReview = () => {
    setPage("proposal");
    setReview(null);
    setReviewNumber(null);
  };

  if (page === "proposal") {
    return (
      <Proposal
        proposals={proposals}
        proposal={proposal}
        selectReview={selectReview}
        setReviewNumber={setReviewNumber}
        setProposalId={setProposalId}
      />
    );
  }

  if (page === "review") {
    return (
      <Review
        review={review}
        reviewNumber={reviewNumber}
        closeReview={closeReview}
      />
    );
  }

  return <div></div>;
}
