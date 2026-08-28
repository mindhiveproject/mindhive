import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../DesignSystem/Chip";
import {
  ROUND_SCHEDULE_PHASES,
  ROUND_STATUS_I18N_KEYS,
  SCHEDULE_MATCH_STATUS_DEFAULTS,
  SCHEDULE_OBJECT_LABEL_DEFAULTS,
  SCHEDULE_PHASE_COPY_DEFAULTS,
} from "../../../../lib/connectRoundSettings";

const SCHEDULE_DATE_MODE = {
  informative: "informative",
  executive: "executive",
};

const Section = styled.section`
  display: grid;
  gap: 12px;
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
`;

const ModeFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const Heading = styled.h3`
  margin: 0;
  font: var(--MH-Type-Title-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Hint = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Phase = styled.div`
  display: grid;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const PhaseCopy = styled.div`
  display: grid;
  gap: 4px;
`;

const PhaseTitle = styled.p`
  margin: 0;
  font: var(--MH-Type-Label-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const PhaseDescription = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Fields = styled.div`
  display: grid;
  gap: 12px;
`;

const Control = styled.label`
  display: grid;
  align-content: start;
  gap: 6px;
  min-width: 0;
`;

const FieldLabel = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font: var(--MH-Type-Label-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const DateInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Label-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  outline: none;
  box-sizing: border-box;

  &:focus-visible {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

const STATUS_TONE = {
  preferences_open: "info",
  preferences_closed: "warning",
  matching: "info",
  published: "success",
  active: "success",
};

function phaseCopy(t, key) {
  const defaults = SCHEDULE_PHASE_COPY_DEFAULTS[key] || {};
  return {
    title: t(
      `opportunities.matchingRound.schedule.${key}.title`,
      {},
      { default: defaults.title || key },
    ),
    description: t(
      `opportunities.matchingRound.schedule.${key}.description`,
      {},
      { default: defaults.description || "" },
    ),
  };
}

function objectLabel(t, objectKey) {
  return t(
    `opportunities.matchingRound.schedule.objects.${objectKey}`,
    {},
    { default: SCHEDULE_OBJECT_LABEL_DEFAULTS[objectKey] || objectKey },
  );
}

function statusLabel(t, objectKey, status) {
  if (!status) {
    return t("opportunities.matchingRound.schedule.noStatusChange", {}, {
      default: "No status change",
    });
  }
  if (objectKey === "connectMatch") {
    return t(
      `opportunities.matchingRound.schedule.matchStatus.${status}`,
      {},
      { default: SCHEDULE_MATCH_STATUS_DEFAULTS[status] || status },
    );
  }
  const i18nKey = ROUND_STATUS_I18N_KEYS[status];
  return t(
    `opportunities.matchingRound.status.${i18nKey || status}`,
    {},
    { default: status },
  );
}

function DateField({ name, value, onChange, t, objectKey, status }) {
  const object = objectLabel(t, objectKey);
  const statusText = statusLabel(t, objectKey, status);
  const prefix = t(
    "opportunities.matchingRound.schedule.effectPrefix",
    { object },
    { default: "{{object}} →" },
  );
  const ariaLabel = t(
    "opportunities.matchingRound.schedule.effectAria",
    { object, status: statusText },
    { default: "{{object}} → {{status}}" },
  );

  return (
    <Control>
      <FieldLabel>
        {prefix}
        <Chip
          variant="static"
          tone={status ? STATUS_TONE[status] || "neutral" : "neutral"}
          label={statusText}
          ariaLabel={statusText}
          truncate={false}
        />
      </FieldLabel>
      <DateInput
        type="date"
        name={name}
        value={value || ""}
        onChange={onChange}
        aria-label={ariaLabel}
      />
    </Control>
  );
}

export default function MatchingRoundScheduleFields({
  inputs,
  onChange,
}) {
  const { t } = useTranslation("classes");
  const dateMode = SCHEDULE_DATE_MODE.informative;
  const informativeLabel = t(
    "opportunities.matchingRound.schedule.informative",
    {},
    { default: "Informative" },
  );
  const executiveLabel = t(
    "opportunities.matchingRound.schedule.executive",
    {},
    { default: "Executive" },
  );
  const executiveUnavailable = t(
    "opportunities.matchingRound.schedule.executiveUnavailable",
    {},
    { default: "Executive dates are not available yet" },
  );

  return (
    <Section>
      <Header>
        <Heading>
          {t("opportunities.matchingRound.schedule.title", {}, {
            default: "Round schedule",
          })}
        </Heading>
        <ModeFilters
          role="group"
          aria-label={t("opportunities.matchingRound.schedule.modeLabel", {}, {
            default: "Date mode",
          })}
        >
          <Chip
            label={informativeLabel}
            selected={dateMode === SCHEDULE_DATE_MODE.informative}
            pressed={dateMode === SCHEDULE_DATE_MODE.informative}
            onClick={() => {}}
            truncate={false}
            ariaLabel={informativeLabel}
          />
          <span title={executiveUnavailable}>
            <Chip
              label={executiveLabel}
              disabled
              truncate={false}
              ariaLabel={executiveUnavailable}
            />
          </span>
        </ModeFilters>
      </Header>
      <Hint>
        {t("opportunities.matchingRound.schedule.hint", {}, {
          default:
            "Each date is tied to an object and status. When that date is reached, that status applies.",
        })}
      </Hint>

      {ROUND_SCHEDULE_PHASES.map((phase) => {
        const copy = phaseCopy(t, phase.key);
        const isRange = phase.kind === "range";
        return (
          <Phase key={phase.key}>
            <PhaseCopy>
              <PhaseTitle>{copy.title}</PhaseTitle>
              {copy.description ? (
                <PhaseDescription>{copy.description}</PhaseDescription>
              ) : null}
            </PhaseCopy>

            {isRange ? (
              <Fields>
                <DateField
                  name={phase.startAt}
                  value={inputs[phase.startAt]}
                  onChange={onChange}
                  t={t}
                  objectKey={phase.object}
                  status={phase.startStatus}
                />
                <DateField
                  name={phase.endAt}
                  value={inputs[phase.endAt]}
                  onChange={onChange}
                  t={t}
                  objectKey={phase.object}
                  status={phase.endStatus}
                />
              </Fields>
            ) : (
              <DateField
                name={phase.at}
                value={inputs[phase.at]}
                onChange={onChange}
                t={t}
                objectKey={phase.object}
                status={phase.status}
              />
            )}
          </Phase>
        );
      })}
    </Section>
  );
}
