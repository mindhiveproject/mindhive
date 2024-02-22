import { useQuery } from "@apollo/client";
import { GET_REVIEW } from "../../../Queries/Review";

import Questions from "./Questions";

import { individual, synthesis } from "./Template";

export default function Review({ studyId, proposalId, authorId, stage }) {
  const { data, loading, error } = useQuery(GET_REVIEW, {
    variables: {
      proposalId,
      authorId,
      stage,
    },
    fetchPolicy: "network-only",
  });

  const reviews = data?.reviews || [];
  const review = reviews.length ? reviews[0] : {};

  if (loading) return <></>;

  if (review?.content) {
    return (
      <Questions
        studyId={studyId}
        proposalId={proposalId}
        authorId={authorId}
        stage={stage}
        content={review?.content}
        reviewId={review?.id}
      />
    );
  } else if (reviews?.length === 0) {
    return (
      <Questions
        studyId={studyId}
        proposalId={proposalId}
        authorId={authorId}
        stage={stage}
        content={stage === "INDIVIDUAL" ? individual : synthesis}
      />
    );
  }
}
