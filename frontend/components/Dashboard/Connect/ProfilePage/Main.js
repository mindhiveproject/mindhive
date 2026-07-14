import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import styled from "styled-components";
import { Icon } from "semantic-ui-react";

import { PUBLIC_USER_QUERY } from "../../../Queries/User";
import { languageOptions } from "../../../User/LanguageSelector";
import useTranslation from "next-translate/useTranslation";
import ManageFavorite from "../ManageFavorite";
import { getProfileImageUrl } from "../../../../lib/profileStudyImageUrls";

const pronouns = {
  he: "he/him/his",
  she: "she/her/hers",
  they: "they/them/theirs",
};

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

const imgBackground = "/assets/connect/background.svg";
const ConnectShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 48px;
  margin: 0px;
  background-color: #f7f9f8;
  background-image: url(${imgBackground});
  background-repeat: repeat;
  background-position: center top;
  background-attachment: fixed;
  background-size: auto;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;

  @media (max-width: 1024px) {
    padding: 32px 24px 48px;
  }
`;

export default function ProfilePage({ query, user }) {
  
  const { id } = query;
  const { t } = useTranslation("connect");
  const { data } = useQuery(PUBLIC_USER_QUERY, {
    variables: { id },
  });
  const profile = data?.profile || {};

  const language = languageOptions?.filter((l) => l.value === user?.language)[0];

  const pronoun = pronouns[profile.pronouns] || undefined;

  const connectionCount =
    profile?.connectionsCount ??
    profile?.connections?.length ??
    profile?.favoritePeople?.length ??
    0;

  // const availabilityChips = [
  //   profile?.involvement?.mentor?.async_answering_questions && t("asyncAnsweringQuestions"),
  //   profile?.involvement?.mentor?.async_providing_feedback && t("asyncProvidingFeedback"),
  //   profile?.involvement?.mentor?.sync_making_visit_in_person && t("syncInPersonVisit"),
  //   profile?.involvement?.mentor?.sync_making_visit_in_person_over_zoom && t("syncZoomVisit"),
  // ].filter(Boolean);

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

  const fullName = profile?.firstName || profile?.lastName
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
                  {(profile?.firstName || profile?.lastName)
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
                {/* <MetaItem>
                  <Icon name="users" />
                  <span>
                    {connectionCount} {t("connectionsLabel", { defaultValue: "Connections" })}
                  </span>
                </MetaItem> */}
              </ContactInfoRow>
              <ConnectActions>
                <FavoriteButton> 
                  <ManageFavorite user={user} profileId={profile?.id} />
                </FavoriteButton>
                {/* <ConnectButton type="button">
                  <img src="/assets/connect/group.svg" alt="" />
                  {t("connectAction", { defaultValue: "Connect" })}
                </ConnectButton> */}
              </ConnectActions>
            </HeaderContent>
            <Avatar>
              {avatar ? (
                <img
                  src={avatar}
                  alt={fullName}
                />
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

          {/* <Tabs>
            <Tab $active>{t("introductionVideo")}</Tab>
            <Tab>{t("backgroundTab", { defaultValue: "Background" })}</Tab>
            <Tab>{t("studiesTab", { defaultValue: "Studies" })}</Tab>
            <Tab>{t("skillsTab", { defaultValue: "Skills and Preferences" })}</Tab>
          </Tabs>

          <VideoSection>
            {profile?.introVideo?.filename ? (
              <VideoPlayer controls>
                <source
                  src={`/videos/${profile?.introVideo?.filename}`}
                  type="video/mp4"
                />
                {t("videoNotSupported")}
              </VideoPlayer>
            ) : (
              <VideoPlaceholder>
                {t("noVideoPlaceholder", {
                  defaultValue: "No introduction video available.",
                })}
              </VideoPlaceholder>
            )}
          </VideoSection> */}
        </ProfileCard>
      </ProfileShell>
    </ConnectShell>
  );
}

const ProfileShell = styled.div`
  display: flex;
  justify-content: center;
  padding: 32px 24px 64px;
