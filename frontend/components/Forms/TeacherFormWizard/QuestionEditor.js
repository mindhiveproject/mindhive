import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import { TYPE_ICONS } from "./TypeIcons";
import { INTRO_VIDEO_FIELD_NAME } from "./questionUtils";
import {
  CheckboxRow,
  FieldStack,
  QuestionCard,
  QuestionCardHeader,
  QuestionSummary,
  TypePicker,
  TypeTile,
} from "./styles";

function hasNonEmptyHelperText(helperText) {
  return Boolean(String(helperText || "").trim());
}

export const TYPE_KEYS = [
  {
    value: "text",
    labelKey: "opportunities.matchingRound.formWizard.types.open",
    labelDefault: "Open answer",
    hintKey: "opportunities.matchingRound.formWizard.types.openHint",
    hintDefault: "Short or long text",
  },
  {
    value: "select",
    labelKey: "opportunities.matchingRound.formWizard.types.pickOne",
    labelDefault: "Pick one",
    hintKey: "opportunities.matchingRound.formWizard.types.pickOneHint",
    hintDefault: "Single choice",
  },
  {
    value: "multiselect",
    labelKey: "opportunities.matchingRound.formWizard.types.pickMany",
    labelDefault: "Pick many",
    hintKey: "opportunities.matchingRound.formWizard.types.pickManyHint",
    hintDefault: "Multiple choices",
  },
  {
    value: "task_selector",
    labelKey: "opportunities.matchingRound.formWizard.types.tasks",
    labelDefault: "Public tasks & surveys",
    hintKey: "opportunities.matchingRound.formWizard.types.tasksHint",
    hintDefault: "Sponsors pick from the public library",
  },
  {
    value: "file",
    labelKey: "opportunities.matchingRound.formWizard.types.introVideo",
    labelDefault: "Intro video upload",
    hintKey: "opportunities.matchingRound.formWizard.types.introVideoHint",
    hintDefault: "Sponsors upload an MP4 / WebM intro video",
  },
  {
    value: "link_list",
    labelKey: "opportunities.matchingRound.formWizard.types.links",
    labelDefault: "Links",
    hintKey: "opportunities.matchingRound.formWizard.types.linksHint",
    hintDefault: "Sponsors add multiple external links",
  },
  {
    value: "media_asset_list",
    labelKey: "opportunities.matchingRound.formWizard.types.mediaList",
    labelDefault: "Media",
    hintKey: "opportunities.matchingRound.formWizard.types.mediaListHint",
    hintDefault: "Sponsors upload or pick multiple images/PDFs",
  },
];

export const REVIEW_HIDDEN_TYPE_KEYS = [
  "file",
  "link_list",
  "media_asset_list",
];

export function effectiveTypeKey(fieldType) {
  if (fieldType === "textarea") return "text";
  return fieldType;
}

export function typeLabelFor(fieldType, t) {
  const typeKey = effectiveTypeKey(fieldType);
  const match = TYPE_KEYS.find((k) => k.value === typeKey);
  if (!match) return typeKey;
  return t(match.labelKey, {}, { default: match.labelDefault });
}

