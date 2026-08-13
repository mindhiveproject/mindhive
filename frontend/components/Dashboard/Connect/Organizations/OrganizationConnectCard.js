import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import { ArrowOutwardIcon, BriefcaseIcon } from "../../../DesignSystem/Icons";
import ConnectCard from "../ConnectCard";
import ConnectEntityBand from "../ConnectEntityBand";
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

/**
 * @param {"card"|"band"} [layout="card"] - "card" is the vertical browse card;
 *   "band" is the compact detail-panel form, where the organization is
 *   supporting context beside a primary contact rather than a peer.
 */
export default function OrganizationConnectCard({
  org,
  href,
  linkLabel,
  layout = "card",
}) {
  const { t } = useTranslation("connect");

  if (!org?.id) {
    return null;
  }

  const name = org.name || "";
  const location = org.location?.trim() || null;
  const department = org.department?.trim() || null;
  const description = org.tagline?.trim() || org.mission?.trim() || null;
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

  const Shell = layout === "band" ? ConnectEntityBand : ConnectCard;
  const shellProps = layout === "band" ? { density: "compact" } : {};

  return (
    <Shell
      {...shellProps}
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
        department || opportunityCount > 0 ? (
          <>
            {department ? (
              <Chip
                shape="square"
                label={department}
                title={department}
                style={{ maxWidth: "100%", height: "auto", minHeight: 32 }}
              />
            ) : null}
            {opportunityCount > 0 ? (
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
                  // An 18px glyph needs more breathing room than the 4px Chip
                  // reserves for a flush 24px avatar.
                  paddingLeft: 10,
                }}
              />
            ) : null}
          </>
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
          {t(
            "organizationsList.organizationButton",
            {},
            { default: "Organization" }
          )}
        </Button>
      }
    />
  );
}
