import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import { Container, Draggable } from "react-smooth-dnd";

import Button from "../../DesignSystem/Button";
import Modal from "../../DesignSystem/Modal";
import { AddIcon } from "../../DesignSystem/Icons";
import CardRenderer from "../DefinitionForm/CardRenderer";
import { FieldShell } from "../DefinitionForm/styles";
import {
  CLONE_FORM_DEFINITION_FOR_CLASS,
  SAVE_BOARD_REVIEW_FORM_DEFINITION,
  SAVE_CLASS_FORM_DEFINITION,
} from "../../Mutations/FormDefinition";
import { FORM_DEFINITION_BY_ID } from "../../Queries/FormDefinition";
import ClonePublicFormPicker from "./ClonePublicFormPicker";
import QuestionEditor, { REVIEW_HIDDEN_TYPE_KEYS } from "./QuestionEditor";
import {
  buildPreviewDefinition,
  createBlankQuestion,
  insertQuestionAt,
  isIntroVideoQuestion,
  questionsFromDefinition,
  questionsToMutationFields,
  reorderArray,
} from "./questionUtils";
import {
  BuilderColumn,
  ErrorText,
  FooterActions,
  MetaActions,
  MetaHeader,
  PageBody,
  PageFooter,
  PageHeader,
  PageShell,
  PageTitle,
  PreviewStack,
  QuestionList,
  StepMeta,
  WizardBody,
} from "./styles";