export default function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
  canRemove,
  expanded,
  onExpand,
  onCollapse,
  introVideoTaken = false,
  hiddenTypeKeys = [],
}) {
  const { t } = useTranslation("classes");
  const typeKey = effectiveTypeKey(question.fieldType);
  const isOpen = typeKey === "text";
  const isIntroVideo = question.fieldType === "file";
  const needsOptions =
    question.fieldType === "select" || question.fieldType === "multiselect";
  const typeLabel = typeLabelFor(question.fieldType, t);
  const typeChosen = !!question.typeChosen;
  const visibleTypeKeys = TYPE_KEYS.filter(
    (type) => !hiddenTypeKeys.includes(type.value)
  );
  const promptSummary =
    String(question.label || "").trim() ||
    t("opportunities.matchingRound.formWizard.promptEmpty", {}, {
      default: "No prompt yet",
    });
  // Opt-in: helper textarea stays hidden until Add, or when existing text is loaded.
  const [helperEditorOpen, setHelperEditorOpen] = useState(() =>
    hasNonEmptyHelperText(question.helperText),
  );
  useEffect(() => {
    setHelperEditorOpen(hasNonEmptyHelperText(question.helperText));
  }, [question.localId]);

  const setType = (next) => {
    if (next === "file" && introVideoTaken && !isIntroVideo) {
      return;
    }
    if (next === "text") {
      onChange({
        ...question,
        fieldType: question.fieldType === "textarea" ? "textarea" : "text",
        name: null,
        typeChosen: true,
      });
      return;
    }
    onChange({
      ...question,
      fieldType: next,
      // Fixed machine name for the managed Opportunity.videoFile column.
      name: next === "file" ? INTRO_VIDEO_FIELD_NAME : null,
      typeChosen: true,
    });
  };

  if (!expanded) {
    return (
      <QuestionCard $collapsed>
        <QuestionSummary>
          <button
            type="button"
            className="summary-main"
            onClick={onExpand}
            aria-expanded={false}
          >
            <strong>
              {t("opportunities.matchingRound.formWizard.questionNumber", { number: index + 1 }, {
                default: "Question {{number}}",
              })}
            </strong>
            <span className="summary-type">{typeLabel}</span>
            <span className="summary-prompt">{promptSummary}</span>
          </button>
          <div className="summary-actions">
            <Button type="button" variant="text" onClick={onExpand}>
              {t("opportunities.matchingRound.formWizard.editQuestion", {}, {
                default: "Edit",
              })}
            </Button>
            {canRemove ? (
              <Button type="button" variant="text" onClick={onRemove}>
                {t("opportunities.matchingRound.formWizard.removeQuestion", {}, {
                  default: "Remove",
                })}
              </Button>
            ) : null}
          </div>
        </QuestionSummary>
      </QuestionCard>
    );
  }

  return (
    <QuestionCard>
      <QuestionCardHeader>
        <div>
          <strong>
            {t("opportunities.matchingRound.formWizard.questionNumber", { number: index + 1 }, {
              default: "Question {{number}}",
            })}
          </strong>
          {typeChosen ? (
            <div className="question-meta">{typeLabel}</div>
          ) : (
            <div className="question-meta">
              {t("opportunities.matchingRound.formWizard.pickType", {}, {
                default: "Choose a question type",
              })}
            </div>
          )}
        </div>
        <div className="header-actions">
          <Button type="button" variant="text" onClick={onCollapse}>
            {t("opportunities.matchingRound.formWizard.doneEditing", {}, {
              default: "Done",
            })}
          </Button>
          {canRemove ? (
            <Button type="button" variant="text" onClick={onRemove}>
              {t("opportunities.matchingRound.formWizard.removeQuestion", {}, {
                default: "Remove",
              })}
            </Button>
          ) : null}
        </div>
      </QuestionCardHeader>

      <TypePicker
        $compact={typeChosen}
        role="group"
        aria-label={t("opportunities.matchingRound.formWizard.typePickerLabel", {}, {
          default: "Question type",
        })}
      >
        {visibleTypeKeys.map((type) => {
          const Icon = TYPE_ICONS[type.value];
          const active = typeChosen && typeKey === type.value;
          const label = t(type.labelKey, {}, { default: type.labelDefault });
          const hint = t(type.hintKey, {}, { default: type.hintDefault });
          const disabled =
            type.value === "file" && introVideoTaken && !isIntroVideo;
          const disabledHint = disabled
            ? t(
                "opportunities.matchingRound.formWizard.types.introVideoTaken",
                {},
                {
                  default:
                    "This form already has an intro video upload question.",
                },
              )
            : hint;
          return (
            <TypeTile
              key={type.value}
              type="button"
              $compact={typeChosen}
              $active={active}
              className={clsx(active && "active")}
              onClick={() => setType(type.value)}
              disabled={disabled}
              title={typeChosen ? `${label} — ${disabledHint}` : disabledHint}
              aria-pressed={active}
              aria-label={label}
              aria-disabled={disabled}
            >
              {Icon ? <Icon className="type-icon" /> : null}
              {!typeChosen ? (
                <>
                  <span className="type-label">{label}</span>
                  <span className="type-hint">{disabledHint}</span>
                </>
              ) : null}
            </TypeTile>
          );
        })}
      </TypePicker>

      {typeChosen ? (
        <>
          <FieldStack>
            <label>
              {t("opportunities.matchingRound.formWizard.promptLabel", {}, {
                default: "Question prompt",
              })}
            </label>
            <input
              type="text"
              value={question.label}
              onChange={(e) => onChange({ ...question, label: e.target.value })}
              placeholder={
                isIntroVideo
                  ? t(
                      "opportunities.matchingRound.formWizard.introVideoPromptPlaceholder",
                      {},
                      {
                        default: "e.g. Upload a short intro video for students",
                      },
                    )
                  : t(
                      "opportunities.matchingRound.formWizard.promptPlaceholder",
                      {},
                      {
                        default: "What do you want to ask?",
                      },
                    )
              }
            />
          </FieldStack>
          {helperEditorOpen ? (
            <FieldStack>
              <label>
                {t(
                  "opportunities.matchingRound.formWizard.helperTextLabel",
                  {},
                  { default: "Helper text" },
                )}
              </label>
              <textarea
                value={question.helperText || ""}
                onChange={(e) =>
                  onChange({ ...question, helperText: e.target.value })
                }
                placeholder={t(
                  "opportunities.matchingRound.formWizard.helperTextPlaceholder",
                  {},
                  {
                    default: "Extra guidance shown under the question",
                  },
                )}
              />
              <div>
                <Chip
                  type="button"
                  shape="square"
                  style={{fontWeight:"400", fontSize:"12px", border:"2px solid var(--MH-Theme-Neutrals-Light,#d3dae0)"}}
                  leading={<p>–</p>}
                  onClick={() => {
                    onChange({ ...question, helperText: "" });
                    setHelperEditorOpen(false);
                  }}
                  label=
                    {t(
                      "opportunities.matchingRound.formWizard.helperTextRemove",
                      {},
                      { default: "Remove helper text" },
                    )}
                >
                </Chip>
              </div>
            </FieldStack>
          ) : (
            <div>
              <Chip
                type="button"
                shape="square"
                style={{fontWeight:"400", fontSize:"12px", border:"2px solid var(--MH-Theme-Neutrals-Light,#d3dae0)"}}
                leading={<p>+</p>}
                onClick={() => setHelperEditorOpen(true)}
                label={t(
                  "opportunities.matchingRound.formWizard.helperTextAdd",
                  {},
                  { default: "Add helper text" },
                )}
              >
              </Chip>
            </div>
          )}
          {isIntroVideo ? (
            <FieldStack>
              <span className="field-hint">
                {t(
                  "opportunities.matchingRound.formWizard.introVideoHelper",
                  {},
                  {
                    default:
                      "Sponsors upload an MP4 or WebM (max 500MB). This updates the opportunity’s intro video — no storage settings to configure.",
                  },
                )}
              </span>
            </FieldStack>
          ) : null}

          {isOpen ? (
            <CheckboxRow>
              <input
                type="checkbox"
                checked={question.fieldType === "textarea"}
                onChange={(e) =>
                  onChange({
                    ...question,
                    fieldType: e.target.checked ? "textarea" : "text",
                  })
                }
              />
              {t("opportunities.matchingRound.formWizard.longAnswer", {}, {
                default: "Long answer",
              })}
            </CheckboxRow>
          ) : null}

          {needsOptions ? (
            <FieldStack>
              <label>
                {t("opportunities.matchingRound.formWizard.choicesLabel", {}, {
                  default: "Choices (one per line)",
                })}
              </label>
              <textarea
                value={question.optionsText}
                onChange={(e) =>
                  onChange({ ...question, optionsText: e.target.value })
                }
                placeholder={t("opportunities.matchingRound.formWizard.choicesPlaceholder", {}, {
                  default: "Yes\nMaybe\nNo",
                })}
              />
            </FieldStack>
          ) : null}

          <CheckboxRow>
            <input
              type="checkbox"
              checked={!!question.isRequired}
              onChange={(e) =>
                onChange({ ...question, isRequired: e.target.checked })
              }
            />
            {t("opportunities.matchingRound.formWizard.required", {}, {
              default: "Required",
            })}
          </CheckboxRow>
        </>
      ) : null}
    </QuestionCard>
  );
}
