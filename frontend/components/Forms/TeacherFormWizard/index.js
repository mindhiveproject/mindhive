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
  questionsFromDefinition,
  questionsToMutationFields,
} from "./questionUtils";
import {
  ErrorText,
  FieldStack,
  PreviewPane,
  QuestionList,
  Split,
  StepMeta,
  WizardBody,
} from "./styles";

const STEPS = ["name", "questions", "preview"];

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

  const [step, setStep] = useState(0);
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
    setStep(0);
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
    setStep(0);
    setShowClone(false);
    setError(null);
  }, [open, initialDefinitionId, existingData?.formDefinition]);

  const previewDefinition = useMemo(
    () => buildPreviewDefinition({ title, description, questions }),
    [title, description, questions]
  );

  const stepLabel = t("opportunities.matchingRound.formWizard.stepOf", {
    current: step + 1,
    total: STEPS.length,
  }, {
    default: "Step {{current}} of {{total}}",
  });

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
    if (!questions.length) {
      setError(
        t("opportunities.matchingRound.formWizard.errors.needQuestion", {}, {
          default: "Add at least one question.",
        })
      );
      return false;
    }
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!String(q.label || "").trim()) {
        setError(
          t("opportunities.matchingRound.formWizard.errors.promptRequired", {
            number: i + 1,
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
            number: i + 1,
          }, {
            default: "Question {{number}} needs at least one choice.",
          })
        );
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateName()) return;
    if (step === 1 && !validateQuestions()) return;
    setStep((s) => {
      const next = Math.min(s + 1, STEPS.length - 1);
      if (next === 1 && !expandedQuestionId && questions[0]?.localId) {
        setExpandedQuestionId(questions[0].localId);
      }
      return next;
    });
  };

  const handleBack = () => {
    setError(null);
    if (showClone) {
      setShowClone(false);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
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
            fields: questionsToMutationFields(questions),
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
      setStep(1);
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
      <Button type="button" variant="outline" onClick={handleBack} disabled={saving}>
        {t("opportunities.matchingRound.formWizard.back", {}, { default: "Back" })}
      </Button>
    </>
  ) : (
    <>
      {step > 0 ? (
        <Button type="button" variant="outline" onClick={handleBack} disabled={saving}>
          {t("opportunities.matchingRound.formWizard.back", {}, { default: "Back" })}
        </Button>
      ) : (
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          {t("opportunities.matchingRound.formWizard.cancel", {}, { default: "Cancel" })}
        </Button>
      )}
      {step < STEPS.length - 1 ? (
        <Button type="button" variant="filled" onClick={handleNext} disabled={saving}>
          {t("opportunities.matchingRound.formWizard.next", {}, { default: "Next" })}
        </Button>
      ) : (
        <>
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
      )}
    </>
  );

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={titleText}
      maxWidth={1120}
      maxHeight="92vh"
      size="large"
      actions={actions}
    >
      <WizardBody>
        {!showClone ? <StepMeta>{stepLabel}</StepMeta> : null}
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
        ) : null}

        {!showClone && step === 0 ? (
          <>
            <FieldStack>
              <label>
                {t("opportunities.matchingRound.formWizard.nameLabel", {}, {
                  default: "What’s this form for?",
                })}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("opportunities.matchingRound.formWizard.namePlaceholder", {}, {
                  default: "e.g. Sponsor visit follow-up",
                })}
              />
            </FieldStack>
            <FieldStack>
              <label>
                {t("opportunities.matchingRound.formWizard.descriptionLabel", {}, {
                  default: "Optional note for sponsors",
                })}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t(
                  "opportunities.matchingRound.formWizard.descriptionPlaceholder",
                  {},
                  {
                    default:
                      "Shown at the top of the form. Keep it short.",
                  },
                )}
              />
            </FieldStack>
            {!initialDefinitionId ? (
              <Button
                type="button"
                variant="text"
                onClick={() => {
                  setError(null);
                  setShowClone(true);
                }}
                disabled={saving}
              >
                {t("opportunities.matchingRound.formWizard.startFromPublic", {}, {
                  default: "Start from a public form",
                })}
              </Button>
            ) : null}
          </>
        ) : null}

        {!showClone && step === 1 ? (
          <Split>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
              <QuestionList>
                {questions.map((q, index) => (
                  <QuestionEditor
                    key={q.localId}
                    question={q}
                    index={index}
                    canRemove={questions.length > 1}
                    expanded={expandedQuestionId === q.localId}
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
            </div>
            <PreviewPane>
              {(previewDefinition.cards || []).map((card) => (
                <CardRenderer
                  key={card.id}
                  card={card}
                  values={{}}
                  errors={{}}
                  onFieldChange={() => {}}
                  locale={locale}
                  disabled
                />
              ))}
            </PreviewPane>
          </Split>
        ) : null}

        {!showClone && step === 2 ? (
          <>
            <StepMeta>
              {t("opportunities.matchingRound.formWizard.previewHint", {}, {
                default:
                  "This is how the form will look. Publish to make it available for this matching round.",
              })}
            </StepMeta>
            <PreviewPane>
              {(previewDefinition.cards || []).map((card) => (
                <CardRenderer
                  key={card.id}
                  card={card}
                  values={{}}
                  errors={{}}
                  onFieldChange={() => {}}
                  locale={locale}
                  disabled
                />
              ))}
            </PreviewPane>
          </>
        ) : null}

        {error ? <ErrorText>{error}</ErrorText> : null}
      </WizardBody>
    </Modal>
  );
}
