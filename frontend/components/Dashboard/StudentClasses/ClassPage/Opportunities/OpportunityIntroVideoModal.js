import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../../DesignSystem/Button";
import Modal from "../../../../DesignSystem/Modal";
import OpportunityIntroVideoPlayer from "../../../Connect/OpportunityIntroVideoPlayer";
import {
  formatOpportunityMentorLabel,
  formatOpportunitySponsorLabel,
} from "../../../../../lib/opportunityPeople";

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px 16px;
  margin-top: 16px;

  .label {
    font: var(--MH-Type-Label-Small, 500 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    margin-bottom: 2px;
  }

  .value {
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const Description = styled.p`
  margin: 12px 0 0;
  font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const VideoWrap = styled.div`
  margin-top: 16px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
`;

function mentorDisplayName(mentor) {
  if (!mentor) return null;
  const full = [mentor.firstName, mentor.lastName].filter(Boolean).join(" ");
  return full || mentor.username || null;
}

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return null;
  }
}

/**
 * Lightweight modal for intro video + key opportunity info in ranking flow.
 */
export default function OpportunityIntroVideoModal({
  open,
  onClose,
  opportunity,
}) {
  const { t } = useTranslation("classes");

  if (!opportunity) return null;

  const title = opportunity.title || "";
  const from = formatDate(opportunity.availableFrom);
  const to = formatDate(opportunity.availableTo);
  const closeLabel = t("opportunities.studentView.rankForm.videoModal.close", {}, {
    default: "Close",
  });
  const sponsorLine =
    formatOpportunitySponsorLabel(opportunity) !== "—"
      ? t(
          "opportunities.studentView.meta.sponsor",
          { name: formatOpportunitySponsorLabel(opportunity) },
          { default: "Sponsor: {{name}}" },
        )
      : null;
  const mentorLine = t(
    "opportunities.studentView.meta.mentor",
    { name: formatOpportunityMentorLabel(opportunity, t) },
    { default: "Mentor: {{name}}" },
  );

  const datesLine =
    from || to
      ? t(
          "opportunities.studentView.meta.dates",
          { from: from || "—", to: to || "—" },
          { default: "{{from}} → {{to}}" },
        )
      : null;

  const teamSizeLabel =
    opportunity.teamSize > 1
      ? t(
          "opportunities.preview.teamSizeTeam",
          { size: opportunity.teamSize },
          { default: "Team of {{size}}" },
        )
      : t("opportunities.preview.teamSizeSolo", {}, { default: "Solo" });

  const videoTitle = t(
    "opportunities.studentView.rankForm.videoModal.introVideo",
    {},
    { default: "Intro video" },
  );
  const openVideoInNewTabLabel = t(
    "opportunities.studentView.rankForm.videoModal.openVideoInNewTab",
    {},
    { default: "Open video in new tab" },
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="large"
      maxWidth={720}
      actions={
        <Button type="button" variant="outline" onClick={onClose}>
          {closeLabel}
        </Button>
      }
    >
      {sponsorLine ? (
        <p
          className="MH-Type-Label-Base"
          style={{ margin: 0, color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)" }}
        >
          {sponsorLine}
        </p>
      ) : null}
      <p
        className="MH-Type-Label-Base"
        style={{ margin: sponsorLine ? "4px 0 0" : 0, color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)" }}
      >
        {mentorLine}
      </p>
      {opportunity.shortDescription ? (
        <Description>{opportunity.shortDescription}</Description>
      ) : null}
      <MetaGrid>
        {datesLine ? (
          <div>
            <div className="label">
              {t("opportunities.studentView.preview.fields.available", {}, {
                default: "Available",
              })}
            </div>
            <div className="value">{datesLine}</div>
          </div>
        ) : null}
        {opportunity.timeCommitment ? (
          <div>
            <div className="label">
              {t("opportunities.studentView.preview.fields.timeCommitment", {}, {
                default: "Time commitment",
              })}
            </div>
            <div className="value">{opportunity.timeCommitment}</div>
          </div>
        ) : null}
        <div>
          <div className="label">
            {t("opportunities.studentView.preview.fields.teamSize", {}, {
              default: "Team size",
            })}
          </div>
          <div className="value">{teamSizeLabel}</div>
        </div>
      </MetaGrid>
      <VideoWrap>
        <OpportunityIntroVideoPlayer
          opportunity={opportunity}
          title={`${title} ${videoTitle}`}
          openInNewTabLabel={openVideoInNewTabLabel}
        />
      </VideoWrap>
    </Modal>
  );
}
