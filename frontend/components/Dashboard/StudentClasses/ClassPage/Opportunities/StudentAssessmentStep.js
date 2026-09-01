import { useCallback, useRef } from "react";
import useTranslation from "next-translate/useTranslation";

import DefinitionForm from "../../../../Forms/DefinitionForm";
import Button from "../../../../DesignSystem/Button";
import MessageCard from "../../../../DesignSystem/MessageCard";

export default function StudentAssessmentStep({
  formDefinitionId,
  preferenceEntity,
  isOpen,
  locale,
  onSaveAssessment,
  onValidationFailed,
  saving = false,
  saveFeedback = null,
  onDismissSaveFeedback,
}) {
  const { t } = useTranslation("classes");
  const formRef = useRef(null);

  const dismissLabel = t(
    "opportunities.matchingRound.formWizard.bannerDismiss",
    {},
    { default: "Dismiss" },
  );

  const handleSubmit = useCallback(
    async (updateInput) => {
      return onSaveAssessment?.(updateInput?.self?.assessmentData);
    },
    [onSaveAssessment],
  );

  const handleSaveClick = async () => {
    onDismissSaveFeedback?.();
    if (!formRef.current?.save) return;
    const ok = await formRef.current.save();
    if (!ok) {
      onValidationFailed?.();
    }
  };

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
      {isOpen ? (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveClick}
            disabled={saving}
          >
            {saving
              ? t("opportunities.studentView.rankForm.saving", {}, {
                  default: "Saving…",
                })
              : t("opportunities.studentView.rankForm.assessmentSave", {}, {
                  default: "Save assessment",
                })}
          </Button>
        </div>
      ) : null}
    </>
  );
}
