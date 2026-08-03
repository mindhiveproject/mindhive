import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";
import { OPPORTUNITY_EDITOR_TABS } from "../../../../lib/opportunityEditorTabs";
import FollowUpFormsNavSelect from "./FollowUpFormsNavSelect";

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
        <FollowUpFormsNavSelect
          primaryTab={OPPORTUNITY_EDITOR_TABS.proposal}
          followUpForms={followUpForms}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          proposalData={proposalData}
        />
      </Navbar>
    </NavWrap>
  );
}
