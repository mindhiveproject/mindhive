import useTranslation from "next-translate/useTranslation";

import Chip from "../../../DesignSystem/Chip";
import IconButton from "../../../DesignSystem/IconButton";
import { ArrowOutwardIcon, BriefcaseIcon } from "../../../DesignSystem/Icons";
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

export default function OrganizationConnectCard({
  org,
  href,
  linkLabel,
  layout = "horizontal",
}) {
  const { t } = useTranslation("connect");

  if (!org?.id) {
    return null;
  }

  const name = org.name || "";
  const location = org.location?.trim() || null;
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

  return (
    <ConnectCard
      layout={layout}
      href={orgHref}
      ariaLabel={viewOrgLabel}
      avatar={{
        src: org.logo?.url,
        fallbackLabel: (name || "?").charAt(0).toUpperCase(),
      }}
      title={name}
      titleAdornment={
        <OrganizationVerificationStatus
          verified={!!org.verified}
          size="compact"
        />
      }
      subtitle={location}
      chip={
        opportunityCount > 0 ? (
          <Chip
            shape="square"
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
            style={{ width: "fit-content", paddingLeft: "8px" }}
            leading={<BriefcaseIcon width={18} height={18} />}
          />
        ) : null
      }
      actions={
        <IconButton
          variant="outline"
          style={{
            borderColor: "var(--MH-Theme-Primary-Dark, #336F8A)",
            color: "var(--MH-Theme-Primary-Dark, #336F8A)",
          }}
          icon={<ArrowOutwardIcon />}
          ariaLabel={viewOrgLabel}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (orgUrl) {
              window.open(orgUrl, "_blank", "noopener,noreferrer");
            }
          }}
        />
      }
    />
  );
}
