import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import CompactActionButton from "../../DesignSystem/CompactActionButton";
import Chip from "../../DesignSystem/Chip";
import ButtonGroup from "../../DesignSystem/ButtonGroup";
import DropdownSelect from "../../DesignSystem/DropdownSelect";
import ToggleSwitch from "../../DesignSystem/ToggleSwitch";
import { AddIcon, DragIndicatorIcon, TrashIcon } from "../../DesignSystem/Icons";
import { TYPE_ICONS } from "./TypeIcons";
import { INTRO_VIDEO_FIELD_NAME } from "./questionUtils";
import {
  DragHandle,
  FieldStack,
  InsertRow,
  QuestionBlock,
  QuestionCard,
  QuestionCardHeader,
  TogglesRow,
  TypeOption,
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
    hintDefault: "Sponsors upload or pick multiple images, PDFs, documents, and ZIP files",
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
  onInsertBefore,
  canRemove,
  showInsertBefore = false,
  dragDisabled = false,
  introVideoTaken = false,
  hiddenTypeKeys = [],
}) {
  const { t } = useTranslation("classes");
  const typeKey = effectiveTypeKey(question.fieldType);
  const isOpen = typeKey === "text";
  const isIntroVideo = question.fieldType === "file";
  const needsOptions =
    question.fieldType === "select" || question.fieldType === "multiselect";
  const typeChosen = !!question.typeChosen;
  const visibleTypeKeys = TYPE_KEYS.filter(
    (type) => !hiddenTypeKeys.includes(type.value)
  );
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

  const dragLabel = t(
    "opportunities.matchingRound.formWizard.dragToReorder",
    {},
    { default: "Drag to reorder" },
  );
  const insertLabel = t(
    "opportunities.matchingRound.formWizard.insertQuestion",
    {},
    { default: "Insert question" },
  );
  const removeLabel = t(
    "opportunities.matchingRound.formWizard.removeQuestion",
    {},
    { default: "Remove" },
  );
  const typePickerLabel = t(
    "opportunities.matchingRound.formWizard.typePickerLabel",
    {},
    { default: "Question type" },
  );
  const pickTypeLabel = t(
    "opportunities.matchingRound.formWizard.pickType",
    {},
    { default: "Choose a question type" },
  );

  // One dropdown row instead of a grid of icon tiles: the icons move into the
  // option rows, which keeps each question card short.
  const typeOptions = visibleTypeKeys.map((type) => {
    const Icon = TYPE_ICONS[type.value];
    const label = t(type.labelKey, {}, { default: type.labelDefault });
    const hint = t(type.hintKey, {}, { default: type.hintDefault });
    const disabled = type.value === "file" && introVideoTaken && !isIntroVideo;
    return {
      value: type.value,
      labelText: label,
      disabled,
      label: (
        <TypeOption>
          {Icon ? <Icon className="type-option-icon" /> : null}
          <span className="type-option-text">
            <span className="type-option-label">{label}</span>
            <span className="type-option-hint">
              {disabled
                ? t(
                    "opportunities.matchingRound.formWizard.types.introVideoTaken",
                    {},
                    {
                      default:
                        "This form already has an intro video upload question.",
                    },
                  )
                : hint}
            </span>
          </span>
        </TypeOption>
      ),
    };
  });

  // Forms can carry field types the wizard does not offer (legacy global
  // review forms use `dual_textarea`). Surface the current type as a read-only
  // option so the trigger shows it instead of the "choose a type" placeholder.
  if (typeChosen && !typeOptions.some((option) => option.value === typeKey)) {
    const legacyLabel = typeLabelFor(question.fieldType, t);
    typeOptions.unshift({
      value: typeKey,
      labelText: legacyLabel,
      disabled: true,
      label: (
        <TypeOption>
          <span className="type-option-text">
            <span className="type-option-label">{legacyLabel}</span>
            <span className="type-option-hint">
              {t(
                "opportunities.matchingRound.formWizard.types.unsupported",
                {},
                { default: "Existing type — cannot be changed here." },
              )}
            </span>
          </span>
        </TypeOption>
      ),
    });
  }

  const SelectedIcon = typeChosen ? TYPE_ICONS[typeKey] : null;

  return (
    <QuestionBlock>
      {showInsertBefore ? (
        <InsertRow>
          <ButtonGroup
            size="XSmall"
            type="Round"
            // Action row, not a selection: the value stays empty so no segment
            // ever latches on after a click.
            selectionMode="multiple"
            selectionRequired={false}
            value={[]}
            disabled={dragDisabled}
            aria-label={insertLabel}
            items={[
              {
                value: "insert",
                label: insertLabel,
                icon: <AddIcon />,
              },
            ]}
            onChange={() => onInsertBefore()}
          />
        </InsertRow>
      ) : null}

      <QuestionCard>
        <QuestionCardHeader>
          <DragHandle
            className="question-drag-handle"
            aria-label={dragLabel}
            title={dragLabel}
            aria-disabled={dragDisabled ? "true" : undefined}
            role="button"
            tabIndex={dragDisabled ? -1 : 0}
          >
            <DragIndicatorIcon />
          </DragHandle>
          <div className="question-title-block">
            <strong>
              {t(
                "opportunities.matchingRound.formWizard.questionNumber",
                { number: index + 1 },
                { default: "Question {{number}}" },
              )}
            </strong>
          </div>
          <div className="question-type-select">
            <DropdownSelect
              value={typeChosen ? typeKey : undefined}
              onChange={setType}
              options={typeOptions}
              ariaLabel={typePickerLabel}
              placeholder={pickTypeLabel}
              leadingIcon={SelectedIcon ? <SelectedIcon /> : null}
            />
          </div>
          <div className="header-actions">
            {canRemove ? (
              <CompactActionButton
                kind="delete"
                icon={<TrashIcon />}
                onClick={onRemove}
                ariaLabel={removeLabel}
                title={removeLabel}
              />
            ) : null}
          </div>
        </QuestionCardHeader>

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
                onChange={(e) =>
                  onChange({ ...question, label: e.target.value })
                }
                placeholder={
                  isIntroVideo
                    ? t(
                        "opportunities.matchingRound.formWizard.introVideoPromptPlaceholder",
                        {},
                        {
                          default:
                            "e.g. Upload a short intro video for students",
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
                    style={{
                      font: "var(--MH-Type-Body-Base)",
                      letterSpacing: 0,
                      border:
                        "2px solid var(--MH-Theme-Neutrals-Light,#d3dae0)",
                    }}
                    leading={<p>–</p>}
                    onClick={() => {
                      onChange({ ...question, helperText: "" });
                      setHelperEditorOpen(false);
                    }}
                    label={t(
                      "opportunities.matchingRound.formWizard.helperTextRemove",
                      {},
                      { default: "Remove helper text" },
                    )}
                  />
                </div>
              </FieldStack>
            ) : (
              <div>
                <Chip
                  type="button"
                  style={{
                    font: "var(--MH-Type-Body-Base)",
                    letterSpacing: 0,
                    border: "2px solid var(--MH-Theme-Neutrals-Light,#d3dae0)",
                  }}
                  leading={<p>+</p>}
                  onClick={() => setHelperEditorOpen(true)}
                  label={t(
                    "opportunities.matchingRound.formWizard.helperTextAdd",
                    {},
                    { default: "Add helper text" },
                  )}
                />
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
                        "Sponsors upload an MP4 or WebM (max 100MB). This updates the opportunity’s intro video — no storage settings to configure.",
                    },
                  )}
                </span>
              </FieldStack>
            ) : null}

            {needsOptions ? (
              <FieldStack>
                <label>
                  {t(
                    "opportunities.matchingRound.formWizard.choicesLabel",
                    {},
                    { default: "Choices (one per line)" },
                  )}
                </label>
                <textarea
                  value={question.optionsText}
                  onChange={(e) =>
                    onChange({ ...question, optionsText: e.target.value })
                  }
                  placeholder={t(
                    "opportunities.matchingRound.formWizard.choicesPlaceholder",
                    {},
                    { default: "Yes\nMaybe\nNo" },
                  )}
                />
              </FieldStack>
            ) : null}

            <TogglesRow>
              {isOpen ? (
                <ToggleSwitch
                  checked={question.fieldType === "textarea"}
                  onChange={(next) =>
                    onChange({
                      ...question,
                      fieldType: next ? "textarea" : "text",
                    })
                  }
                  label={t(
                    "opportunities.matchingRound.formWizard.longAnswer",
                    {},
                    { default: "Long answer" },
                  )}
                />
              ) : null}
              <ToggleSwitch
                checked={!!question.isRequired}
                onChange={(next) =>
                  onChange({ ...question, isRequired: next })
                }
                label={t(
                  "opportunities.matchingRound.formWizard.required",
                  {},
                  { default: "Required" },
                )}
              />
            </TogglesRow>
          </>
        ) : null}
      </QuestionCard>
    </QuestionBlock>
  );
}
