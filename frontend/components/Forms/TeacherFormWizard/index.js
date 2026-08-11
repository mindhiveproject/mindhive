import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Modal from "../../DesignSystem/Modal";
import CardRenderer from "../DefinitionForm/CardRenderer";
import {
  CLONE_FORM_DEFINITION_FOR_CLASS,
  SAVE_CLASS_FORM_DEFINITION,
} from "../../Mutations/FormDefinition";
import { FORM_DEFINITION_BY_ID } from "../../Queries/FormDefinition";
import ClonePublicFormPicker from "./ClonePublicFormPicker";
import QuestionEditor from "./QuestionEditor";
import {
  buildPreviewDefinition,
  createBlankQuestion,
  isIntroVideoQuestion,
  questionsFromDefinition,
  questionsToMutationFields,
} from "./questionUtils";
import {
  EditorColumn,
  ErrorText,
  InlineDescription,
  InlineTitle,
  MetaActions,
  MetaHeader,
  PreviewPane,
  QuestionList,
  Split,
  StepMeta,
  WizardBody,
} from "./styles";

export default function TeacherFormWizard({
  open,
  onClose,
  classId,
  definitionId: initialDefinitionId = null,
  onSaved,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const locale = router?.locale || "en-us";

  const [definitionId, setDefinitionId] = useState(initialDefinitionId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([createBlankQuestion()]);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [showClone, setShowClone] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: existingData, loading: loadingExisting } = useQuery(
    FORM_DEFINITION_BY_ID,
    {
      variables: { id: initialDefinitionId },
      skip: !open || !initialDefinitionId,
      fetchPolicy: "network-only",
    }
  );

  const [saveClassForm] = useMutation(SAVE_CLASS_FORM_DEFINITION);
  const [cloneForClass] = useMutation(CLONE_FORM_DEFINITION_FOR_CLASS);

  const resetBlank = useCallback(() => {
    const first = createBlankQuestion();
    setDefinitionId(null);
    setTitle("");
    setDescription("");
    setQuestions([first]);
    setExpandedQuestionId(first.localId);
    setShowClone(false);
    setError(null);
    setSaving(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (initialDefinitionId) {
      setDefinitionId(initialDefinitionId);
      return;
    }
    resetBlank();
  }, [open, initialDefinitionId, resetBlank]);

  useEffect(() => {
    if (!open || !initialDefinitionId) return;
    const definition = existingData?.formDefinition;
    if (!definition) return;
    const nextQuestions = questionsFromDefinition(definition);
    setDefinitionId(definition.id);
    setTitle(definition.title || "");
    setDescription(definition.description || "");
    setQuestions(nextQuestions);
    setExpandedQuestionId(nextQuestions[0]?.localId || null);
    setShowClone(false);
    setError(null);
  }, [open, initialDefinitionId, existingData?.formDefinition]);

  const previewDefinition = useMemo(
    () =>
      buildPreviewDefinition({
        title,
        description,
        questions: questions.filter((q) => q.typeChosen),
      }),
    [title, description, questions]
  );

  const introVideoTaken = useMemo(
    () => questions.some((q) => q.typeChosen && isIntroVideoQuestion(q)),
    [questions]
  );

  const validateName = () => {
    if (!title.trim()) {
      setError(
        t("opportunities.matchingRound.formWizard.errors.titleRequired", {}, {
          default: "Give your form a title.",
        })
      );
      return false;
    }
    setError(null);
    return true;
  };

  const validateQuestions = () => {
    const chosen = questions.filter((q) => q.typeChosen);
    if (!chosen.length) {
      setError(
        t("opportunities.matchingRound.formWizard.errors.needQuestion", {}, {
          default: "Add at least one question.",
        })
      );
      return false;
    }
    for (let i = 0; i < chosen.length; i += 1) {
      const q = chosen[i];
      const number = questions.indexOf(q) + 1;
      if (!String(q.label || "").trim()) {
        setError(
          t("opportunities.matchingRound.formWizard.errors.promptRequired", {
            number,
          }, {
            default: "Question {{number}} needs a prompt.",
          })
        );
        return false;
      }
      if (
        (q.fieldType === "select" || q.fieldType === "multiselect") &&
        !String(q.optionsText || "").trim()
      ) {
        setError(
          t("opportunities.matchingRound.formWizard.errors.choicesRequired", {
            number,
          }, {
            default: "Question {{number}} needs at least one choice.",
          })
        );
        return false;
      }
    }
    const introVideoCount = chosen.filter((q) => isIntroVideoQuestion(q)).length;
    if (introVideoCount > 1) {
      setError(
        t(
          "opportunities.matchingRound.formWizard.errors.introVideoOnce",
          {},
          {
            default:
              "Only one intro video upload question is allowed per form.",
          },
        ),
      );
      return false;
    }
    setError(null);
    return true;
  };

  const handleBackFromClone = () => {
    setError(null);
    setShowClone(false);
  };

  const persist = async ({ publish }) => {
    if (!classId) {
      setError(
        t("opportunities.matchingRound.formWizard.errors.missingClass", {}, {
          default: "Missing class context.",
        })
      );
      return;
    }
    if (!validateName() || !validateQuestions()) return;

    setSaving(true);
    setError(null);
    try {
      const result = await saveClassForm({
        variables: {
          input: {
            classId,
            definitionId: definitionId || undefined,
            title: title.trim(),
            description: description.trim(),
            fields: questionsToMutationFields(
              questions.filter((q) => q.typeChosen)
            ),
            publish: !!publish,
          },
        },
      });
      const saved = result?.data?.saveClassFormDefinition;
      if (!saved?.id) {
        throw new Error("Save failed");
      }
      setDefinitionId(saved.id);
      onSaved?.(saved);
      onClose?.();
      resetBlank();
    } catch (err) {
      setError(
        err?.message ||
          t("opportunities.matchingRound.formWizard.errors.saveFailed", {}, {
            default: "Could not save the form. Please try again.",
          })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClone = async (publicForm) => {
    if (!classId || !publicForm?.id) return;
    setSaving(true);
    setError(null);
    try {
      const result = await cloneForClass({
        variables: { sourceId: publicForm.id, classId },
      });
      const cloned = result?.data?.cloneFormDefinitionForClass;
      if (!cloned?.id) throw new Error("Clone failed");
      setDefinitionId(cloned.id);
      setTitle(cloned.title || "");
      setDescription(cloned.description || "");
      const clonedQuestions = questionsFromDefinition(cloned);
      setQuestions(clonedQuestions);
      setExpandedQuestionId(clonedQuestions[0]?.localId || null);
      setShowClone(false);
    } catch (err) {
      setError(
        err?.message ||
          t("opportunities.matchingRound.formWizard.errors.cloneFailed", {}, {
            default: "Could not copy that form. Please try again.",
          })
      );
    } finally {
      setSaving(false);
    }
  };

  const titleText = showClone
    ? t("opportunities.matchingRound.formWizard.cloneTitle", {}, {
        default: "Start from a public form",
      })
    : t("opportunities.matchingRound.formWizard.title", {}, {
        default: "Create a questionnaire",
      });

  const actions = showClone ? (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleBackFromClone}
        disabled={saving}
      >
        {t("opportunities.matchingRound.formWizard.back", {}, { default: "Back" })}
      </Button>
    </>
  ) : (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
        {t("opportunities.matchingRound.formWizard.cancel", {}, { default: "Cancel" })}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => persist({ publish: false })}
        disabled={saving}
      >
        {t("opportunities.matchingRound.formWizard.saveDraft", {}, {
          default: "Save as draft",
        })}
      </Button>
      <Button
        type="button"
        variant="filled"
        onClick={() => persist({ publish: true })}
        disabled={saving}
      >
        {t("opportunities.matchingRound.formWizard.publish", {}, {
          default: "Publish form",
        })}
      </Button>
    </>
  );

  const hasPreviewCards = (previewDefinition.cards || []).some(
    (card) => (card.fields || []).length > 0
  );

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={titleText}
      maxWidth={1120}
      maxHeight="92vh"
      height="92vh"
      size="large"
      actions={actions}
      bodyStyle={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
      }}
    >
      <WizardBody>
        {loadingExisting && initialDefinitionId ? (
          <StepMeta>
            {t("opportunities.matchingRound.formWizard.loading", {}, {
              default: "Loading form…",
            })}
          </StepMeta>
        ) : null}

        {showClone ? (
          <>
            <StepMeta>
              {t("opportunities.matchingRound.formWizard.cloneHint", {}, {
                default:
                  "Copy a published public questionnaire into your class, then edit it.",
              })}
            </StepMeta>
            <ClonePublicFormPicker onPick={handleClone} disabled={saving} />
          </>
        ) : (
          <>
            <MetaHeader>
              <InlineTitle
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-label={t(
                  "opportunities.matchingRound.formWizard.nameLabel",
                  {},
                  { default: "What’s this form for?" },
                )}
                placeholder={t(
                  "opportunities.matchingRound.formWizard.namePlaceholder",
                  {},
                  { default: "e.g. Sponsor visit follow-up" },
                )}
              />
              <InlineDescription
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                aria-label={t(
                  "opportunities.matchingRound.formWizard.descriptionLabel",
                  {},
                  { default: "Optional note for sponsors" },
                )}
                placeholder={t(
                  "opportunities.matchingRound.formWizard.descriptionPlaceholder",
                  {},
                  {
                    default: "Shown at the top of the form. Keep it short.",
                  },
                )}
              />
              {!initialDefinitionId ? (
                <MetaActions>
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => {
                      setError(null);
                      setShowClone(true);
                    }}
                    disabled={saving}
                  >
                    {t(
                      "opportunities.matchingRound.formWizard.startFromPublic",
                      {},
                      {
                        default: "Start from a public form",
                      },
                    )}
                  </Button>
                </MetaActions>
              ) : null}
            </MetaHeader>

            <Split>
              <EditorColumn>
                <QuestionList>
                  {questions.map((q, index) => (
                    <QuestionEditor
                      key={q.localId}
                      question={q}
                      index={index}
                      canRemove={questions.length > 1}
                      expanded={expandedQuestionId === q.localId}
                      introVideoTaken={introVideoTaken}
                      onExpand={() => setExpandedQuestionId(q.localId)}
                      onCollapse={() => setExpandedQuestionId(null)}
                      onChange={(next) =>
                        setQuestions((list) =>
                          list.map((item) =>
                            item.localId === q.localId ? next : item
                          )
                        )
                      }
                      onRemove={() => {
                        setQuestions((list) => {
                          const next = list.filter(
                            (item) => item.localId !== q.localId
                          );
                          if (expandedQuestionId === q.localId) {
                            setExpandedQuestionId(next[0]?.localId || null);
                          }
                          return next;
                        });
                      }}
                    />
                  ))}
                </QuestionList>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const next = createBlankQuestion();
                    setQuestions((list) => [...list, next]);
                    setExpandedQuestionId(next.localId);
                  }}
                >
                  {t("opportunities.matchingRound.formWizard.addQuestion", {}, {
                    default: "Add question",
                  })}
                </Button>
              </EditorColumn>
              <PreviewPane>
                {hasPreviewCards ? (
                  (previewDefinition.cards || []).map((card) => (
                    <CardRenderer
                      key={card.id}
                      card={card}
                      values={{}}
                      errors={{}}
                      onFieldChange={() => {}}
                      locale={locale}
                      disabled
                    />
                  ))
                ) : (
                  <StepMeta>
                    {t(
                      "opportunities.matchingRound.formWizard.previewEmpty",
                      {},
                      {
                        default:
                          "Pick a question type and add a prompt to see a live preview.",
                      },
                    )}
                  </StepMeta>
                )}
              </PreviewPane>
            </Split>
          </>
        )}

        {error ? <ErrorText>{error}</ErrorText> : null}
      </WizardBody>
    </Modal>
  );
}
