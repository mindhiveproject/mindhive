import { useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";

import ManageFavorite from "./ManageFavorite";

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

const CardContainer = styled.div`
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
  cursor: pointer;

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

const FavoriteAndName = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
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

  > div {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }
`;

const NameBlock = styled.div`
  flex: 1;
  min-width: 0;

  .name {
    margin: 0;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    font-size: 15px;
    color: #1d1b20;
    letter-spacing: 0.015em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .subtitle {
    margin: 4px 0 0;
    font-family: "Nunito", sans-serif;
    font-weight: 400;
    font-size: 13px;
    color: #49454f;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
  const router = useRouter();
  const fullName =
    profile?.firstName || profile?.lastName
      ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
      : profile?.name || "MindHive Member";

  const subtitle =
    profile?.organization ||
    profile?.permissions?.map((p) => p?.name).join(", ") ||
    "MindHive Community";

  const summary =
    profile?.bioInformal ||
    profile?.bio ||
    "Click to view profile"

  const avatar = profile?.image?.image?.publicUrlTransformed;
  const fallbackLetter = fullName.charAt(0).toUpperCase();
  const fallbackGradient = useMemo(() => {
    const key = profile?.id || profile?.publicId || fullName;
    return getGradientForProfile(key);
  }, [profile?.id, profile?.publicId, fullName]);

  const handleNavigate = useCallback(() => {
    if (!profile?.publicId) {
      return;
    }

    router.push({
      pathname: `/dashboard/connect/with`,
      query: {
        id: profile?.publicId,
      },
    });
  }, [router, profile?.publicId]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleNavigate();
      }
    },
    [handleNavigate]
  );

  return (
    <CardContainer
      role="button"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
    >
      <CardHeader>
        <FavoriteAndName>
          <FavoriteWrapper>
            <ManageFavorite user={user} profileId={profile?.id} />
          </FavoriteWrapper>
          <NameBlock>
            <p className="name">{fullName}</p>
            <p className="subtitle">{subtitle}</p>
          </NameBlock>
        </FavoriteAndName>
      </CardHeader>

      <Media>
        {avatar ? (
          <img src={avatar} alt={fullName} />
        ) : (
          <div className="fallback" style={{ background: fallbackGradient }}>
            {fallbackLetter}
          </div>
        )}
      </Media>

      <Description>
        <p>{summary}</p>
      </Description>
    </CardContainer>
  );
}

