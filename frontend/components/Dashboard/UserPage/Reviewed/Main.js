import absoluteUrl from "next-absolute-url";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import Modal from "./Modal";

export default function Reviewed({ query, user, profile }) {
  const { t } = useTranslation("classes");
  const { origin } = absoluteUrl();

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
        <div>{t("reviewed.noReviewsYet")}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="headerReviewedStudies">
        <div>{t("reviewed.studyTitle")}</div>
        <div>{t("reviewed.review")}</div>
        <div>{t("reviewed.study")}</div>
        <div>{t("reviewed.proposal")}</div>
        <div>{t("reviewed.reviewType")}</div>
        <div>{t("reviewed.dateReviewed")}</div>
      </div>

      {reviews.map((review, id) => (
        <div className="rowReviewedStudies" key={id}>
          <div className="title">{review.title}</div>
          <div>
            <Modal review={review} profile={profile} />
          </div>
          <div>
            <a
              href={`${origin}/studies/${review.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("reviewed.open")}
            </a>
          </div>
          <div>
            <a
              href={`${origin}/proposals/${review.proposalSlug}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("reviewed.open")}
            </a>
          </div>
          <div>{review?.stage}</div>
          <div>{moment(review.reviewedAt).format("MMMM D, YYYY, h:mma")}</div>
        </div>
      ))}
    </div>
  );
}
