import { useMemo } from "react";
import Link from "next/link";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

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
  flex-direction: column;
  justify-content: space-between;
  width: 270px;
  height: 342px;
  border-radius: 12px;
  border: 2px solid #e4dff6;
  background: #ffffff;
  box-shadow: 0px 7px 64px rgba(0, 0, 0, 0.07);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0px 12px 64px rgba(0, 0, 0, 0.12);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 16px;
`;

const FavoriteWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;
`;

const CardLink = styled(Link)`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  text-decoration: none;
  color: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #336f8a;
    outline-offset: -2px;
  }
`;

const NameBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  padding: 0 16px 8px;

  .name {
    margin: 0;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    font-size: 15px;
    color: #1d1b20;
    letter-spacing: 0.015em;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .subtitle {
    margin: 4px 0 0;
    font-family: "Nunito", sans-serif;
    font-weight: 400;
    font-size: 13px;
    color: #49454f;
    letter-spacing: 0.02em;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const Media = styled.div`
  width: 100%;
  height: 160px;
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    font-family: "Lato", sans-serif;
    color: #1d1b20;
  }
`;

const Description = styled.div`
  padding: 16px;

  p {
    margin: 0;
    font-family: "Nunito", sans-serif;
    font-size: 14px;
    line-height: 20px;
    color: #49454f;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

export default function ConnectProfileCard({ user, profile }) {
  const { t } = useTranslation("connect");
  const fullName =
    profile?.firstName || profile?.lastName
      ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
      : profile?.name ||
        t("profileCard.defaultName", {}, { default: "MindHive Member" });

  const subtitle =
    profile?.organization ||
    profile?.permissions?.map((p) => p?.name).join(", ") ||
    t("profileCard.defaultCommunity", {}, { default: "MindHive Community" });

  const summary =
    profile?.bioInformal ||
    profile?.bio ||
    t("profileCard.defaultSummary", {}, { default: "Click to view profile" });

  const avatar = getProfileImageUrl(profile);
  const fallbackLetter = fullName.charAt(0).toUpperCase();
  const fallbackGradient = useMemo(() => {
    const key = profile?.id || profile?.publicId || fullName;
    return getGradientForProfile(key);
  }, [profile?.id, profile?.publicId, fullName]);

  if (!profile?.publicId) {
    return null;
  }

  const profileHref = {
    pathname: "/dashboard/connect/with",
    query: { id: profile.publicId },
  };

  const viewProfileLabel = t(
    "profileCard.viewProfile",
    { name: fullName },
    { default: "View profile of {{name}}" }
  );

  return (
    <CardContainer>
      <CardHeader>
        <FavoriteWrapper>
          <ManageFavorite user={user} profileId={profile?.id} />
        </FavoriteWrapper>
      </CardHeader>

      <CardLink href={profileHref} aria-label={viewProfileLabel}>
        <NameBlock>
          <p className="name">{fullName}</p>
          <p className="subtitle">{subtitle}</p>
        </NameBlock>

        <Media>
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
        </Media>

        <Description>
          <p>{summary}</p>
        </Description>
      </CardLink>
    </CardContainer>
  );
}
