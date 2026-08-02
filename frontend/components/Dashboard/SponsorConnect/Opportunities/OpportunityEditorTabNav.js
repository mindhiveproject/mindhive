import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";
import {
  OPPORTUNITY_EDITOR_TABS,
  formTabKey,
} from "../../../../lib/opportunityEditorTabs";
import { isProposalFormAnswerComplete } from "../../../../lib/opportunityProposalData";

const NavWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;

  .navbar-item.selected,
  .navbar-item:active {
    background: var(--MH-Theme-Tertiary-Medium, #D3E0E3);;
  }
`;

const CHECK_ICON = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M9.55 18.2L3.8 12.45l1.4-1.4 4.35 4.35 9.25-9.25 1.4 1.4L9.55 18.2z"
      fill="currentColor"
    />
  </svg>
);

export default function OpportunityEditorTabNav({
  activeTab,
  followUpForms = [],
  proposalData = null,
  onSelectTab,
}) {
  const { t } = useTranslation("connect");

  return (
    <NavWrap>
      <Navbar variant="tonal">
        <NavbarItem
          selected={activeTab === OPPORTUNITY_EDITOR_TABS.chat}
          onClick={() => onSelectTab(OPPORTUNITY_EDITOR_TABS.chat)}
        >
          {t("opportunityEditor.tabs.chat", {}, { default: "Chat" })}
        </NavbarItem>
        <NavbarItem
          selected={activeTab === OPPORTUNITY_EDITOR_TABS.status}
          onClick={() => onSelectTab(OPPORTUNITY_EDITOR_TABS.status)}
        >
          {t("opportunityEditor.tabs.status", {}, { default: "Status" })}
        </NavbarItem>
        <NavbarItem
          selected={activeTab === OPPORTUNITY_EDITOR_TABS.proposal}
          onClick={() => onSelectTab(OPPORTUNITY_EDITOR_TABS.proposal)}
        >
          {t("opportunityEditor.tabs.proposal", {}, {
            default: "Opportunity form",
          })}
        </NavbarItem>
        {followUpForms.map((form) => {
          const key = formTabKey(form.id);
          const complete = isProposalFormAnswerComplete(proposalData, form.id);
          const label =
            form.title ||
            t("opportunityEditor.tabs.followUpFallback", {}, {
              default: "Follow-up form",
            });
          return (
            <NavbarItem
              key={form.id}
              selected={activeTab === key}
              onClick={() => onSelectTab(key)}
              leadingIcon={complete ? CHECK_ICON : null}
              aria-label={
                complete
                  ? t(
                      "opportunityEditor.tabs.followUpCompleteAria",
                      { title: label },
                      { default: "{{title}} (completed)" },
                    )
                  : undefined
              }
            >
              {label}
            </NavbarItem>
          );
        })}
      </Navbar>
    </NavWrap>
  );
}
