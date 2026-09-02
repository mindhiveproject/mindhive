import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../../DesignSystem/Button";
import {
  MATCHING_QUEUE_PROJECT_FIRST,
  MATCHING_QUEUE_TEAM_FIRST,
} from "../../../../../lib/connectPreferenceMatchingPreference";

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);

  &[aria-disabled="true"] {
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }
`;

const Title = styled.h3`
  margin: 0;
  font: var(--MH-Type-Title-Small, 600 16px/22px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Body = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  white-space: pre-line;
`;

const Note = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  white-space: pre-line;
`;

const RadioList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
  font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  cursor: pointer;

  &[data-disabled="true"] {
    cursor: default;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  input {
    margin-top: 4px;
    flex-shrink: 0;
  }
`;

const OptionCopy = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const OptionHelper = styled.span`
  font: var(--MH-Type-Body-Base, 400 14px/20px "Inter", sans-serif);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-start;
  padding-top: 4px;
`;

const CONFIRMED_COPY = {
  [MATCHING_QUEUE_TEAM_FIRST]: {
    classmates: {
      bodyDefault:
        "To maximize your chance to be matched together, ensure that ALL team members are ranking each other in their top spots (order does not matter here).",
      noteDefault:
        "Note: The number of top spots below is based on the largest team capacity among your favorited opportunities. This count may differ for your preferred classmates, but it will not impact matching as long as your preferred team occupies those top spots (including backups).",
    },
    opportunities: {
      bodyDefault:
        "To successfully match as a team, all of your team members MUST rank the exact same top opportunities in the EXACT SAME ORDER.",
      noteDefault:
        "Note: We strongly encourage ranking additional backup opportunities beyond your top choices. If your team's top preferences are unavailable, having shared backup rankings ensures your team stays together instead of being manually assigned.",
    },
  },
  [MATCHING_QUEUE_PROJECT_FIRST]: {
    classmates: {
      bodyDefault:
        "Your individual project preferences will take priority over classmate matching. You may still rank preferred classmates, but you will only be paired with them if your project rankings align.",
      noteDefault: "",
    },
    opportunities: {
      bodyDefault:
        "Rank opportunities strictly in order of your individual preference. Your project choices will take priority during matching regardless of what your classmates choose.",
      noteDefault:
        "Note: We strongly encourage ranking additional backup opportunities beyond your top choices. Adding backup projects ensures you are matched to a project you like if your top preferences reach capacity.",
    },
  },
};

export default function StudentMatchingPreferenceCard({
  tab = "classmates",
  selectedQueue = null,
  onSelect,
  savedQueue = null,
  isEditing = false,
  isOpen = true,
  saving = false,
  onConfirm,
  onStartChange,
}) {
  const { t } = useTranslation("classes");
  const ns = "opportunities.studentView.rankForm.matchingPreference";

  const teamFirstLabel = t(`${ns}.teamFirst`, {}, { default: "Team first" });
  const projectFirstLabel = t(`${ns}.projectFirst`, {}, {
    default: "Project first",
  });

  const hasSavedQueue = Boolean(savedQueue);
  const showForm = isOpen && (!hasSavedQueue || isEditing);
  const inputsDisabled = !showForm || saving || !isOpen;
  const showConfirmation = !showForm && hasSavedQueue;

  const handleConfirm = () => {
    if (!selectedQueue || !onConfirm) return;
    onConfirm(selectedQueue);
  };

  const confirmed = savedQueue ? CONFIRMED_COPY[savedQueue]?.[tab] : null;
  const choiceLabel =
    savedQueue === MATCHING_QUEUE_PROJECT_FIRST
      ? projectFirstLabel
      : teamFirstLabel;

  return (
    <Card aria-disabled={!showForm ? "true" : undefined}>
      {showForm ? (
        <>
          <Title>
            {t(`${ns}.question`, {}, {
              default:
                'Are you interested in ranking "Team first" or "Project first"?',
            })}
          </Title>
          <RadioList
            role="radiogroup"
            aria-label={t(`${ns}.question`, {}, {
              default:
                'Are you interested in ranking "Team first" or "Project first"?',
            })}
          >
            <RadioOption data-disabled={inputsDisabled ? "true" : undefined}>
              <input
                type="radio"
                name="studentMatchingPreference"
                value={MATCHING_QUEUE_TEAM_FIRST}
                checked={selectedQueue === MATCHING_QUEUE_TEAM_FIRST}
                disabled={inputsDisabled}
                onChange={() => onSelect?.(MATCHING_QUEUE_TEAM_FIRST)}
              />
              <OptionCopy>
                {teamFirstLabel}
                <OptionHelper>
                  {t(`${ns}.teamFirstHelper`, {}, {
                    default:
                      "Classmate rankings matter more. Matching will try to keep your preferred team together.",
                  })}
                </OptionHelper>
              </OptionCopy>
            </RadioOption>
            <RadioOption data-disabled={inputsDisabled ? "true" : undefined}>
              <input
                type="radio"
                name="studentMatchingPreference"
                value={MATCHING_QUEUE_PROJECT_FIRST}
                checked={selectedQueue === MATCHING_QUEUE_PROJECT_FIRST}
                disabled={inputsDisabled}
                onChange={() => onSelect?.(MATCHING_QUEUE_PROJECT_FIRST)}
              />
              <OptionCopy>
                {projectFirstLabel}
                <OptionHelper>
                  {t(`${ns}.projectFirstHelper`, {}, {
                    default:
                      "Opportunity rankings matter more. Classmate picks are used only when project ranks align.",
                  })}
                </OptionHelper>
              </OptionCopy>
            </RadioOption>
          </RadioList>
          <Actions>
            <Button
              type="button"
              variant="filled"
              onClick={handleConfirm}
              disabled={saving || !selectedQueue}
            >
              {saving
                ? t("opportunities.studentView.rankForm.saving", {}, {
                    default: "Saving…",
                  })
                : t(`${ns}.confirm`, {}, { default: "Save choice" })}
            </Button>
          </Actions>
        </>
      ) : showConfirmation ? (
        <>
          <Title>
            {t(`${ns}.selected`, { choice: choiceLabel }, {
              default: 'You have selected "{{choice}}".',
            })}
          </Title>
          {confirmed?.bodyDefault ? (
            <Body>
              {t(`${ns}.confirmed.${savedQueue === MATCHING_QUEUE_TEAM_FIRST ? "teamFirst" : "projectFirst"}.${tab}.body`, {}, {
                default: confirmed.bodyDefault,
              })}
            </Body>
          ) : null}
          {confirmed?.noteDefault ? (
            <Note>
              {t(`${ns}.confirmed.${savedQueue === MATCHING_QUEUE_TEAM_FIRST ? "teamFirst" : "projectFirst"}.${tab}.note`, {}, {
                default: confirmed.noteDefault,
              })}
            </Note>
          ) : null}
          <RadioList role="radiogroup" aria-disabled="true">
            <RadioOption data-disabled="true">
              <input
                type="radio"
                name="studentMatchingPreferenceSaved"
                value={MATCHING_QUEUE_TEAM_FIRST}
                checked={savedQueue === MATCHING_QUEUE_TEAM_FIRST}
                disabled
                readOnly
              />
              <OptionCopy>{teamFirstLabel}</OptionCopy>
            </RadioOption>
            <RadioOption data-disabled="true">
              <input
                type="radio"
                name="studentMatchingPreferenceSaved"
                value={MATCHING_QUEUE_PROJECT_FIRST}
                checked={savedQueue === MATCHING_QUEUE_PROJECT_FIRST}
                disabled
                readOnly
              />
              <OptionCopy>{projectFirstLabel}</OptionCopy>
            </RadioOption>
          </RadioList>
          {isOpen ? (
            <Actions>
              <Button
                type="button"
                variant="outline"
                onClick={onStartChange}
                disabled={saving}
              >
                {t(`${ns}.change`, {}, { default: "Change" })}
              </Button>
            </Actions>
          ) : null}
        </>
      ) : (
        <Title>
          {t(`${ns}.question`, {}, {
            default:
              'Are you interested in ranking "Team first" or "Project first"?',
          })}
        </Title>
      )}
    </Card>
  );
}
