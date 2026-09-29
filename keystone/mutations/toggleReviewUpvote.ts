// Upvote or remove an upvote on someone else's review. Review updates are
// author-only, so the upvotedBy change is made here with sudo and limited to
// the session user's own vote.
async function toggleReviewUpvote(
  root: any,
  { reviewId, upvote }: { reviewId: string; upvote: boolean },
  context: any
): Promise<any> {
  const me = context.session?.itemId;
  if (!me) {
    throw new Error("You must be logged in to upvote a review.");
  }

  const sudo = context.sudo();
  const review = await sudo.query.Review.findOne({
    where: { id: reviewId },
    query: "id",
  });
  if (!review) {
    throw new Error("Review not found.");
  }

  await sudo.query.Review.updateOne({
    where: { id: reviewId },
    data: {
      upvotedBy: upvote
        ? { connect: [{ id: me }] }
        : { disconnect: [{ id: me }] },
    },
    query: "id",
  });

  // Returned through normal access so the caller gets what they may read.
  return context.db.Review.findOne({ where: { id: reviewId } });
}

export default toggleReviewUpvote;
