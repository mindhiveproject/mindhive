import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import { Icon } from "semantic-ui-react";

import { PUBLIC_USER_QUERY } from "../../../Queries/User";
import useTranslation from "next-translate/useTranslation";
import ManageFavorite from "../ManageFavorite";
import { getProfileImageUrl } from "../../../../lib/profileStudyImageUrls";
import {
  PRONOUNS_LABELS,
  getGradientForProfile,
  ConnectShell,
  ProfileShell,
  ProfileCard,
  HeaderSection,
  HeaderContent,
  NameRow,
  PronounTag,
  Tagline,
  ContactInfoRow,
  Avatar,
  FavoriteButton,
  MetaItem,
  ConnectActions,
  CardDivider,
  ContentColumns,
  MainColumn,
  SideColumn,
  Section,
  SectionTitle,
  BodyCopy,
  ChipContainer,
  ChipList,
  InterestTag,
} from "./styles";

export default function ProfilePage({ query, user }) {
  const { id } = query;
  const { t } = useTranslation("connect");
  const { data } = useQuery(PUBLIC_USER_QUERY, {
    variables: { id },
  });
  const profile = data?.profile || {};

  const pronoun = PRONOUNS_LABELS[profile.pronouns] || undefined;

  const interestChips =
    profile?.interests?.map((interest) => interest?.title).filter(Boolean) || [];

  const officialBio = profile?.bio || "";
  const unofficialBio = profile?.bioInformal || "";
  const hasBioContent = officialBio.trim() || unofficialBio.trim();

  const linkedOrg = profile?.organizations?.[0] || null;
  const orgLabel = profile?.organization || linkedOrg?.name || null;
  const orgDepartment = profile?.department || null;
  const hasOrgMeta = orgLabel || orgDepartment;

  const locationText = profile?.location || null;
  const hasInterestChips = interestChips.length > 0;

  const fullName =
    profile?.firstName || profile?.lastName
      ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
      : profile?.username || "MindHive Member";

  const avatar = getProfileImageUrl(profile);
  const fallbackLetter = fullName.charAt(0).toUpperCase();
  const fallbackGradient = useMemo(() => {
    const key = profile?.id || profile?.publicId || fullName;
    return getGradientForProfile(key);
  }, [profile?.id, profile?.publicId, fullName]);

  return (
    <ConnectShell>
      <ProfileShell>
        <ProfileCard>
          <HeaderSection>
            <HeaderContent>
              <NameRow>
                <h1 className="h1">
                  {profile?.firstName || profile?.lastName
                    ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
                    : profile?.username || ""}
                </h1>
                {pronoun && <PronounTag>{pronoun}</PronounTag>}
              </NameRow>
              {profile?.tagline && <Tagline>{profile?.tagline}</Tagline>}
              <ContactInfoRow>
                {profile?.email && (
                  <MetaItem>
                    <Icon name="send" />
                    <a href={`mailto:${profile?.email}`}>{profile?.email}</a>
                  </MetaItem>
                )}
                {hasOrgMeta && (
                  <MetaItem>
                    <Icon name="building outline" />
                    {linkedOrg?.id ? (
                      <Link
                        href={{
                          pathname: "/dashboard/connect/organizations",
                          query: { org: linkedOrg.id },
                        }}
                        aria-label={t(
                          "organizationsDetail.viewOrganization",
                          { name: orgLabel || linkedOrg.name },
                          { default: "View organization {{name}}" },
                        )}
                      >
                        {orgLabel}
                        {orgDepartment ? ` · ${orgDepartment}` : ""}
                      </Link>
                    ) : (
                      <span>
                        {orgLabel}
                        {orgDepartment ? ` · ${orgDepartment}` : ""}
                      </span>
                    )}
                  </MetaItem>
                )}
                {locationText && (
                  <MetaItem>
                    <Icon name="compass" />
                    <span>{locationText}</span>
                  </MetaItem>
                )}
              </ContactInfoRow>
              <ConnectActions>
                <FavoriteButton>
                  <ManageFavorite user={user} profileId={profile?.id} />
                </FavoriteButton>
              </ConnectActions>
            </HeaderContent>
            <Avatar>
              {avatar ? (
                <img src={avatar} alt={fullName} />
              ) : (
                <div className="fallback" style={{ background: fallbackGradient }}>
                  {fallbackLetter}
                </div>
              )}
            </Avatar>
          </HeaderSection>

          {(hasBioContent || hasInterestChips) && (
            <>
              <CardDivider />

              {hasBioContent && hasInterestChips ? (
                <ContentColumns>
                  <MainColumn>
                    {officialBio.trim() && (
                      <Section>
                        <SectionTitle>{t("officialBio")}</SectionTitle>
                        <BodyCopy>{officialBio}</BodyCopy>
                      </Section>
                    )}
                    {unofficialBio.trim() && (
                      <Section>
                        <SectionTitle>{t("unofficialBio")}</SectionTitle>
                        <BodyCopy>{unofficialBio}</BodyCopy>
                      </Section>
                    )}
                  </MainColumn>

                  <SideColumn>
                    <ChipContainer>
                      <SectionTitle>{t("interests.interests")}</SectionTitle>
                      <ChipList>
                        {interestChips.map((label) => (
                          <InterestTag key={label}>{label}</InterestTag>
                        ))}
                      </ChipList>
                    </ChipContainer>
                  </SideColumn>
                </ContentColumns>
              ) : hasBioContent ? (
                <MainColumn>
                  {officialBio.trim() && (
                    <Section>
                      <SectionTitle>{t("officialBio")}</SectionTitle>
                      <BodyCopy>{officialBio}</BodyCopy>
                    </Section>
                  )}
                  {unofficialBio.trim() && (
                    <Section>
                      <SectionTitle>{t("unofficialBio")}</SectionTitle>
                      <BodyCopy>{unofficialBio}</BodyCopy>
                    </Section>
                  )}
                </MainColumn>
              ) : (
                <ChipContainer>
                  <SectionTitle>{t("interests.interests")}</SectionTitle>
                  <ChipList>
                    {interestChips.map((label) => (
                      <InterestTag key={label}>{label}</InterestTag>
                    ))}
                  </ChipList>
                </ChipContainer>
              )}
            </>
          )}
        </ProfileCard>
      </ProfileShell>
    </ConnectShell>
  );
}
