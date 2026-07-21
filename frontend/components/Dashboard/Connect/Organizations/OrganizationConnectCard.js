import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../../DesignSystem/Chip";
import IconButton from "../../../DesignSystem/IconButton";

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

function VerifiedBadge({ t }) {
  return (
    <span
      role="img"
      aria-label={t("a11y.verified", {}, { default: "Verified" })}
      style={{ display: "inline-flex", lineHeight: 0, flexShrink: 0 }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="#1d6b3a"
        aria-hidden
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    </span>
  );
}

export default function OrganizationConnectCard({ org }) {
  const { t } = useTranslation("connect");
  const router = useRouter();

  if (!org?.id) {
    return null;
  }

  const name = org.name || "";
  const location = org.location?.trim() || null;
  const tagline = org.tagline?.trim() || null;
  const mission = org.mission?.trim() || null;
  const oppCount = org.opportunitiesCount || 0;
  const fallbackLetter = (name || "?").charAt(0).toUpperCase();

  const orgHref = {
    pathname: "/dashboard/connect/organizations",
    query: { org: org.id },
  };

  const viewOrgLabel = t(
    "organizationsList.viewOrganization",
    { name },
    { default: "View organization {{name}}" }
  );

  const opportunityLabel =
    oppCount === 1
      ? t(
          "organizationsList.opportunityCount.one",
          { count: oppCount },
          { default: "{{count}} opportunity" }
        )
      : t(
          "organizationsList.opportunityCount.many",
          { count: oppCount },
          { default: "{{count}} opportunities" }
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
              {name}
              {org.verified && <VerifiedBadge t={t} />}
            </p>
            {location && <p className="location">{location}</p>}
          </NameBlock>

          {/* <Chip
            label={opportunityLabel}
            shape="square"
            style={{ width: "fit-content" }}
            leading={
              <ChipLeading
                src="/assets/connect/briefcase.svg"
                alt=""
                aria-hidden
              />
            }
          /> */}

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
            router.push(orgHref);
          }}
        />
      </Actions>
    </CardContainer>
  );
}
