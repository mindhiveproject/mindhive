import useTranslation from "next-translate/useTranslation";

export default function Card({ study }) {
  const { t } = useTranslation("builder");
  const imageURL = study?.image?.image?.publicUrlTransformed;

  let status;
  switch (study?.status) {
    case "SUBMITTED_AS_PROPOSAL":
      status = t("review.proposalTag");
      break;
    case "IN_REVIEW":
      status = t("review.peerReviewTag");
      break;
    case "COLLECTING_DATA":
      status = t("review.collectingDataTag");
      break;
    default:
      status = t("review.undefined");
  }

  const shortenTitle = (title) => {
    if (title.length <= 48) {
      return title;
    }
    const truncated = title.substr(0, 48);
    const lastSpaceIndex = truncated.lastIndexOf(" ");
    return title.substr(0, lastSpaceIndex) + "...";
  };

  // Count participants with at least one dataset in COLLECTING_DATA status
  const activeParticipantsCount = [
    ...(study?.participants || []),
    ...(study?.guests || []),
  ].filter((participant) =>
    participant?.datasets?.some(
      (dataset) => dataset?.studyStatus === "COLLECTING_DATA"
    )
  ).length;

  const reviewCount = study?.reviews?.filter((r) => r?.stage === study?.status).length;

  return (
    <div className="card">
      <div className="headline">
        {study?.featured && <div className="p12">{t("review.featuredProject")}</div>}
        {study?.status !== "COLLECTING_DATA" && (
          <div className="p12">
            {typeof reviewCount === "undefined" || reviewCount < 1
              ? t("review.reviewUnder")
              : t("review.reviewOverOne", { count: reviewCount })}
          </div>
        )}
        {study?.status === "COLLECTING_DATA" && (
          <div className="p12">
            {activeParticipantsCount === 0
              ? t("review.participantUnder")
              : activeParticipantsCount === 1
              ? t("review.participantOverOne", { count: activeParticipantsCount })
              : t("review.participantOverOnePlural", { count: activeParticipantsCount })}
          </div>
        )}
      </div>
      <div className="p13">{shortenTitle(study?.title)}</div>
      <div className="imageContainer">
        {imageURL ? (
          <img src={imageURL} alt={study?.title} />
        ) : (
          <div className="noImage">
            <img src="/logo.png" alt={study?.title} />
          </div>
        )}
      </div>
      <div className="lowPanel">
        <div>
          {study?.status === "COLLECTING_DATA" &&
            study?.dataCollectionOpenForParticipation && (
              <div className="tag peerreview">{status}</div>
            )}
          {study?.status === "COLLECTING_DATA" &&
            !study?.dataCollectionOpenForParticipation && (
              <div className="tag closed">{t("review.closedForParticipation")}</div>
            )}
        </div>
        <div className="options">
          {study?.status === "COLLECTING_DATA" &&
            study?.dataCollectionOpenForParticipation && (
              <div className="option">
                <img src="/assets/icons/review/participate.svg" />
                <div>{t("review.participate")}</div>
              </div>
            )}

          {study?.status === "IN_REVIEW" && (
            <div className="option">
              <img src="/assets/icons/review/comment.svg" />
              <div>{t("review.commentBtn")}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
