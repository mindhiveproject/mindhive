import { useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../../DesignSystem/Chip";
import DesignSystemButton from "../../../DesignSystem/Button";
import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";
import { EXPLORE_ORGANIZATION_DETAIL } from "../../../Queries/Organization";
import { MANAGE_ORGANIZATION_HREF } from "../../../../lib/profileEditNavigation";
import OrganizationAdminPanels from "./OrganizationAdminPanels";
import OrganizationProfileEditor from "./OrganizationProfileEditor";
import OrganizationVerificationStatus from "./OrganizationVerificationStatus";
import {
  BACK_CHEVRON,
  BackLink,
  OrganizationOpportunitiesSection,
  Shell,
} from "./OrganizationProfileView";
import { isOrganizationAdmin } from "./utils";

const TABS = {
  profile: "profile",
  people: "people",
};

const TabBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const AdminHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .titleRow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  h1 {
    margin: 0;
    font-family: "Inter", sans-serif;
    font-size: clamp(24px, 3vw, 32px);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const AdminToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e6e6e6;

  .adminMeta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    flex: 1;
  }

  .adminRow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .tabsHint {
    margin: 0;
    max-width: 560px;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
    font-family: "Inter", sans-serif;
    font-size: 13px;
    font-weight: 400;
    line-height: 20px;
  }
`;

const ManageTabs = styled.div`
  .navbar-item.selected,
  .navbar-item:active {
    background-color: #def8fb;
  }
`;

export default function ManageOrganization({ organizationId, user }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const [tab, setTab] = useState(TABS.profile);

  const canManage = isOrganizationAdmin(user, null, organizationId);

  const { data, loading } = useQuery(EXPLORE_ORGANIZATION_DETAIL, {
    variables: { id: organizationId },
    skip: !organizationId || !canManage,
    fetchPolicy: "cache-and-network",
  });
  const org = data?.organization;

  if (!organizationId || !canManage) {
    return (
      <Shell>
        <h1 style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 28 }}>
          {t("manageOrganization.unauthorizedTitle", {}, {
            default: "You can’t manage this organization",
          })}
        </h1>
        <p style={{ margin: 0, color: "#5f6871", fontSize: 14, maxWidth: 480 }}>
          {t("manageOrganization.unauthorizedDescription", {}, {
            default:
              "You don’t have admin access to this organization. Choose one you administer from the list.",
          })}
        </p>
        <ActionsRow>
          <DesignSystemButton
            variant="filled"
            type="button"
            onClick={() => router.replace(MANAGE_ORGANIZATION_HREF)}
          >
            {t("manageOrganization.backToList", {}, {
              default: "Back to your organizations",
            })}
          </DesignSystemButton>
        </ActionsRow>
      </Shell>
    );
  }

  if (loading && !org) {
    return (
      <Shell>
        <p>
          {t("organizationsDetail.loading", {}, {
            default: "Loading organization…",
          })}
        </p>
      </Shell>
    );
  }

  if (!org) {
    return (
      <Shell>
        <p>
          {t("organizationsDetail.notFound", {}, {
            default: "Organization not found.",
          })}
        </p>
        <ActionsRow>
          <DesignSystemButton
            variant="outline"
            type="button"
            onClick={() => router.replace(MANAGE_ORGANIZATION_HREF)}
          >
            {t("manageOrganization.backToList", {}, {
              default: "Back to your organizations",
            })}
          </DesignSystemButton>
        </ActionsRow>
      </Shell>
    );
  }

  const backLabel = t("manageOrganization.backToList", {}, {
    default: "Back to your organizations",
  });

  return (
    <Shell>
      <AdminHeader>
        <div className="titleRow">
          <BackLink
            type="button"
            onClick={() => router.push(MANAGE_ORGANIZATION_HREF)}
            aria-label={backLabel}
            title={backLabel}
          >
            {BACK_CHEVRON}
          </BackLink>
          <h1>{org.name}</h1>
          <OrganizationVerificationStatus verified={!!org.verified} />
        </div>
        <AdminToolbar>
          <div className="adminMeta">
            <div className="adminRow">
              <Chip
                label={t("manageOrganization.adminMode", {}, {
                  default: "Admin mode",
                })}
                leading={
                  <img
                    src="/assets/icons/sheild.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                }
                shape="pill"
              />
            </div>
            <p className="tabsHint">
              {t("manageOrganization.tabsHint", {}, {
                default:
                  "Use Public Profile to edit what visitors see, and Manage People to control who can administer this organization.",
              })}
            </p>
          </div>
          <DesignSystemButton
            variant="outline"
            type="button"
            onClick={() =>
              router.push({
                pathname: "/dashboard/connect/organizations",
                query: { org: org.id },
              })
            }
          >
            {t("manageOrganization.viewPublic", {}, {
              default: "View public page",
            })}
          </DesignSystemButton>
        </AdminToolbar>
      </AdminHeader>

      <ManageTabs>
        <Navbar>
          <NavbarItem
            selected={tab === TABS.profile}
            onClick={() => setTab(TABS.profile)}
          >
            {t("manageOrganization.tabs.profile", {}, {
              default: "Public Profile",
            })}
          </NavbarItem>
          <NavbarItem
            selected={tab === TABS.people}
            onClick={() => setTab(TABS.people)}
          >
            {t("manageOrganization.tabs.people", {}, {
              default: "Manage People",
            })}
          </NavbarItem>
        </Navbar>
      </ManageTabs>

      {tab === TABS.profile ? (
        <TabBody>
          <OrganizationProfileEditor
            organization={org}
            organizationId={org.id}
          />
          <OrganizationOpportunitiesSection organization={org} />
        </TabBody>
      ) : (
        <TabBody>
          <OrganizationAdminPanels
            organization={org}
            organizationId={org.id}
            canManage
            user={user}
          />
        </TabBody>
      )}
    </Shell>
  );
}
