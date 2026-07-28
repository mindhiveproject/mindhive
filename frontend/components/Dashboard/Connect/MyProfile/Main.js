import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Dropdown, Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import UpdateAvatarModal from "../../../Account/AvatarEditor/AvatarModal";
import { PUBLIC_USER_QUERY, GET_PROFILE } from "../../../Queries/User";
import { GET_TAGS } from "../../../Queries/Tag";
import { UPDATE_PROFILE } from "../../../Mutations/User";
import useForm from "../../../../lib/useForm";
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
  AvatarEditOverlay,
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
  FieldGrid,
  Field,
} from "../ProfilePage/styles";

function buildFormState(profile) {
  return {
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    pronouns: profile?.pronouns || "",
    tagline: profile?.tagline || "",
    email: profile?.email || "",
    organization: profile?.organization || "",
    department: profile?.department || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
    bioInformal: profile?.bioInformal || "",
    interestIds: (profile?.interests || []).map((i) => i?.id).filter(Boolean),
  };
}

export default function MyProfile({ user }) {
  const { t } = useTranslation("connect");
  const [editing, setEditing] = useState(false);
  const [freezeSync, setFreezeSync] = useState(false);

  const publicId = user?.publicId;
  const publicUserVariables = { id: publicId };

  const { data, loading } = useQuery(PUBLIC_USER_QUERY, {
    variables: publicUserVariables,
    skip: !publicId,
  });
  const profile = data?.profile || {};

  const { data: tagsData } = useQuery(GET_TAGS, { skip: !editing });
  const tags = tagsData?.tags || [];
  const tagOptions = tags.map((tag) => ({
    key: tag.id,
    text: tag.title,
    value: tag.id,
  }));

  const { inputs, handleChange, handleMultipleUpdate } = useForm(
    buildFormState(profile),
    { freezeInitialSync: freezeSync },
  );

  const [updateProfile, { loading: saving }] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [
      { query: PUBLIC_USER_QUERY, variables: publicUserVariables },
      { query: GET_PROFILE },
    ],
  });

  const pronoun = PRONOUNS_LABELS[profile.pronouns] || undefined;
  const interestChips =
    profile?.interests?.map((interest) => interest?.title).filter(Boolean) || [];

  const officialBio = profile?.bio || "";
  const unofficialBio = profile?.bioInformal || "";
  const hasBioContent = officialBio.trim() || unofficialBio.trim();
  const hasInterestChips = interestChips.length > 0;

  const orgLabel = profile?.organization || null;
  const orgDepartment = profile?.department || null;
  const hasOrgMeta = orgLabel || orgDepartment;
  const locationText = profile?.location || null;

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

  const avatarUser = useMemo(
    () => ({
      ...user,
      id: user?.id || profile?.id,
      image: profile?.image || user?.image,
    }),
    [user, profile?.id, profile?.image],
  );

  const pronounOptions = [
    {
      key: "she",
      text: t("basic.pronounsOptions.she", {}, { default: "She/Her" }),
      value: "she",
    },
    {
      key: "he",
      text: t("basic.pronounsOptions.he", {}, { default: "He/Him" }),
      value: "he",
    },
    {
      key: "they",
      text: t("basic.pronounsOptions.they", {}, { default: "They/Them" }),
      value: "they",
    },
    {
      key: "preferNotToSay",
      text: t("basic.pronounsOptions.preferNotToSay", {}, {
        default: "Prefer not to say",
      }),
      value: "preferNotToSay",
    },
  ];

  const startEditing = () => {
    handleMultipleUpdate(buildFormState(profile));
    setFreezeSync(true);
    setEditing(true);
  };

  const cancelEditing = () => {
    handleMultipleUpdate(buildFormState(profile));
    setFreezeSync(false);
    setEditing(false);
  };

  const onFieldChange = (e) => {
    setFreezeSync(true);
    handleChange(e);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      await updateProfile({
        variables: {
          id: user.id,
          input: {
            firstName: inputs.firstName,
            lastName: inputs.lastName,
            pronouns: inputs.pronouns || null,
            tagline: inputs.tagline,
            email: inputs.email,
            organization: inputs.organization,
            department: inputs.department,
            location: inputs.location,
            bio: inputs.bio,
            bioInformal: inputs.bioInformal,
            interests: {
              set: (inputs.interestIds || []).map((id) => ({ id })),
            },
          },
        },
      });
      setFreezeSync(false);
      setEditing(false);
    } catch {
      alert(
        t("createProfileFlow.saveError", {}, {
          default: "Something went wrong while saving. Please try again.",
        }),
      );
    }
  };

  if (!publicId) {
    return null;
  }

  if (loading && !data) {
    return (
      <ConnectShell>
        <ProfileShell>
          <ProfileCard>
            {t("loading", {}, { default: "Loading..." })}
          </ProfileCard>
        </ProfileShell>
      </ConnectShell>
    );
  }

  return (
    <ConnectShell>
      <ProfileShell>
        <ProfileCard>
          <HeaderSection>
            <HeaderContent>
              {editing ? (
                <FieldGrid>
                  <Field>
                    {t("basic.firstName", {}, { default: "First name" })}
                    <input
                      name="firstName"
                      value={inputs.firstName}
                      onChange={onFieldChange}
                    />
                  </Field>
                  <Field>
                    {t("basic.lastName", {}, { default: "Last name" })}
                    <input
                      name="lastName"
                      value={inputs.lastName}
                      onChange={onFieldChange}
                    />
                  </Field>
                  <Field>
                    {t("basic.pronouns", {}, { default: "Pronouns" })}
                    <Dropdown
                      selection
                      clearable
                      options={pronounOptions}
                      value={inputs.pronouns || null}
                      onChange={(_e, data) =>
                        onFieldChange({
                          target: { name: "pronouns", value: data.value || "" },
                        })
                      }
                      placeholder={t("basic.pronouns", {}, { default: "Pronouns" })}
                    />
                  </Field>
                  <Field className="fullWidth">
                    {t("basic.tagline", {}, { default: "Tagline" })}
                    <input
                      name="tagline"
                      value={inputs.tagline}
                      onChange={onFieldChange}
                    />
                  </Field>
                  <Field className="fullWidth">
                    {t("basic.email", {}, { default: "Email" })}
                    <input
                      name="email"
                      type="email"
                      value={inputs.email}
                      onChange={onFieldChange}
                    />
                  </Field>
                  <Field>
                    {t("basic.organization", {}, { default: "Organization" })}
                    <input
                      name="organization"
                      value={inputs.organization}
                      onChange={onFieldChange}
                    />
                  </Field>
                  <Field>
                    {t(
                      "createProfileFlow.basic.organizationFields.department",
                      {},
                      { default: "Department" },
                    )}
                    <input
                      name="department"
                      value={inputs.department}
                      onChange={onFieldChange}
                    />
                  </Field>
                  <Field className="fullWidth">
                    {t("basic.location", {}, { default: "Location" })}
                    <input
                      name="location"
                      value={inputs.location}
                      onChange={onFieldChange}
                    />
                  </Field>
                </FieldGrid>
              ) : (
                <>
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
                        <span>
                          {orgLabel}
                          {orgDepartment ? ` · ${orgDepartment}` : ""}
                        </span>
                      </MetaItem>
                    )}
                    {locationText && (
                      <MetaItem>
                        <Icon name="compass" />
                        <span>{locationText}</span>
                      </MetaItem>
                    )}
                  </ContactInfoRow>
                </>
              )}

              <ConnectActions>
                {editing ? (
                  <>
                    <Button
                      type="button"
                      variant="filled"
                      disabled={saving}
                      onClick={handleSave}
                    >
                      {t("saveProfile", {}, { default: "Save" })}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={saving}
                      onClick={cancelEditing}
                    >
                      {t("cancelEdit", {}, { default: "Cancel" })}
                    </Button>
                  </>
                ) : (
                  <Button type="button" variant="outline" onClick={startEditing}>
                    {t("editProfile", {}, { default: "Edit profile" })}
                  </Button>
                )}
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
              {editing && (
                <AvatarEditOverlay>
                  <UpdateAvatarModal
                    user={avatarUser}
                    refetchQueries={[
                      {
                        query: PUBLIC_USER_QUERY,
                        variables: publicUserVariables,
                      },
                    ]}
                  />
                </AvatarEditOverlay>
              )}
            </Avatar>
          </HeaderSection>

          <CardDivider />

          {editing ? (
            <ContentColumns>
              <MainColumn>
                <Section>
                  <SectionTitle>{t("officialBio")}</SectionTitle>
                  <Field>
                    <textarea
                      name="bio"
                      value={inputs.bio}
                      onChange={onFieldChange}
                    />
                  </Field>
                </Section>
                <Section>
                  <SectionTitle>{t("unofficialBio")}</SectionTitle>
                  <Field>
                    <textarea
                      name="bioInformal"
                      value={inputs.bioInformal}
                      onChange={onFieldChange}
                    />
                  </Field>
                </Section>
              </MainColumn>
              <SideColumn>
                <ChipContainer>
                  <SectionTitle>{t("interests.interests")}</SectionTitle>
                  <Dropdown
                    placeholder={t("interests.interests")}
                    fluid
                    multiple
                    search
                    selection
                    options={tagOptions}
                    onChange={(_e, data) =>
                      onFieldChange({
                        target: { name: "interestIds", value: data.value },
                      })
                    }
                    value={inputs.interestIds || []}
                  />
                </ChipContainer>
              </SideColumn>
            </ContentColumns>
          ) : (
            (hasBioContent || hasInterestChips) && (
              <>
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
            )
          )}
        </ProfileCard>
      </ProfileShell>
    </ConnectShell>
  );
}
