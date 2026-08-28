import { useCallback, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import IconButton from "../../../../DesignSystem/IconButton";
import PanelHeader from "../../../../DesignSystem/PanelHeader";
import Popover from "../../../../DesignSystem/Popover";
import {
  CheckIcon,
  ClockIcon,
  EditDocumentIcon,
} from "../../../../DesignSystem/Icons";
import { visibleSchedulePhases } from "../../../../../lib/connectRoundSettings";
import MatchingRoundSchedule from "./MatchingRoundSchedule";

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
  font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Helper = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Due = styled.p`
  margin: 0;
  font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const TitleActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-start;
  padding-top: 4px;
`;

const SCHEDULE_BODY_STYLE = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  padding: "0 16px 16px",
  overflowY: "auto",
};

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
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const scheduleAnchorRef = useRef(null);

  const closeSchedule = useCallback(() => {
    setScheduleOpen(false);
    scheduleAnchorRef.current?.focus();
  }, []);

  const toggleSchedule = useCallback(() => {
    setScheduleOpen((wasOpen) => {
      if (wasOpen) scheduleAnchorRef.current?.focus();
      return !wasOpen;
    });
  }, []);

  if (!round?.id) return null;

  const hasSchedule = visibleSchedulePhases(round).length > 0;
  const scheduleTitle = t("opportunities.studentView.schedule.title", {}, {
    default: "Matching timeline",
  });
  const scheduleOpenLabel = t(
    "opportunities.studentView.schedule.openAria",
    {},
    { default: "View matching timeline" },
  );
  const scheduleCloseLabel = t(
    "opportunities.studentView.schedule.close",
    {},
    { default: "Close matching timeline" },
  );

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
        <TitleActions>
          {hasSchedule ? (
            <span ref={scheduleAnchorRef}>
              <IconButton
                variant="subtle"
                icon={<ClockIcon />}
                ariaLabel={scheduleOpenLabel}
                title={scheduleOpenLabel}
                aria-expanded={scheduleOpen}
                aria-haspopup="dialog"
                elevated={false}
                onClick={toggleSchedule}
              />
            </span>
          ) : null}
          {statusChipLabel ? (
            <Chip
              variant="static"
              tone={submitted ? "success" : "warning"}
              label={statusChipLabel}
              ariaLabel={statusChipLabel}
              leading={
                submitted ? (
                  <CheckIcon width={16} height={16} aria-hidden />
                ) : (
                  <EditDocumentIcon width={16} height={16} aria-hidden />
                )
              }
            />
          ) : null}
        </TitleActions>
      </TitleRow>
      {hasSchedule ? (
        <Popover
          open={scheduleOpen}
          anchorRef={scheduleAnchorRef}
          onClose={closeSchedule}
          side="bottom"
          align="end"
          width={420}
          ariaLabel={scheduleTitle}
        >
          <PanelHeader
            title={scheduleTitle}
            titleId={`matching-round-schedule-${round.id}`}
            onClose={closeSchedule}
            closeLabel={scheduleCloseLabel}
          />
          <div style={SCHEDULE_BODY_STYLE}>
            <MatchingRoundSchedule round={round} embedded />
          </div>
        </Popover>
      ) : null}
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
