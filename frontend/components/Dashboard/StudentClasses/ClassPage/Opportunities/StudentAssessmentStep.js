import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import useTranslation from "next-translate/useTranslation";

import DefinitionForm from "../../../../Forms/DefinitionForm";
import MessageCard from "../../../../DesignSystem/MessageCard";

const StudentAssessmentStep = forwardRef(function StudentAssessmentStep(
  {
    formDefinitionId,
    preferenceEntity,
    isOpen,
    locale,
    onSaveAssessment,
    saveFeedback = null,
    onDismissSaveFeedback,
    onValidityChange,
  },
  ref,
) {
  const { t } = useTranslation("classes");
  const formRef = useRef(null);

  const dismissLabel = t(
    "opportunities.matchingRound.formWizard.bannerDismiss",
    {},
    { default: "Dismiss" },
  );

  const pendingSaveOptionsRef = useRef({});
  const lastSavedAssessmentRef = useRef(null);

  const handleSubmit = useCallback(
    async (updateInput) => {
      const extra = pendingSaveOptionsRef.current || {};
      pendingSaveOptionsRef.current = {};
      const data = updateInput?.self?.assessmentData;
      lastSavedAssessmentRef.current = data;
      return onSaveAssessment?.(data, extra);
    },
    [onSaveAssessment],
  );

  const save = useCallback(async (options = {}) => {
    pendingSaveOptionsRef.current = {
      feedbackScope: options.feedbackScope,
      skipSuccessFeedback: options.skipSuccessFeedback,
      manageSaving: options.manageSaving,
    };
    onDismissSaveFeedback?.();
    if (!formRef.current?.save) return false;
    const ok = await formRef.current.save({
      skipValidation: Boolean(options.skipValidation),
    });
    if (!ok) return false;
    return lastSavedAssessmentRef.current ?? true;
  }, [onDismissSaveFeedback]);

  useImperativeHandle(ref, () => ({ save }), [save]);

  if (!formDefinitionId) return null;

  return (
    <>
      <h2>
        {t("opportunities.studentView.rankForm.assessmentHeading", {}, {
          default: "Individual Core Competency Assessment",
        })}
      </h2>
      <p className="helper">
        {t("opportunities.studentView.rankForm.assessmentHelper", {}, {
          default:
            "Complete this assessment before ranking classmates and opportunities.",
        })}
      </p>

      {saveFeedback ? (
        <MessageCard
          variant={saveFeedback.variant}
          message={saveFeedback.message}
          onClose={onDismissSaveFeedback}
          closeAriaLabel={dismissLabel}
        />
      ) : null}

      <DefinitionForm
        ref={formRef}
        definitionId={formDefinitionId}
        assessmentEntryFormDefinitionId={formDefinitionId}
        entity={preferenceEntity || { assessmentData: null }}
        locale={locale}
        onSubmit={handleSubmit}
        readOnly={!isOpen}
        hideSaveButton
        onValidityChange={onValidityChange}
      />
    </>
  );
});

export default StudentAssessmentStep;
