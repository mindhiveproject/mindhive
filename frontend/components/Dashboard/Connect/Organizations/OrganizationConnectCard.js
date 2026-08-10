import Link from "next/link";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../../DesignSystem/Chip";
import IconButton from "../../../DesignSystem/IconButton";
import OrganizationVerificationStatus from "./OrganizationVerificationStatus";

const CardContainer = styled.article`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-width: 0;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  box-sizing: border-box;
`;

const InfoCluster = styled(Link)`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
  flex: 1;
  text-decoration: none;
  color: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
    border-radius: 8px;
  }
`;

const Avatar = styled.div`
  width: 86px;
  height: 86px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-family: "Inter", sans-serif;
    font-weight: 600;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

const TextColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  flex: 1;
`;

const NameBlock = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  .name {
    margin: 0;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    font-family: "Inter", sans-serif;
    font-weight: 600;
    font-size: 16px;
    line-height: 24px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    word-break: break-word;
  }

  .location {
    margin: 0;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 24px;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    word-break: break-word;
  }
`;

const Tagline = styled.p`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  font-style: italic;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
`;

const Mission = styled.p`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 13px;
  line-height: 1.4;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  align-self: center;
`;

const ChipLeading = styled.img`
  width: 18px;
  height: 18px;
  display: block;
  flex-shrink: 0;
`;

const ArrowOutwardIcon = (
  <img
    src="/assets/icons/builder/medium-arrow-outward.svg"
    alt=""
    width={24}
    height={24}
    aria-hidden
  />
);

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
}) {
  const { t } = useTranslation("connect");

  if (!org?.id) {
    return null;
  }

  const name = org.name || "";
  const location = org.location?.trim() || null;
  const tagline = org.tagline?.trim() || null;
  const mission = org.mission?.trim() || null;
  const fallbackLetter = (name || "?").charAt(0).toUpperCase();

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
    <CardContainer>
      <InfoCluster href={orgHref} aria-label={viewOrgLabel}>
        <Avatar>
          {org.logo?.url ? (
            <img src={org.logo.url} alt="" />
          ) : (
            <div className="fallback" aria-hidden>
              {fallbackLetter}
            </div>
          )}
        </Avatar>

        <TextColumn>
          <NameBlock>
            <p className="name">
              <span>{name}</span>
              <OrganizationVerificationStatus
                verified={!!org.verified}
                size="compact"
              />
            </p>
            {location && <p className="location">{location}</p>}
          </NameBlock>

          {tagline && <Tagline>{tagline}</Tagline>}
          {mission && <Mission>{mission}</Mission>}
        </TextColumn>
      </InfoCluster>

      <Actions>
        <IconButton
          variant="outline"
          style={{
            borderColor: "var(--MH-Theme-Primary-Dark, #336F8A)",
            color: "var(--MH-Theme-Primary-Dark, #336F8A)",
          }}
          icon={ArrowOutwardIcon}
          ariaLabel={viewOrgLabel}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (orgUrl) {
              window.open(orgUrl, "_blank", "noopener,noreferrer");
            }
          }}
        />
      </Actions>
    </CardContainer>
  );
}
