import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import { CheckIcon, EditDocumentIcon } from "../../../../DesignSystem/Icons";

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 0;
`;

const Title = styled.h2`
  margin: 0;
  flex: 1 1 auto;
  min-width: 0;
  font-family: Inter, sans-serif;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const SUBMITTED_CHIP_STYLE = {
  background: "#e3f4ec",
  backgroundColor: "#e3f4ec",
  color: "#1d6b3a",
};

const DRAFT_CHIP_STYLE = {
  background: "#fdf6e3",
  backgroundColor: "#fdf6e3",
  color: "#7a5b00",
};

const Helper = styled.p`
  margin: 0;
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 20px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Due = styled.p`
  margin: 0;
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-start;
  padding-top: 4px;
`;

/**
 * Task-shaped entry card for student opportunity ranking on the browse tab.
 */
export default function StudentRankActionCard({
  round,
  preference = null,
  hasOpportunities = true,
  onRank,
}) {
  const { t } = useTranslation("classes");

  if (!round?.id) return null;

  const roundTitle = round.title?.trim() || round.id;
  const submitted = preference?.status === "submitted";
  const hasDraft = Boolean(preference) && !submitted;

  let title;
  let helper = null;
  let ctaLabel;
  let buttonVariant = "filled";

  if (submitted) {
    title = t(
      "opportunities.studentView.rankCard.titleSubmitted",
      { roundTitle },
      { default: "You submitted your ranking for {{roundTitle}}" },
    );
    helper = t(
      "opportunities.studentView.rankCard.helperSubmitted",
      {},
      { default: "You can review what you sent." },
    );
    ctaLabel = t(
      "opportunities.studentView.rankCard.ctaView",
      {},
      { default: "View ranking" },
    );
    buttonVariant = "outline";
  } else if (hasDraft) {
    title = t(
      "opportunities.studentView.rankCard.titleDraft",
      { roundTitle },
      { default: "Finish your ranking for {{roundTitle}}" },
    );
    ctaLabel = t(
      "opportunities.studentView.rankCard.ctaContinue",
      {},
      { default: "Continue ranking" },
    );
  } else {
    title = t(
      "opportunities.studentView.rankCard.titleNotStarted",
      { roundTitle },
      { default: "Rank your opportunities for {{roundTitle}}" },
    );
    helper = hasOpportunities
      ? t(
          "opportunities.studentView.rankCard.helperBrowse",
          {},
          {
            default:
              "This is how you get matched. Browse below, then rank.",
          },
        )
      : t(
          "opportunities.studentView.rankCard.helperEmpty",
          {},
          {
            default:
              "When opportunities appear, come back here to rank them.",
          },
        );
    ctaLabel = t(
      "opportunities.studentView.rankCard.ctaRankNow",
      {},
      { default: "Rank now" },
    );
  }

  const statusChipLabel = submitted
    ? t("opportunities.studentView.rankForm.statusSubmitted", {}, {
        default: "Submitted",
      })
    : hasDraft
      ? t("opportunities.studentView.rankForm.statusDraft", {}, {
          default: "Draft saved",
        })
      : null;

  const closeAt = round.closeAt;
  const showDue = closeAt && !submitted;
  const dueDate = showDue ? new Date(closeAt).toLocaleDateString() : null;
  const dueLine = showDue
    ? t(
        "opportunities.studentView.rankCard.due",
        { date: dueDate },
        { default: "Ranking closes {{date}}." },
      )
    : null;

  const handleRank = () => {
    if (typeof onRank === "function") {
      onRank(round.id);
    }
  };

  return (
    <Card aria-labelledby={`rank-action-title-${round.id}`}>
      <TitleRow>
        <Title id={`rank-action-title-${round.id}`}>{title}</Title>
        {statusChipLabel ? (
          <Chip
            shape="pill"
            label={statusChipLabel}
            ariaLabel={statusChipLabel}
            style={submitted ? SUBMITTED_CHIP_STYLE : DRAFT_CHIP_STYLE}
            leading={
              submitted ? (
                <CheckIcon width={16} height={16} aria-hidden />
              ) : (
                <EditDocumentIcon width={16} height={16} aria-hidden />
              )
            }
          />
        ) : null}
      </TitleRow>
      {helper ? <Helper>{helper}</Helper> : null}
      {dueLine ? <Due>{dueLine}</Due> : null}
      <Actions>
        <Button type="button" variant={buttonVariant} onClick={handleRank}>
          {ctaLabel}
        </Button>
      </Actions>
    </Card>
  );
}