`;

const ProfileCard = styled.div`
  width: 100%;
  max-width: 1104px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0px 4px 75px rgba(0, 0, 0, 0.1);
  padding: 48px clamp(24px, 4vw, 56px);
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  min-width: 0;
`;

const NameRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 15px;
  
  .h1 {
    font-family: "Inter", sans-serif;
    font-size: 46px;
    font-weight: 700;
    line-height: 52px;
    color: #171717;
    margin: 0;
  }
`;

const PronounTag = styled.span`
  padding: 6px 12px;
  border-radius: 8px;
  background: #edf2ee;
  color: #171717;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
`;

const Tagline = styled.p`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #171717;
`;

const ContactInfoRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
`;

const Avatar = styled.div`
  width: 116px;
  height: 116px;
  border-radius: 50%;
  border: 4px solid #434343;
  overflow: hidden;
  background: #d3e0e3;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: "Lato", sans-serif;
  font-size: 40px;
  color: #1d1b20;

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
    font-size: 40px;
    font-family: "Lato", sans-serif;
    color: #1d1b20;
  }
`;

const FavoriteButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MetaItem = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #171717;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;

  i.icon {
    color: #171717;
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    vertical-align: middle !important;
    flex-shrink: 0;
  }

  a, span {
    display: inline-flex;
    align-items: center;
    line-height: 20px;
  }

  a {
    color: #171717;
    text-decoration: none;
  }
`;

const ConnectActions = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const ConnectButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 24px;
  border-radius: 100px;
  border: 2px solid #336F8A;
  background: #336F8A;
  color: white;
  font-family: "Inter", sans-serif;
  font-weight: 800;
  font-size: 16px;
  line-height: 24px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  img {
    width: 22px;
    height: 16px;
    display: block;
    flex-shrink: 0;
    filter: brightness(0) invert(1);
  }

  &:hover {
    background: #336f8a;
    color: #ffffff;
  }
`;

const CardDivider = styled.div`
  width: 100%;
  height: 2px;
  background: #edf2ee;
`;

const ContentColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2.5fr) minmax(0, 1.5fr);
  gap: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  justify-content: flex-end;
  font-family: "Lato", sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: #171717;
`;

const BodyCopy = styled.p`
  margin: 0;
  font-family: "Lato", sans-serif;
  font-size: 16px;
  line-height: 24px;
  color: #2a343d;
  white-space: pre-line;
`;

const ChipContainer = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 8px;
`;

const ChipList = styled.div`
  display: flex;
  flex-direction: wrap;
  gap: 8px;
  width: 100%;
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const InterestTag = styled.span`
  display: inline-flex;
  align-items: flex-start;
  justify-content: center;
  width: fit-content;
  min-width: fit-content;
  min-height: 32px;
  height: fit-content;
  max-height: 64px;
  padding: 6px 12px;
  border-radius: 8px;
  // border: 1px solid #a1a1a1;
  background: #f3f3f3;
  color: #171717;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 12px;
  line-height: 20px;
  white-space: normal;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Tabs = styled.div`
  display: flex;
  gap: 24px;
  border-bottom: 2px solid #edf2ee;
  padding-bottom: 8px;
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-family: "Lato", sans-serif;
  font-size: 15px;
  color: ${({ $active }) => ($active ? "#171717" : "#3b3b3b")};
  border-bottom: ${({ $active }) => ($active ? "2px solid #F2BE42" : "2px solid transparent")};
  padding-bottom: 8px;
  cursor: pointer;
`;

const VideoSection = styled.div`
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.47);
  box-shadow: 0px 4px 75px rgba(0, 0, 0, 0.1);
`;

const VideoPlayer = styled.video`
  width: 100%;
  height: auto;
  display: block;
`;

const VideoPlaceholder = styled.div`
  padding: 48px;
  text-align: center;
  font-family: "Lato", sans-serif;
  font-size: 16px;
  color: #5f6871;
`;
