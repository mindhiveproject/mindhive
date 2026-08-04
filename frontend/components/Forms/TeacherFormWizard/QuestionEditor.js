import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";

import Button from "../../DesignSystem/Button";
import { TYPE_ICONS } from "./TypeIcons";
import {
  CheckboxRow,
  FieldStack,
  QuestionCard,
  QuestionCardHeader,
  QuestionSummary,
  TypePicker,
  TypeTile,
} from "./styles";

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
}) {
  const { t } = useTranslation("classes");
  const typeKey = effectiveTypeKey(question.fieldType);
  const isOpen = typeKey === "text";
  const needsOptions =
    question.fieldType === "select" || question.fieldType === "multiselect";
  const typeLabel = typeLabelFor(question.fieldType, t);
  const typeChosen = !!question.typeChosen;
  const promptSummary =
    String(question.label || "").trim() ||
    t("opportunities.matchingRound.formWizard.promptEmpty", {}, {
      default: "No prompt yet",
    });

  const setType = (next) => {
    if (next === "text") {
      onChange({
        ...question,
        fieldType: question.fieldType === "textarea" ? "textarea" : "text",
        typeChosen: true,
      });
      return;
    }
    onChange({ ...question, fieldType: next, typeChosen: true });
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
        {TYPE_KEYS.map((type) => {
          const Icon = TYPE_ICONS[type.value];
          const active = typeChosen && typeKey === type.value;
          const label = t(type.labelKey, {}, { default: type.labelDefault });
          const hint = t(type.hintKey, {}, { default: type.hintDefault });
          return (
            <TypeTile
              key={type.value}
              type="button"
              $compact={typeChosen}
              $active={active}
              className={clsx(active && "active")}
              onClick={() => setType(type.value)}
              title={typeChosen ? `${label} — ${hint}` : hint}
              aria-pressed={active}
              aria-label={label}
            >
              {Icon ? <Icon className="type-icon" /> : null}
              {!typeChosen ? (
                <>
                  <span className="type-label">{label}</span>
                  <span className="type-hint">{hint}</span>
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
              placeholder={t("opportunities.matchingRound.formWizard.promptPlaceholder", {}, {
                default: "What do you want to ask?",
              })}
            />
          </FieldStack>

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
