import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import {
  DEFAULT_PREFERENCE_WINDOW_CLOSE_TIME,
  DEFAULT_PREFERENCE_WINDOW_OPEN_TIME,
  DEFAULT_PREFERENCE_WINDOW_TIMEZONE,
  PREFERENCE_WINDOW_TIMEZONE_OPTIONS,
  ROUND_SCHEDULE_PHASES,
  SCHEDULE_PHASE_COPY_DEFAULTS,
} from "../../../../lib/connectRoundSettings";

const Section = styled.section`
  display: grid;
  gap: 12px;
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

const PhaseNote = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Primary-Dark, #336f8a);
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

const DateTimeRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 8px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
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

function TimelineDateField({ name, value, onChange, t }) {
  const label = t("opportunities.matchingRound.schedule.timelineDateLabel", {}, {
    default: "Timeline date",
  });
  const ariaLabel = t("opportunities.matchingRound.schedule.timelineDateAria", {}, {
    default: "Date shown on the student matching timeline",
  });

  return (
    <Control>
      <FieldLabel>{label}</FieldLabel>
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

function PreferenceWindowDateField({
  dateName,
  timeName,
  dateValue,
  timeValue,
  onChange,
  t,
  boundary,
}) {
  const isOpen = boundary === "open";
  const label = isOpen
    ? t("opportunities.matchingRound.schedule.preferenceWindowOpenLabel", {}, {
        default: "Ranking opens",
      })
    : t("opportunities.matchingRound.schedule.preferenceWindowCloseLabel", {}, {
        default: "Ranking closes",
      });
  const effect = isOpen
    ? t("opportunities.matchingRound.schedule.preferenceWindowOpenEffect", {}, {
        default: "Students can submit from this moment",
      })
    : t("opportunities.matchingRound.schedule.preferenceWindowCloseEffect", {}, {
        default: "Submissions close at this moment for everyone",
      });
  const ariaLabel = t(
    "opportunities.matchingRound.schedule.preferenceWindowDateAria",
    { label, effect },
    { default: "{{label}}. {{effect}}" },
  );
  const timeAria = t(
    "opportunities.matchingRound.schedule.preferenceWindowTimeAria",
    { label },
    { default: "{{label}} time" },
  );
  const defaultTime = isOpen
    ? DEFAULT_PREFERENCE_WINDOW_OPEN_TIME
    : DEFAULT_PREFERENCE_WINDOW_CLOSE_TIME;

  return (
    <Control>
      <FieldLabel>
        {label}
        <Chip
          variant="static"
          tone={isOpen ? "info" : "warning"}
          label={effect}
          ariaLabel={effect}
          truncate={false}
        />
      </FieldLabel>
      <DateTimeRow>
        <DateInput
          type="date"
          name={dateName}
          value={dateValue || ""}
          onChange={onChange}
          aria-label={ariaLabel}
        />
        <DateInput
          type="time"
          name={timeName}
          value={timeValue || defaultTime}
          onChange={onChange}
          aria-label={timeAria}
        />
      </DateTimeRow>
    </Control>
  );
}

function PreferenceWindowTimeZoneField({ value, onChange, t }) {
  const label = t(
    "opportunities.matchingRound.schedule.preferenceWindowTimeZoneLabel",
    {},
    { default: "Timezone for ranking open and close" },
  );
  const ariaLabel = t(
    "opportunities.matchingRound.schedule.preferenceWindowTimeZoneAria",
    {},
    {
      default:
        "Timezone used to interpret ranking open and close. All students close at the same instant.",
    },
  );

  return (
    <Control as="div">
      <FieldLabel id="preference-window-timezone-label">{label}</FieldLabel>
      <DropdownSelect
        value={value || DEFAULT_PREFERENCE_WINDOW_TIMEZONE}
        onChange={(next) =>
          onChange({
            target: {
              name: "preferenceWindowTimeZone",
              value: next,
              type: "text",
            },
          })
        }
        options={PREFERENCE_WINDOW_TIMEZONE_OPTIONS}
        ariaLabel={ariaLabel}
        searchableSingle
      />
    </Control>
  );
}

export default function MatchingRoundScheduleFields({
  inputs,
  onChange,
}) {
  const { t } = useTranslation("classes");

  return (
    <Section>
      <Heading>
        {t("opportunities.matchingRound.schedule.title", {}, {
          default: "Round schedule",
        })}
      </Heading>
      <Hint>
        {t("opportunities.matchingRound.schedule.hint", {}, {
          default:
            "Dates appear on the student matching timeline. Project selection open and close are a single shared deadline in the timezone you choose — every student locks at the same moment. Set round status to Preferences open separately; other dates do not change status automatically.",
        })}
      </Hint>

      {ROUND_SCHEDULE_PHASES.map((phase) => {
        const copy = phaseCopy(t, phase.key);
        const isRange = phase.kind === "range";
        const enforcesWindow = Boolean(phase.enforcesPreferenceWindow);

        return (
          <Phase key={phase.key}>
            <PhaseCopy>
              <PhaseTitle>{copy.title}</PhaseTitle>
              {copy.description ? (
                <PhaseDescription>{copy.description}</PhaseDescription>
              ) : null}
              {enforcesWindow ? (
                <PhaseNote>
                  {t("opportunities.matchingRound.schedule.selectionWindowNote", {}, {
                    default:
                      "Ranking submission is only allowed between these moments when the round status is Preferences open. Students can still browse opportunities before ranking opens.",
                  })}
                </PhaseNote>
              ) : null}
            </PhaseCopy>

            {isRange ? (
              <Fields>
                {enforcesWindow ? (
                  <>
                    <PreferenceWindowTimeZoneField
                      value={inputs.preferenceWindowTimeZone}
                      onChange={onChange}
                      t={t}
                    />
                    <PreferenceWindowDateField
                      dateName={phase.startAt}
                      timeName="openAtTime"
                      dateValue={inputs[phase.startAt]}
                      timeValue={inputs.openAtTime}
                      onChange={onChange}
                      t={t}
                      boundary="open"
                    />
                    <PreferenceWindowDateField
                      dateName={phase.endAt}
                      timeName="closeAtTime"
                      dateValue={inputs[phase.endAt]}
                      timeValue={inputs.closeAtTime}
                      onChange={onChange}
                      t={t}
                      boundary="close"
                    />
                  </>
                ) : (
                  <>
                    <TimelineDateField
                      name={phase.startAt}
                      value={inputs[phase.startAt]}
                      onChange={onChange}
                      t={t}
                    />
                    <TimelineDateField
                      name={phase.endAt}
                      value={inputs[phase.endAt]}
                      onChange={onChange}
                      t={t}
                    />
                  </>
                )}
              </Fields>
            ) : (
              <TimelineDateField
                name={phase.at}
                value={inputs[phase.at]}
                onChange={onChange}
                t={t}
              />
            )}
          </Phase>
        );
      })}
    </Section>
  );
}
