import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { NavbarItem, SectionNavbar } from "../../../../DesignSystem/Navbar";

const TOTAL_STEPS = 3;

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
`;

const STEP_KEYS = ["classmates", "opportunities", "review"];

export default function PreferenceSubmissionStepper({
  currentStep,
  onStepChange,
  children,
}) {
  const { t } = useTranslation("classes");

  return (
    <WizardShell>
      <SectionNavbar
        variant="underline"
        showRule
        aria-label={t("opportunities.studentView.rankForm.navAria", {}, {
          default: "Preference ranking",
        })}
      >
        {STEP_KEYS.map((key, index) => {
          const stepNum = index + 1;
          const isActive = currentStep === stepNum;
          const label = t(
            `opportunities.studentView.rankForm.steps.${key}`,
            {},
            {
              default:
                key === "classmates"
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

export { TOTAL_STEPS };
