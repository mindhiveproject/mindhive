import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../DesignSystem/Button";
import { EXPLORE_ORGANIZATION_DETAIL } from "../../../Queries/Organization";
import { manageOrganizationHref } from "../../../../lib/profileEditNavigation";
import OrganizationAdminPanels from "./OrganizationAdminPanels";
import {
  BACK_CHEVRON,
  BackLink,
  OrganizationAboutSection,
  OrganizationHero,
  OrganizationOpportunitiesSection,
  Shell,
} from "./OrganizationProfileView";
import { isOrganizationAdmin } from "./utils";

export default function OrganizationDetail({ organizationId, user }) {
  const router = useRouter();
  const { t } = useTranslation("connect");

  const { data, loading } = useQuery(EXPLORE_ORGANIZATION_DETAIL, {
    variables: { id: organizationId },
    fetchPolicy: "cache-and-network",
  });
  const org = data?.organization;
  const canManage = isOrganizationAdmin(user, org, organizationId);

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
      </Shell>
    );
  }

  const backLabel = t("organizationsDetail.back", {}, { default: "Back" });

  return (
    <Shell>
      <BackLink
        type="button"
        onClick={() => router.back()}
        aria-label={backLabel}
        title={backLabel}
      >
        {BACK_CHEVRON}
      </BackLink>

      <OrganizationHero
        organization={org}
        actions={
          canManage ? (
            <div style={{ marginTop: 12 }}>
              <DesignSystemButton
                variant="tonal"
                type="button"
                onClick={() =>
                  router.push(manageOrganizationHref(org.id))
                }
              >
                {t("nav.manageOrganization", {}, {
                  default: "Manage organization",
                })}
              </DesignSystemButton>
            </div>
          ) : null
        }
      />

      <OrganizationAboutSection organization={org} />

      <OrganizationAdminPanels
        organization={org}
        organizationId={organizationId}
        canManage={false}
        user={user}
      />

      <OrganizationOpportunitiesSection organization={org} />
    </Shell>
  );
}
