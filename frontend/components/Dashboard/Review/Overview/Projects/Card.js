import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

export default function Card({
  stage,
  project,
  status,
  isOpenForCommentsQuery,
  onClick,
  className = "",
  style,
  ...rest
}) {
  const { t } = useTranslation("builder");
  const imageURL = null;

  const isOpenForComments = project[isOpenForCommentsQuery];

  const shortenTitle = (title) => {
    if (title?.length <= 48) {
      return title;
    }
    const truncated = title.substr(0, 48);
    const lastSpaceIndex = truncated.lastIndexOf(" ");
    return title.substr(0, lastSpaceIndex) + "...";
  };

  const reviewCount = project?.reviews?.filter((r) => r?.stage === status).length;

  const handleKeyDown = (event) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(event);
    }
  };

  const cardClassName = ["card", onClick ? "isClickable" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClassName}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={style}
      {...rest}
    >
      <div className="headline">
        {project?.study?.featured && (
          <div className="p12">{t("review.featuredProject")}</div>
        )}
        <div className="p12">
          {reviewCount} {reviewCount > 1 ? t("review.reviewPlural") : t("review.reviewSingular")}
        </div>
      </div>
      <div className="p13">{shortenTitle(project?.title)}</div>
      <div className="imageContainer">
        {imageURL ? (
          <img src={imageURL} alt={project?.title} />
        ) : (
          <div className="noImage">
            <img src="/logo.png" alt={project?.title} />
          </div>
        )}
      </div>
      <div className="lowPanel">
        <div>
          {status === "Proposal" && (
            <div className="tag proposal">{t("review.proposalTag")}</div>
          )}
          {status === "Peer Review" && (
            <div className="tag peerreview">{t("review.peerReviewTag")}</div>
          )}
          {status === "Collecting data" && (
            <div className="tag peerreview">{t("review.collectingDataTag")}</div>
          )}
        </div>
        <div className="options">
          {isOpenForComments ? (
            <div className="option">
              <img src="/assets/icons/review/comment.svg" />
              <div>{t("review.commentBtn")}</div>
            </div>
          ) : (
            <div className="option">
              <img src="/assets/icons/proposal/status-completed.svg" />
              <div>{t("review.locked")}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
