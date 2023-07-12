import moment from "moment";

import Modal from "./Modal";

export default function Reviewed({ query, user, profile }) {
  const reviews = [
    ...profile?.reviews.map((review) => ({
      id: review?.id,
      title: review?.study?.title,
      reviewedAt: review?.createdAt,
      slug: review?.study?.slug,
      stage: review?.stage,
      content: review?.content,
      proposalSlug: review?.proposal?.slug,
    })),
  ];

  if (reviews.length === 0) {
    return (
      <div className="empty">
        <div>The student hasn’t reviewed any studies yet.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="headerReviewedStudies">
        <div>Study title</div>
        <div>Review</div>
        <div>Study</div>
        <div>Proposal</div>
        <div>Review type</div>
        <div>Date reviewed</div>
      </div>

      {reviews.map((review, id) => (
        <div className="rowReviewedStudies" key={id}>
          <div className="title">{review.title}</div>
          <div>
            <Modal review={review} profile={profile} />
          </div>
          <div>
            <a
              href={`https://mindhive.science/studies/${review.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          </div>
          <div>
            <a
              href={`https://mindhive.science/proposals/${review.proposalSlug}`}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          </div>
          <div>{review?.stage}</div>
          <div>{moment(review.reviewedAt).format("MMMM D, YYYY, h:mma")}</div>
        </div>
      ))}
    </div>
  );
}