export default function TeacherFormWizard({
  open,
  onClose,
  classId,
  proposalBoardId = null,
  milestoneKey = null,
  mode = "opportunity",
  definitionId: initialDefinitionId = null,
  onSaved,
  presentation = "modal",
}) {
  const isReview = mode === "review";
  const isStudentAssessment = mode === "student_assessment";
  const isPage = presentation === "page";
  const { t } = useTranslation("classes");
  const router = useRouter();
  const locale = router?.locale || "en-us";
  const listEndRef = useRef(null);

  const [definitionId, setDefinitionId] = useState(initialDefinitionId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([createBlankQuestion()]);
  const [showClone, setShowClone] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
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
  const [saveBoardReviewForm] = useMutation(SAVE_BOARD_REVIEW_FORM_DEFINITION);
  const [cloneForClass] = useMutation(CLONE_FORM_DEFINITION_FOR_CLASS);
  const hiddenTypeKeys = isReview
    ? REVIEW_HIDDEN_TYPE_KEYS
    : isStudentAssessment
      ? ["file"]
      : [];

  const resetBlank = useCallback(() => {
    const first = createBlankQuestion();
    setDefinitionId(null);
    setTitle("");
    setDescription("");
    setQuestions([first]);
    setShowClone(false);
    setIsPreviewing(false);
    setError(null);
    setSaving(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (initialDefinitionId) {
      setDefinitionId(initialDefinitionId);
      setIsPreviewing(false);
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
    setShowClone(false);
    setIsPreviewing(false);
    setError(null);
  }, [open, initialDefinitionId, existingData?.formDefinition]);

  const previewDefinition = useMemo(
    () =>
      buildPreviewDefinition({
        title,
        description,
        questions: questions.filter((q) => q.typeChosen),
        omitCardHeader: false,
      }),
    [title, description, questions]
  );

  const introVideoTaken = useMemo(
    () => questions.some((q) => q.typeChosen && isIntroVideoQuestion(q)),
    [questions]
  );

  const hasPreviewCards = (previewDefinition.cards || []).some(
    (card) => (card.fields || []).length > 0
  );

  const scrollToListEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const appendQuestion = useCallback(() => {
    const next = createBlankQuestion();
    setQuestions((list) => [...list, next]);
    scrollToListEnd();
  }, [scrollToListEnd]);

  const insertQuestion = useCallback((index) => {
    const next = createBlankQuestion();
    setQuestions((list) => insertQuestionAt(list, index, next));
  }, []);

  const handleQuestionDrop = useCallback(({ removedIndex, addedIndex }) => {
    if (removedIndex == null || addedIndex == null) return;
    if (removedIndex === addedIndex) return;
    setQuestions((list) => reorderArray(list, removedIndex, addedIndex));
  }, []);

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
    if (!isReview && !isStudentAssessment && introVideoCount > 1) {
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
    if (isReview) {
      if (!proposalBoardId) {
        setError(
          t("projects.formWizard.errors.missingBoard", {}, {
            default: "Missing template board context.",
          })
        );
        return;
      }
    } else if (!classId) {
      setError(
        t("opportunities.matchingRound.formWizard.errors.missingClass", {}, {
          default: "Missing class context.",
        })
      );
      return;
    }
    if (!validateName() || !validateQuestions()) return;
    if (saving) return;

    setSaving(true);
    setError(null);
    try {
      const fields = questionsToMutationFields(
        questions.filter((q) => q.typeChosen)
      );
      let saved;
      if (isReview) {
        const result = await saveBoardReviewForm({
          variables: {
            input: {
              proposalBoardId,
              definitionId: definitionId || undefined,
              title: title.trim(),
              description: description.trim(),
              fields,
              publish: !!publish,
              milestoneKey: milestoneKey || undefined,
            },
          },
        });
        saved = result?.data?.saveBoardReviewFormDefinition;
      } else {
        const result = await saveClassForm({
          variables: {
            input: {
              classId,
              definitionId: definitionId || undefined,
              title: title.trim(),
              description: description.trim(),
              fields,
              publish: !!publish,
              surface: isStudentAssessment ? "student_assessment" : "opportunity",
            },
          },
        });
        saved = result?.data?.saveClassFormDefinition;
      }
      if (!saved?.id) {
        throw new Error("Save failed");
      }
      setDefinitionId(saved.id);
      // Pass explicit publish intent — do not infer from saved.status.
      // Editing a published form and choosing Save as draft must not
      // trigger round auto-attach (status alone is not a safe signal).
      const publishIntent = !!publish;
      if (onSaved) {
        await onSaved(saved, { didPublish: publishIntent });
      }
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
      setShowClone(false);
      setIsPreviewing(false);
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
    : isReview
      ? t("projects.formWizard.title", {}, {
          default: "Edit review form",
        })
      : isStudentAssessment
        ? t("opportunities.matchingRound.studentAssessmentWizard.title", {}, {
            default: "Create student assessment",
          })
        : t("opportunities.matchingRound.formWizard.title", {}, {
            default: "Create a questionnaire",
          });

  // Preview lives in the footer next to the save actions so the title and note
  // fields keep the full width of the panel.
  const previewAction = isPreviewing ? (
    <Button
      type="button"
      variant="outline"
      onClick={() => setIsPreviewing(false)}
      disabled={saving}
    >
      {t(
        "opportunities.matchingRound.formWizard.exitPreview",
        {},
        { default: "Exit preview" },
      )}
    </Button>
  ) : (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        setError(null);
        setIsPreviewing(true);
      }}
      disabled={saving}
    >
      {t(
        "opportunities.matchingRound.formWizard.previewForm",
        {},
        { default: "Preview" },
      )}
    </Button>
  );

  const closeAction = (
    <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
      {isPage
        ? t("opportunities.matchingRound.formWizard.back", {}, {
            default: "Back",
          })
        : t("opportunities.matchingRound.formWizard.cancel", {}, {
            default: "Cancel",
          })}
    </Button>
  );

  // Review forms are governed by whether the teacher links them to a milestone,
  // so they get a single Save instead of a draft / publish choice. Saving still
  // publishes so the linked form resolves for reviewers.
  const saveActions = isReview ? (
    <Button
      type="button"
      variant="filled"
      onClick={() => persist({ publish: true })}
      disabled={saving}
    >
      {t("projects.formWizard.save", {}, { default: "Save" })}
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
  );

  const actions = showClone ? (
    <FooterActions>
      <div className="footer-actions-right">
        <Button
          type="button"
          variant="outline"
          onClick={handleBackFromClone}
          disabled={saving}
        >
          {t("opportunities.matchingRound.formWizard.back", {}, {
            default: "Back",
          })}
        </Button>
      </div>
    </FooterActions>
  ) : (
    <FooterActions>
      <div className="footer-actions-left">{previewAction}</div>
      <div className="footer-actions-right">
        {closeAction}
        {saveActions}
      </div>
    </FooterActions>
  );

  const dragDisabled = saving || isPreviewing;

  useEffect(() => {
    if (!open || !isPage || saving || typeof onClose !== "function") {
      return undefined;
    }
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isPage, saving, onClose]);

  const wizardContent = (
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
      ) : isPreviewing ? (
        <>
          {hasPreviewCards ? (
            <PreviewStack>
              {(previewDefinition.cards || []).map((card) => (
                <CardRenderer
                  key={card.id}
                  card={card}
                  values={{}}
                  errors={{}}
                  onFieldChange={() => {}}
                  locale={locale}
                  disabled
                  quiet
                />
              ))}
            </PreviewStack>
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
        </>
      ) : (
        <>
          <MetaHeader>
            <FieldShell>
              <div className="field-label-block">
                <span className="label-text">
                  {t(
                    isReview
                      ? "projects.formWizard.nameLabel"
                      : "opportunities.matchingRound.formWizard.nameLabel",
                    {},
                    {
                      default: isReview
                        ? "Form title"
                        : "Title of Form",
                    },
                  )}
                  <span className="required">*</span>
                </span>
              </div>
              <input
                type="text"
                className="field-control-block"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t(
                  isReview
                    ? "projects.formWizard.namePlaceholder"
                    : "opportunities.matchingRound.formWizard.namePlaceholder",
                  {},
                  {
                    default: isReview
                      ? "e.g. Proposal feedback"
                      : "e.g. Sponsor visit follow-up",
                  },
                )}
                disabled={saving}
              />
            </FieldShell>
            <FieldShell>
              <div className="field-label-block">
                <span className="label-text">
                  {t(
                    isReview
                      ? "projects.formWizard.descriptionLabel"
                      : "opportunities.matchingRound.formWizard.descriptionLabel",
                    {},
                    {
                      default: isReview
                        ? "Optional note for reviewers"
                        : "Optional note for respondents",
                    },
                  )}
                </span>
              </div>
              <textarea
                className="field-control-block"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={t(
                  "opportunities.matchingRound.formWizard.descriptionPlaceholder",
                  {},
                  {
                    default: "Shown at the top of the form. Keep it short.",
                  },
                )}
                disabled={saving}
              />
            </FieldShell>
            {!isReview && !isStudentAssessment && !initialDefinitionId ? (
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

          <BuilderColumn>
            <QuestionList>
              <Container
                onDrop={handleQuestionDrop}
                dragHandleSelector=".question-drag-handle"
                nonDragAreaSelector="input, textarea, button:not(.question-drag-handle), label, .DesignSystem-CompactActionButton"
                dropPlaceholder={{ animationDuration: 150, showOnTop: true }}
                getChildPayload={(i) => questions[i]}
              >
                {questions.map((q, index) => (
                  <Draggable key={q.localId}>
                    <QuestionEditor
                      question={q}
                      index={index}
                      canRemove={questions.length > 1}
                      showInsertBefore={index > 0}
                      dragDisabled={dragDisabled}
                      introVideoTaken={introVideoTaken}
                      hiddenTypeKeys={hiddenTypeKeys}
                      onInsertBefore={() => insertQuestion(index)}
                      onChange={(next) =>
                        setQuestions((list) =>
                          list.map((item) =>
                            item.localId === q.localId ? next : item
                          )
                        )
                      }
                      onRemove={() => {
                        setQuestions((list) =>
                          list.filter((item) => item.localId !== q.localId)
                        );
                      }}
                    />
                  </Draggable>
                ))}
              </Container>
              <div className="question-list-add">
                <Button
                  type="button"
                  variant="outline"
                  leadingIcon={<AddIcon />}
                  onClick={appendQuestion}
                  disabled={saving}
                >
                  {t("opportunities.matchingRound.formWizard.addQuestion", {}, {
                    default: "Add question",
                  })}
                </Button>
              </div>
              <div ref={listEndRef} />
            </QuestionList>
          </BuilderColumn>
        </>
      )}

      {error ? <ErrorText>{error}</ErrorText> : null}
    </WizardBody>
  );

  if (!open) return null;

  if (isPage) {
    return (
      <PageShell aria-label={titleText}>
        <PageHeader>
          <PageTitle>{titleText}</PageTitle>
        </PageHeader>
        <PageBody>{wizardContent}</PageBody>
        <PageFooter>{actions}</PageFooter>
      </PageShell>
    );
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={titleText}
      maxWidth={800}
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
      {wizardContent}
    </Modal>
  );
}
