import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { NavbarItem, SectionNavbar } from "../../../../DesignSystem/Navbar";

const BASE_STEP_KEYS = ["classmates", "opportunities", "review"];
const ASSESSMENT_STEP_KEY = "assessment";

const WizardShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0;
  min-height: 0;
`;

const WizardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding-bottom: 32px;
`;

export function buildPreferenceStepKeys(includeAssessment) {
  return includeAssessment
    ? [ASSESSMENT_STEP_KEY, ...BASE_STEP_KEYS]
    : BASE_STEP_KEYS;
}

export default function PreferenceSubmissionStepper({
  currentStep,
  onStepChange,
  includeAssessment = false,
  children,
}) {
  const { t } = useTranslation("classes");
  const stepKeys = buildPreferenceStepKeys(includeAssessment);

  return (
    <WizardShell>
      <SectionNavbar
        variant="underline"
        showRule
        aria-label={t("opportunities.studentView.rankForm.navAria", {}, {
          default: "Preference ranking",
        })}
      >
        {stepKeys.map((key, index) => {
          const stepNum = index + 1;
          const isActive = currentStep === stepNum;
          const label = t(
            `opportunities.studentView.rankForm.steps.${key}`,
            {},
            {
              default:
                key === "assessment"
                  ? "Assessment"
                  : key === "classmates"
                    ? "Classmates"
                    : key === "opportunities"
                      ? "Opportunities"
                      : "Review",
            },
          );

          return (
            <NavbarItem
              key={key}
              selected={isActive}
              onClick={
                onStepChange ? () => onStepChange(stepNum) : undefined
              }
            >
              {label}
            </NavbarItem>
          );
        })}
      </SectionNavbar>
      <WizardContent>{children}</WizardContent>
    </WizardShell>
  );
}
