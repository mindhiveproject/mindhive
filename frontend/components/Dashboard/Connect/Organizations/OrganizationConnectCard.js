import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import { BriefcaseIcon } from "../../../DesignSystem/Icons";
import { stripHtml } from "../../../Proposal/Card/Forms/utils";
import ConnectCard from "../ConnectCard";
import OrganizationVerificationStatus from "./OrganizationVerificationStatus";

const GLOBE_GLYPH = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M3 12h18M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

export default function OrganizationConnectCard({ org, href, linkLabel }) {
  const { t } = useTranslation("connect");

  if (!org?.id) {
    return null;
  }

  const name = org.name || "";
  const location = org.location?.trim() || null;
  const description = org.tagline?.trim() || stripHtml(org.mission) || null;
  const opportunityCount = org.opportunitiesCount || 0;

  const orgHref =
    href || {
      pathname: "/dashboard/connect/organizations",
      query: { org: org.id },
    };

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
      avatar={{
        src: org.logo?.url,
        fallbackLabel: (name || "?").charAt(0).toUpperCase(),
      }}
      title={name}
      description={description}
      chips={
        <>
          <OrganizationVerificationStatus verified={!!org.verified} />
          {location && (
            <Chip
              variant="static"
              label={location}
              leading={GLOBE_GLYPH}
              style={{
                background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
                backgroundColor: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
                color: "var(--MH-Theme-Neutrals-Black, #171717)",
                border: "1px solid var(--MH-Theme-Primary-Base, #69bbc4)",
              }}
            />
          )}
          {opportunityCount > 0 && (
            <Chip
              variant="static"
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
                background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
                backgroundColor: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
                color: "var(--MH-Theme-Neutrals-Black, #171717)",
              }}
            />
          )}
        </>
      }
      actions={
        <Link href={orgHref}>
          <Button variant="filled" aria-label={viewOrgLabel}>
            {organizationTypeLabel}
          </Button>
        </Link>
      }
    />
  );
}
