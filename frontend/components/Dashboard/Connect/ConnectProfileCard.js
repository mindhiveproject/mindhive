import { useMemo } from "react";
import Link from "next/link";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import ConnectCard from "./ConnectCard";
import TruncatingChip from "./TruncatingChip";
import ManageFavorite from "./ManageFavorite";
import { getProfileImageUrl } from "../../../lib/profileStudyImageUrls";
import { normalizeOrganizationNames } from "../../../lib/organizationLabels";

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

const ChipLeading = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  flex-shrink: 0;
`;

export default function ConnectProfileCard({ user, profile, actions = null }) {
  const { t } = useTranslation("connect");

  const fullName =
    profile?.firstName || profile?.lastName
      ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
      : profile?.name ||
        t("profileCard.defaultName", {}, { default: "MindHive Member" });

  const avatar = getProfileImageUrl(profile);
  const fallbackGradient = useMemo(() => {
    const key = profile?.id || profile?.publicId || fullName;
    return getGradientForProfile(key);
  }, [profile?.id, profile?.publicId, fullName]);

  if (!profile) {
    return null;
  }

  const occupation = profile?.occupation?.trim() || null;
  const description =
    profile?.tagline?.trim() || profile?.bioInformal?.trim() || null;


  const linkedOrgTags = (profile?.organizations || [])
    .filter((org) => org?.name?.trim())
    .map((org) => ({
      key: org.id,
      label: org.name.trim(),
      logoUrl: org.logo?.url || null,
    }));

  const orgTags = linkedOrgTags.length
    ? linkedOrgTags
    : normalizeOrganizationNames(profile?.organization).map((label, i) => ({
        key: `organization-${i}`,
        label,
        logoUrl: null,
      }));

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

  const profileButtonLabel = t(
    "profileCard.profileButton",
    {},
    { default: "Profile" }
  );

  const typeLabel = t(
    "profileCard.typeLabel",
    {},
    { default: "Connect Profile" }
  );

  return (
    <ConnectCard
      typeLabel={typeLabel}
      avatar={{
        src: avatar,
        fallbackLabel: fullName.charAt(0).toUpperCase(),
        fallbackBackground: fallbackGradient,
      }}
      title={fullName}
      subtitle={occupation}
      chipsDirection="column"
      chips={
        orgTags.length
          ? orgTags.map((tag) => (
              <TruncatingChip
                key={tag.key}
                avatar
                label={tag.label}
                leading={
                  <ChipLeading
                    src={tag.logoUrl || "/assets/connect/building.svg"}
                    alt=""
                  />
                }
              />
            ))
          : null
      }
      description={description}
      actions={
        <>
          {actions}
          <ManageFavorite user={user} profileId={profile?.id} />
          {profileHref ? (
            <Link href={profileHref}>
              <Button variant="filled" aria-label={viewProfileLabel}>
                {profileButtonLabel}
              </Button>
            </Link>
          ) : null}
        </>
      }
    />
  );
}
