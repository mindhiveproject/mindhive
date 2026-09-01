import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import {
  SCHEDULE_PHASE_COPY_DEFAULTS,
  visibleSchedulePhases,
} from "../../../../../lib/connectRoundSettings";

const Card = styled.section`
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

const Title = styled.h2`
  margin: 0;
  font: var(--MH-Type-Title-Large);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const List = styled.ol`
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Item = styled.li`
  display: grid;
  gap: 4px;
  padding: 12px;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
`;

const DateLine = styled.p`
  margin: 0;
  font: var(--MH-Type-Label-Base);
  color: var(--MH-Theme-Primary-Dark, #336f8a);
`;

const PhaseTitle = styled.p`
  margin: 0;
  font: var(--MH-Type-Title-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Description = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

function MatchingRoundScheduleList({ phases, t }) {
  return (
    <List>
      {phases.map((phase) => {
        const defaults = SCHEDULE_PHASE_COPY_DEFAULTS[phase.key] || {};
        const title = t(
          `opportunities.matchingRound.schedule.${phase.key}.title`,
          {},
          { default: defaults.title || phase.key },
        );
        const description = t(
          `opportunities.matchingRound.schedule.${phase.key}.description`,
          {},
          { default: defaults.description || "" },
        );
        return (
          <Item key={phase.key}>
            {phase.dateLabel ? <DateLine>{phase.dateLabel}</DateLine> : null}
            <PhaseTitle>{title}</PhaseTitle>
            {description ? <Description>{description}</Description> : null}
          </Item>
        );
      })}
    </List>
  );
}

/**
 * Student-facing matching-round timeline. Only phases with saved dates render.
 * @param {boolean} [embedded=false] - List only, for use inside a Popover body.
 */
export default function MatchingRoundSchedule({ round, embedded = false }) {
  const { t } = useTranslation("classes");
  const phases = visibleSchedulePhases(round);

  if (!round?.id || phases.length === 0) return null;

  const list = <MatchingRoundScheduleList phases={phases} t={t} />;

  if (embedded) return list;

  return (
    <Card aria-labelledby={`matching-round-schedule-${round.id}`}>
      <Title id={`matching-round-schedule-${round.id}`}>
        {t("opportunities.studentView.schedule.title", {}, {
          default: "Matching timeline",
        })}
      </Title>
      {list}
    </Card>
  );
}
