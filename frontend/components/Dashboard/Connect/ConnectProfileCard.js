import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styled, { css } from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../DesignSystem/Chip";
import IconButton from "../../DesignSystem/IconButton";
import ManageFavorite from "./ManageFavorite";
import { getProfileImageUrl } from "../../../lib/profileStudyImageUrls";

const FALLBACK_COLORS = [
  "#DEF8FB",
  "#FDF2D0",
  "#EDCECD",
  "#D8D3E7",
  "#D3E2F1",
  "#D3E0E3",
];

const getGradientForProfile = (profileKey) => {
  if (!profileKey) {
    return FALLBACK_COLORS[0];
  }

  let hash = 0;
  for (let i = 0; i < profileKey.length; i += 1) {
    hash = (hash << 5) - hash + profileKey.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[index];
};

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

const infoClusterStyles = css`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
  flex: 1;
  text-decoration: none;
  color: inherit;
`;

const InfoClusterLink = styled(Link)`
  ${infoClusterStyles}
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
    border-radius: 8px;
  }
`;

const InfoClusterStatic = styled.div`
  ${infoClusterStyles}
`;

const Avatar = styled.div`
  width: 86px;
  height: 86px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  
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
    color: var(--MH-Theme-Neutrals-Black, #171717);
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
    font-family: "Inter", sans-serif;
    font-weight: 600;
    font-size: 16px;
    line-height: 24px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    word-break: break-word;
  }

  .occupation {
    margin: 0;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 24px;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    word-break: break-word;
  }
`;

const ChipLeading = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  flex-shrink: 0;
`;

const Tagline = styled.p`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const ExternalLinkIcon = (
  <img
    src="/assets/icons/builder/medium-arrow-outward.svg"
    alt=""
    width={24}
    height={24}
    aria-hidden
  />
);

export default function ConnectProfileCard({
  user,
  profile,
  actions = null,
}) {
  const { t } = useTranslation("connect");
  const router = useRouter();

  const fullName =
    profile?.firstName || profile?.lastName
      ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
      : profile?.name ||
        t("profileCard.defaultName", {}, { default: "MindHive Member" });

  const occupation = profile?.occupation?.trim() || null;

  const linkedOrg = profile?.organizations?.[0] || null;
  const orgLabel =
    profile?.organization?.trim() || linkedOrg?.name?.trim() || null;
  const orgLogoUrl = linkedOrg?.logo?.url || null;

  const tagline = profile?.tagline?.trim() || null;

  const avatar = getProfileImageUrl(profile);
  const fallbackLetter = fullName.charAt(0).toUpperCase();
  const fallbackGradient = useMemo(() => {
    const key = profile?.id || profile?.publicId || fullName;
    return getGradientForProfile(key);
  }, [profile?.id, profile?.publicId, fullName]);

  if (!profile) {
    return null;
  }

  const profileHref = profile.publicId
    ? {
        pathname: "/dashboard/connect/with",
        query: { id: profile.publicId },
      }
    : null;

  const viewProfileLabel = t(
    "profileCard.viewProfile",
    { name: fullName },
    { default: "View profile of {{name}}" }
  );

  const infoContent = (
    <>
      <Avatar>
        {avatar ? (
          <img src={avatar} alt="" />
        ) : (
          <div
            className="fallback"
            style={{ background: fallbackGradient }}
            aria-hidden
          >
            {fallbackLetter}
          </div>
        )}
      </Avatar>

      <TextColumn>
        <NameBlock>
          <p className="name">{fullName}</p>
          {occupation && <p className="occupation">{occupation}</p>}
        </NameBlock>

        {orgLabel && (
          <Chip
            label={orgLabel}
            style={{ width: "fit-content" }}
            leading={
              <ChipLeading
                src={orgLogoUrl || "/assets/connect/building.svg"}
                alt=""
              />
            }
          />
        )}

        {tagline && <Tagline>{tagline}</Tagline>}
      </TextColumn>
    </>
  );

  return (
    <CardContainer>
      {profileHref ? (
        <InfoClusterLink href={profileHref} aria-label={viewProfileLabel}>
          {infoContent}
        </InfoClusterLink>
      ) : (
        <InfoClusterStatic>{infoContent}</InfoClusterStatic>
      )}

      <Actions>
        {actions}
        <ManageFavorite user={user} profileId={profile?.id} />
        {profileHref ? (
          <IconButton
            variant="outline"
            style={{ borderColor: "#A1A1A1" }}
            icon={ExternalLinkIcon}
            ariaLabel={viewProfileLabel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(profileHref);
            }}
          />
        ) : null}
      </Actions>
    </CardContainer>
  );
}
