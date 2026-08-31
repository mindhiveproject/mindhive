import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../../DesignSystem/Button";
import MessageCard from "../../../../DesignSystem/MessageCard";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import TeacherFormWizard from "../../../../Forms/TeacherFormWizard";
import MatchingRoundFormPreviewModal from "./MatchingRoundFormPreviewModal";
import { UPDATE_CONNECT_ROUND } from "../../../../Mutations/ConnectRound";
import {
  CLASS_STUDENT_ASSESSMENT_FORM_DEFINITIONS,
} from "../../../../Queries/FormDefinition";
import { PUBLISH_FORM_DEFINITION } from "../../../../Mutations/FormDefinition";

const SetupShell = styled.div`
  display: grid;
  gap: 12px;
  width: 100%;
  min-width: 0;
`;

const SetupRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
`;

const AssessmentCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

export default function MatchingRoundStudentAssessmentSetup({
  classId,
  roundId,
  isNew,
  canManage,
  linkedForm,
  onLinkedFormChange,
  beforeOpen = false,
  openAtLabel = null,
}) {
  const { t } = useTranslation("classes");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDefinitionId, setWizardDefinitionId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [banner, setBanner] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [linkingAssessment, setLinkingAssessment] = useState(false);

  const { data: libraryData, refetch: refetchLibrary } = useQuery(
    CLASS_STUDENT_ASSESSMENT_FORM_DEFINITIONS,
    {
      variables: { classId },
      skip: !classId,
      fetchPolicy: "cache-and-network",
    },
  );

  const libraryForms = useMemo(
    () => libraryData?.formDefinitions || [],
    [libraryData?.formDefinitions],
  );

  const [updateRound] = useMutation(UPDATE_CONNECT_ROUND);
  const [publishFormDefinition] = useMutation(PUBLISH_FORM_DEFINITION);

  const persistLinkedForm = useCallback(
    async (formId, savedForm = null) => {
      if (isNew || !roundId) {
        onLinkedFormChange?.(
          formId
            ? savedForm || { id: formId }
            : null,
        );
        return;
      }
      try {
        await updateRound({
          variables: {
            id: roundId,
            input: {
              studentAssessmentFormDefinition: formId
                ? { connect: { id: formId } }
                : { disconnect: true },
              updatedAt: new Date().toISOString(),
            },
          },
        });
        const match = libraryForms.find((f) => f.id === formId);
        onLinkedFormChange?.(
          formId
            ? savedForm || match || linkedForm || { id: formId }
            : null,
        );
      } catch (error) {
        console.error("Failed to link student assessment form", error);
        alert(
          t(
            "opportunities.matchingRound.studentRanking.assessment.saveFailed",
            {},
            {
              default:
                "Could not save the student assessment for this round. Please try again.",
            },
          ),
        );
      }
    },
    [
      isNew,
      roundId,
      updateRound,
      libraryForms,
      linkedForm,
      onLinkedFormChange,
      t,
    ],
  );

  const openCreateWizard = () => {
    if (linkingAssessment) return;
    setWizardDefinitionId(null);
    setWizardOpen(true);
  };

  const openEditWizard = () => {
    if (linkingAssessment || !linkedForm?.id) return;
    setWizardDefinitionId(linkedForm.id);
    setWizardOpen(true);
  };

  const openAssessmentWizard = () => {
    if (linkingAssessment) return;
    if (linkedForm?.id) {
      openEditWizard();
      return;
    }
    openCreateWizard();
  };

  const handleWizardSaved = async (saved, { didPublish } = {}) => {
    if (!saved?.id) return;
    setLinkingAssessment(true);
    try {
      await refetchLibrary();
      await persistLinkedForm(saved.id, saved);
      if (didPublish) {
        setBanner(
          t(
            "opportunities.matchingRound.studentRanking.assessment.publishedReady",
            { title: saved.title || "" },
            {
              default:
                "“{{title}}” is published and linked to this matching round.",
            },
          ),
        );
      } else {
        setBanner(
          t(
            "opportunities.matchingRound.studentRanking.assessment.savedDraft",
            {},
            {
              default:
                "Assessment saved as draft. Publish it before students can complete it.",
            },
          ),
        );
      }
    } finally {
      setLinkingAssessment(false);
    }
  };

  const handlePublishLinked = async () => {
    if (!linkedForm?.id || linkedForm.status === "published" || publishing) {
      return;
    }
    setPublishing(true);
    try {
      const result = await publishFormDefinition({
        variables: { id: linkedForm.id },
      });
      const published = result?.data?.publishFormDefinition;
      if (published?.id) {
        onLinkedFormChange?.({ ...linkedForm, status: "published" });
        setBanner(
          t(
            "opportunities.matchingRound.studentRanking.assessment.publishedReady",
            { title: linkedForm.title || "" },
            {
              default:
                "“{{title}}” is published and linked to this matching round.",
            },
          ),
        );
      }
      await refetchLibrary();
    } catch (error) {
      console.error("Failed to publish student assessment form", error);
      alert(
        t(
          "opportunities.matchingRound.studentRanking.assessment.publishFailed",
          {},
          {
            default: "Could not publish that assessment. Please try again.",
          },
        ),
      );
    } finally {
      setPublishing(false);
    }
  };

  const libraryOptions = libraryForms.map((form) => ({
    value: form.id,
    label: `${form.title || form.id}${
      form.status === "draft" ? " (draft)" : ""
    }`,
  }));

  let assessmentVariant = "neutral";
  let assessmentMessage;
  if (!linkedForm?.id) {
    assessmentMessage = t(
      "opportunities.matchingRound.studentRanking.assessment.noneLinked",
      {},
      {
        default:
          "Add an Individual Core Competency Assessment for students to complete before ranking.",
      },
    );
  } else if (linkedForm.status !== "published") {
    assessmentVariant = "information";
    assessmentMessage = t(
      "opportunities.matchingRound.studentRanking.assessment.draftLinked",
      { title: linkedForm.title || "" },
      {
        default:
          "“{{title}}” is linked but still a draft. Publish it before students can complete it.",
      },
    );
  } else {
    assessmentVariant = "success";
    assessmentMessage = t(
      "opportunities.matchingRound.studentRanking.assessment.ready",
      { title: linkedForm.title || "" },
      {
        default: "Assessment ready: {{title}}",
      },
    );
  }

  return (
    <SetupShell className="matchingRoundStudentAssessmentSetup">
      {beforeOpen && openAtLabel ? (
        <MessageCard
          variant="information"
          message={t(
            "opportunities.matchingRound.studentRanking.opensOn",
            { date: openAtLabel },
            {
              default: "Student ranking opens on {{date}}.",
            },
          )}
        />
      ) : null}

      {banner ? (
        <MessageCard
          variant="success"
          message={banner}
          onClose={() => setBanner(null)}
          closeAriaLabel={t(
            "opportunities.matchingRound.formWizard.bannerDismiss",
            {},
            { default: "Dismiss" },
          )}
        />
      ) : null}

      <AssessmentCard className="matchingRoundStudentAssessmentCard">
        <MessageCard
          variant={assessmentVariant}
          message={assessmentMessage}
          onClick={
            canManage && !linkingAssessment ? openAssessmentWizard : undefined
          }
          ariaLabel={assessmentMessage}
        />

        {canManage ? (
          <SetupRow>
            {libraryOptions.length > 0 ? (
              <DropdownSelect
                value={linkedForm?.id || ""}
                onChange={(value) => {
                  if (!value) {
                    persistLinkedForm(null);
                    return;
                  }
                  persistLinkedForm(value);
                }}
                disabled={linkingAssessment}
                options={[
                  {
                    value: "",
                    label: t(
                      "opportunities.matchingRound.studentRanking.assessment.selectPlaceholder",
                      {},
                      { default: "Choose from class library…" },
                    ),
                  },
                  ...libraryOptions,
                ]}
                ariaLabel={t(
                  "opportunities.matchingRound.studentRanking.assessment.selectLabel",
                  {},
                  { default: "Student assessment form" },
                )}
              />
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={openCreateWizard}
              disabled={linkingAssessment}
            >
              {t(
                "opportunities.matchingRound.studentRanking.assessment.create",
                {},
                { default: "Create assessment" },
              )}
            </Button>
            {linkedForm?.id ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={openEditWizard}
                  disabled={linkingAssessment}
                >
                  {t(
                    "opportunities.matchingRound.studentRanking.assessment.edit",
                    {},
                    { default: "Edit" },
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewOpen(true)}
                  disabled={linkingAssessment}
                >
                  {t(
                    "opportunities.matchingRound.studentRanking.assessment.preview",
                    {},
                    { default: "Preview" },
                  )}
                </Button>
                {linkedForm.status !== "published" ? (
                  <Button
                    type="button"
                    variant="filled"
                    onClick={handlePublishLinked}
                    disabled={publishing || linkingAssessment}
                  >
                    {publishing
                      ? t("opportunities.matchingRound.saving", {}, {
                          default: "Saving…",
                        })
                      : t(
                          "opportunities.matchingRound.studentRanking.assessment.publish",
                          {},
                          { default: "Publish" },
                        )}
                  </Button>
                ) : null}
              </>
            ) : null}
          </SetupRow>
        ) : null}
      </AssessmentCard>

      <TeacherFormWizard
        open={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setWizardDefinitionId(null);
        }}
        classId={classId}
        mode="student_assessment"
        definitionId={wizardDefinitionId}
        onSaved={handleWizardSaved}
      />

      <MatchingRoundFormPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        formDefinitionIds={linkedForm?.id ? [linkedForm.id] : []}
      />
    </SetupShell>
  );
}
