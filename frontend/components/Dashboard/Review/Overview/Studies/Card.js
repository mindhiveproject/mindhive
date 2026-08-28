import useTranslation from "next-translate/useTranslation";

import { getStudyImageUrl } from "../../../../../lib/profileStudyImageUrls";

import Card from "../../../../DesignSystem/Card";
import Chip from "../../../../DesignSystem/Chip";
import { BuilderIcon } from "../../../../DesignSystem/Icons";

// Same card surface as the Develop/Discover study cards (DesignSystem/Card),
// with the Feedback Center's own content: status + participation as chips, the
// participant count as body text, and no action button.
const IMAGE_WRAP_STYLE = {
  height: 192,
  width: "100%",
  flexShrink: 0,
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
  overflow: "hidden",
};
const IMAGE_STYLE = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};
const BODY_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: 16,
};
const CHIP_ROW_STYLE = { display: "flex", flexWrap: "wrap", gap: 8 };
const TITLE_STYLE = {
  color: "#171717",
  minHeight: 72,
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const COUNT_STYLE = { color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)" };

export default function StudyCard({ study }) {
  const { t } = useTranslation("builder");
  const imageURL = getStudyImageUrl(study);

  const isCollecting = study?.status === "COLLECTING_DATA";

  let statusLabel;
  switch (study?.status) {
    case "SUBMITTED_AS_PROPOSAL":
      statusLabel = t("review.proposalTag");
      break;
    case "IN_REVIEW":
      statusLabel = t("review.peerReviewTag");
      break;
    case "COLLECTING_DATA":
      statusLabel = t("review.collectingDataTag");
      break;
    default:
      statusLabel = t("review.undefined");
  }

  // Participants with at least one dataset still in COLLECTING_DATA.
  const activeParticipantsCount = [
    ...(study?.participants || []),
    ...(study?.guests || []),
  ].filter((participant) =>
    participant?.datasets?.some(
      (dataset) => dataset?.studyStatus === "COLLECTING_DATA"
    )
  ).length;

  const reviewCount =
    study?.reviews?.filter((r) => r?.stage === study?.status).length || 0;

  let countText;
  if (isCollecting) {
    countText =
      activeParticipantsCount === 0
        ? t("review.participantUnder")
        : activeParticipantsCount === 1
        ? t("review.participantOverOne", { count: activeParticipantsCount })
        : t("review.participantOverOnePlural", {
            count: activeParticipantsCount,
          });
  } else {
    countText =
      reviewCount < 1
        ? t("review.reviewUnder")
        : t("review.reviewOverOne", { count: reviewCount });
  }

  const openForParticipation =
    isCollecting && !!study?.dataCollectionOpenForParticipation;

  // Matches the old behaviour: the card only links out (new tab) while the
  // study is open for participation; otherwise it's a plain surface.
  const studyUrl = study?.slug
    ? `/dashboard/discover/studies?name=${study.slug}`
    : null;
  const canVisit = openForParticipation && !!studyUrl;

  const handleClick = (e) => {
    e.preventDefault();
    window.open(studyUrl, "_blank");
  };

  return (
    <Card
      variant="elevated"
      padding={0}
      href={canVisit ? studyUrl : undefined}
      onClick={canVisit ? handleClick : undefined}
      ariaLabel={study?.title}
    >
      <div style={IMAGE_WRAP_STYLE}>
        {imageURL ? (
          <img src={imageURL} alt="" style={IMAGE_STYLE} />
        ) : (
          <BuilderIcon
            width={24}
            height={24}
            style={{ color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)" }}
          />
        )}
      </div>

      <div style={BODY_STYLE}>
        <div style={CHIP_ROW_STYLE}>
          <Chip
            variant="static"
            tone="neutral"
            label={t("studyCard.typeLabel", {}, { default: "Study" })}
          />
        </div>

        <span className="MH-Type-Title-Base" style={TITLE_STYLE}>
          {study?.title}
        </span>

        <span className="MH-Type-Body-Base" style={COUNT_STYLE}>
          {countText}
        </span>

        <div style={CHIP_ROW_STYLE}>
          <Chip variant="static" tone="neutral" label={statusLabel} />
          {study?.featured && (
            <Chip
              variant="static"
              tone="warning"
              label={t("review.featuredProject")}
            />
          )}
          {isCollecting && (
            <Chip
              variant="static"
              tone={openForParticipation ? "success" : "neutral"}
              label={
                openForParticipation
                  ? t("review.openForParticipation")
                  : t("review.closedForParticipation")
              }
            />
          )}
        </div>
      </div>
    </Card>
  );
}
