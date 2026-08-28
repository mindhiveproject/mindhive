import useTranslation from "next-translate/useTranslation";

import { isOpenForComments } from "../../../../../lib/milestoneStatus";

import Card from "../../../../DesignSystem/Card";
import Chip from "../../../../DesignSystem/Chip";
import { ProjectBoardIcon } from "../../../../DesignSystem/Icons";

// Same card surface as the Develop/Discover project cards (DesignSystem/Card),
// with the Feedback Center's own content: milestone status + comment state as
// chips, the review count as body text, and no action button.
const STATUS_LABEL_KEYS = {
  SUBMITTED_AS_PROPOSAL: "review.proposalTag",
  PEER_REVIEW: "review.peerReviewTag",
  PROJECT_REPORT: "review.projectReport",
};

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

export default function ProjectCard({
  stage,
  project,
  status,
  isOpenForCommentsQuery,
  milestones = [],
}) {
  const { t } = useTranslation("builder");

  const isOpen =
    isOpenForComments(project, status, milestones) ||
    (isOpenForCommentsQuery ? !!project[isOpenForCommentsQuery] : false);

  const reviewCount =
    project?.reviews?.filter((r) => r?.stage === status).length || 0;

  const statusLabel = STATUS_LABEL_KEYS[status]
    ? t(STATUS_LABEL_KEYS[status])
    : milestones.find((m) => m?.key === status)?.title || null;

  const countText =
    reviewCount === 1
      ? `${reviewCount} ${t("review.reviewSingular")}`
      : `${reviewCount} ${t("review.reviewPlural")}`;

  // Preserve the old navigation: a full page load to the review view, carrying
  // the current Feedback Center URL (filters and all) as `from`.
  const reviewUrl = `/dashboard/review/project?id=${project?.id}&stage=${stage}`;
  const handleClick = (e) => {
    e.preventDefault();
    const from = encodeURIComponent(window.location.href);
    window.location.href = `${reviewUrl}&from=${from}`;
  };

  return (
    <Card
      variant="elevated"
      padding={0}
      href={reviewUrl}
      onClick={handleClick}
      ariaLabel={project?.title}
    >
      <div style={IMAGE_WRAP_STYLE}>
        <ProjectBoardIcon
          width={24}
          height={24}
          style={{ color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)" }}
        />
      </div>

      <div style={BODY_STYLE}>
        <div style={CHIP_ROW_STYLE}>
          <Chip
            variant="static"
            tone="neutral"
            label={t("projectCard.typeLabel", {}, { default: "Project" })}
          />
        </div>

        <span className="MH-Type-Title-Base" style={TITLE_STYLE}>
          {project?.title}
        </span>

        <span className="MH-Type-Body-Base" style={COUNT_STYLE}>
          {countText}
        </span>

        <div style={CHIP_ROW_STYLE}>
          {statusLabel && (
            <Chip variant="static" tone="neutral" label={statusLabel} />
          )}
          {project?.study?.featured && (
            <Chip
              variant="static"
              tone="warning"
              label={t("review.featuredProject")}
            />
          )}
          <Chip
            variant="static"
            tone={isOpen ? "success" : "neutral"}
            label={isOpen ? t("review.commentBtn") : t("review.locked")}
          />
        </div>
      </div>
    </Card>
  );
}
