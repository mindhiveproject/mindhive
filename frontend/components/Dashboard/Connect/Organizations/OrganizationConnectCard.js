import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import { ArrowOutwardIcon, BriefcaseIcon } from "../../../DesignSystem/Icons";
import { stripHtml } from "../../../Proposal/Card/Forms/utils";
import ConnectCard from "../ConnectCard";
import OrganizationVerificationStatus from "./OrganizationVerificationStatus";

function hrefToPath(href) {
  if (!href) return null;
  if (typeof href === "string") return href;
  const pathname = href.pathname || "";
  const query = href.query || {};
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value == null) return;
    params.set(key, String(value));
  });
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export default function OrganizationConnectCard({ org, href, linkLabel }) {
  const { t } = useTranslation("connect");

  if (!org?.id) {
    return null;
  }


  const name = org.name || "";
  const location = org.location?.trim() || null;
  const description =
    org.tagline?.trim() || stripHtml(org.mission) || null;
  const opportunityCount = org.opportunitiesCount || 0;

  const orgHref =
    href || {
      pathname: "/dashboard/connect/organizations",
      query: { org: org.id },
    };
  const orgUrl = hrefToPath(orgHref);

  const viewOrgLabel =
    linkLabel ||
    t(
      "organizationsList.viewOrganization",
      { name },
      { default: "View organization {{name}}" }
    );

  const organizationTypeLabel = t(
    "organizationsList.organizationButton",
    {},
    { default: "Organization" }
  );

  return (
    <ConnectCard
      typeLabel={organizationTypeLabel}
      href={orgHref}
      ariaLabel={viewOrgLabel}
      avatar={{
        src: org.logo?.url,
        fallbackLabel: (name || "?").charAt(0).toUpperCase(),
      }}
      title={name}
      subtitle={location}
      status={
        <OrganizationVerificationStatus
          verified={!!org.verified}
          size="compact"
        />
      }
      chips={
        opportunityCount > 0 ? (
          <Chip
            shape="square"
            leading={<BriefcaseIcon width={18} height={18} />}
            label={t(
              opportunityCount === 1
                ? "organizationsList.opportunityCount.one"
                : "organizationsList.opportunityCount.many",
              { count: opportunityCount },
              {
                default:
                  opportunityCount === 1
                    ? "{{count}} opportunity"
                    : "{{count}} opportunities",
              }
            )}
            style={{
              maxWidth: "100%",
              height: "auto",
              minHeight: 32,
              paddingLeft: 8,
            }}
          />
        ) : null
      }
      description={description}
      actions={
        <Button
          variant="outline"
          leadingIcon={<ArrowOutwardIcon />}
          aria-label={viewOrgLabel}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (orgUrl) {
              window.open(orgUrl, "_blank", "noopener,noreferrer");
            }
          }}
        >
          {organizationTypeLabel}
        </Button>
      }
    />
  );
}
