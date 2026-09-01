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

  const handleSubmit = useCallback(
    async (updateInput) => {
      const extra = pendingSaveOptionsRef.current || {};
      pendingSaveOptionsRef.current = {};
      return onSaveAssessment?.(updateInput?.self?.assessmentData, extra);
    },
    [onSaveAssessment],
  );

  const save = useCallback(async (options = {}) => {
    pendingSaveOptionsRef.current = {
      feedbackScope: options.feedbackScope,
    };
    onDismissSaveFeedback?.();
    if (!formRef.current?.save) return false;
    const ok = await formRef.current.save({
      skipValidation: Boolean(options.skipValidation),
    });
    return ok;
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
      />
    </>
  );
});

export default StudentAssessmentStep;
