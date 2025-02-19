import Board from "./Board";

export default function Feedback({ user, projectId, reviews }) {
  const orderedReviews = reviews.sort((a, b) => {
    return b?.upvotedBy?.length - a?.upvotedBy?.length;
  });

  return <Board user={user} projectId={projectId} reviews={orderedReviews} />;
}
