import useForm from "../../../../../lib/useForm";
import UpdateAvatarModal from "../../../../Account/AvatarEditor/AvatarModal";
import IdentIcon from "../../../../Account/IdentIcon";
import { Dropdown } from "semantic-ui-react";
import { useApolloClient, useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";
import {
  CREATE_ORGANIZATION,
  UPDATE_ORGANIZATION,
} from "../../../../Mutations/Organization";
import { FIND_ORG_FOR_PROFILE_SAVE } from "../../../../Queries/Organization";

import { StyledInput } from "../../../../styles/StyledForm";
import { StyledSaveButton } from "../../../../styles/StyledProfile";
import { useState, useEffect } from "react";
import { getProfileImageUrl } from "../../../../../lib/profileStudyImageUrls";
import {
  resolveLinkedOrganization,
  resolveProfileType,
} from "../../../../../lib/profileEditNavigation";

const PRIMARY_DOMAIN_KEYS = [
  "academic",
  "government",
  "industry",
  "nonprofit",
  "other",
];

export default function BasicInformation({ query, user, onDirtyChange }) {
  const { t } = useTranslation("connect");
  const apolloClient = useApolloClient();
  const [changed, setChanged] = useState(false);
  const [savedOrgId, setSavedOrgId] = useState(null);
  const profileImageUrl = getProfileImageUrl(user);

  const profileType = resolveProfileType(query, user);
  const isOrganization = profileType === "organization";

  // For org-type profiles, source the displayed values from the first linked
  // Organization (with a fallback to the legacy Profile-level fields so users
  // who haven't migrated yet still see their old data).
  const linkedOrg = resolveLinkedOrganization(user);
  const orgId = linkedOrg?.id || savedOrgId;
  const existingOrg = linkedOrg || (savedOrgId ? { id: savedOrgId } : null);

  // Pending logo file (set when the user picks one but before they hit Save).
  const [logoUpload, setLogoUpload] = useState(null);
  const MAX_LOGO_BYTES = 10 * 1024 * 1024; // 10 MB

  const { inputs, handleChange } = useForm(
    isOrganization
      ? {
          organization: existingOrg?.name || user?.organization,
          department: existingOrg?.department || user?.department,
          website: existingOrg?.website || user?.website,
          location: existingOrg?.location || user?.location,
          primaryDomain:
            existingOrg?.primaryDomain || user?.primaryDomain,
          bio: existingOrg?.mission || user?.bio,
          profileType,
        }
      : {
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email,
          pronouns: user?.pronouns,
          location: user?.location,
          organization: user?.organization,
          tagline: user?.tagline,
          profileType,
        },
    { freezeInitialSync: changed },
  );

  useEffect(() => {
    onDirtyChange?.(changed);
  }, [changed, onDirtyChange]);

  const basicTitle = profileType
    ? t(`createProfileFlow.basic.title.${profileType}`, {}, { default: t("basic.title") })
    : t("basic.title");

  const basicDescription = profileType
    ? t(`createProfileFlow.basic.description.${profileType}`, {}, { default: t("basic.description") })
    : t("basic.description");

  const primaryDomainOptions = PRIMARY_DOMAIN_KEYS.map((key) => ({
    key,
    text: t(`createProfileFlow.basic.organizationFields.primaryDomainOptions.${key}`, {}, {
      default: key,
    }),
    value: key,
  }));

  const handleUpdate = (data) => {
    setChanged(true);
    handleChange(data);
  };

  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: GET_PROFILE }],
  });
  const [createOrganization] = useMutation(CREATE_ORGANIZATION, {
    refetchQueries: [{ query: GET_PROFILE }],
  });
  const [updateOrganization] = useMutation(UPDATE_ORGANIZATION, {
    refetchQueries: [{ query: GET_PROFILE }],
  });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (isOrganization) {
        // Org-type profiles: write the org-level fields to an Organization
        // record. Create one if the user doesn't have one yet (auto-migration
        // for legacy sponsor accounts), otherwise update the existing one.
        // Only profileType is written to the Profile itself.
        const orgInput = {
          name: inputs?.organization || "",
          department: inputs?.department || "",
          website: inputs?.website || "",
          location: inputs?.location || "",
          primaryDomain: inputs?.primaryDomain || null,
          mission: inputs?.bio || "",
          updatedAt: new Date().toISOString(),
        };
        // Only include the logo field when the user actually picked a new file.
        if (logoUpload) {
          orgInput.logo = { upload: logoUpload };
        }
        let targetOrgId = orgId;

        // Legacy / partial saves: org may exist in the DB without appearing on
        // user.organizations (e.g. created on a prior save before refetch).
        if (!targetOrgId && orgInput.name && user?.id) {
          const { data: lookupData } = await apolloClient.query({
            query: FIND_ORG_FOR_PROFILE_SAVE,
            variables: { name: orgInput.name, profileId: user.id },
            fetchPolicy: "network-only",
          });
          targetOrgId = lookupData?.organizations?.[0]?.id || null;
        }

        if (targetOrgId) {
          const updateInput = { ...orgInput };
          const isMember = (user?.organizations || []).some(
            (org) => org?.id === targetOrgId,
          );
          if (!isMember) {
            updateInput.members = { connect: [{ id: user?.id }] };
          }
          await updateOrganization({
            variables: { id: targetOrgId, input: updateInput },
          });
          setSavedOrgId(targetOrgId);
        } else if (orgInput.name) {
          const { data: createData } = await createOrganization({
            variables: {
              input: {
                ...orgInput,
                members: { connect: [{ id: user?.id }] },
              },
            },
          });
          setSavedOrgId(createData?.createOrganization?.id || null);
        }
        setLogoUpload(null);
        await updateProfile({
          variables: {
            id: user?.id,
            input: { profileType: "organization" },
          },
        });
      } else {
        await updateProfile({
          variables: { id: user?.id, input: { ...inputs } },
        });
      }
      setChanged(false);
    } catch {
      alert(
        t("createProfileFlow.saveError", {}, {
          default: "Something went wrong while saving. Please try again.",
        }),
      );
    }
  }

  const photoLabel = isOrganization
    ? t("createProfileFlow.basic.organizationFields.companyPicture", {}, { default: t("basic.profilePhoto") })
    : t("basic.profilePhoto");

  return (
    <div className="profileBlock">
      <div>
        <div className="title">{basicTitle}</div>
        <p>{basicDescription}</p>
      </div>

      <p className="fieldLabel">{photoLabel}</p>
      <div>
        {profileImageUrl ? (
          <div
            style={{
              borderRadius: "50%",
              width: "128px",
              height: "128px",
              padding: "3px",
              background:
                "conic-gradient(from 180deg, #39B7D4 0%, #FDBA32 20%, #ED6B59 45%, #7C66C2 65%, #4183C4 85%, #5E8C9A 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={profileImageUrl}
              alt={user?.username}
              style={{
                borderRadius: "50%",
                width: "120px",
                height: "120px",
                objectFit: "cover",
                objectPosition: "center",
                border: "none",
              }}
            />
          </div>
        ) : (
          <div>
            <IdentIcon size="120" value={user?.username} />
          </div>
        )}
        <UpdateAvatarModal user={user} />
      </div>

      <StyledInput>
        {isOrganization ? (
          <>
            <div className="inputLineBlock">
              <p className="fieldLabel">
                {t("createProfileFlow.basic.organizationFields.companyName", {}, { default: t("basic.organization") })}
              </p>
              <input
                type="text"
                name="organization"
                value={inputs?.organization || ""}
                onChange={handleUpdate}
                required
              />
            </div>

            <div className="inputLineBlock">
              <p className="fieldLabel">Organization logo</p>
              <p style={{ fontSize: 13, color: "#5f6871", marginTop: 0 }}>
                A square logo works best (JPG, PNG, or WEBP). Up to{" "}
                {MAX_LOGO_BYTES / 1024 / 1024} MB.
              </p>
              {(existingOrg?.logo?.url || logoUpload) && (
                <div style={{ marginBottom: 8 }}>
                  <img
                    src={
                      logoUpload
                        ? URL.createObjectURL(logoUpload)
                        : existingOrg?.logo?.url
                    }
                    alt="Organization logo preview"
                    style={{
                      width: 96,
                      height: 96,
                      objectFit: "cover",
                      borderRadius: 12,
                      border: "1px solid #d3dae0",
                    }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) {
                    setLogoUpload(null);
                    return;
                  }
                  if (!file.type.startsWith("image/")) {
                    alert("Please pick an image file (JPG, PNG, WEBP, etc.).");
                    return;
                  }
                  if (file.size > MAX_LOGO_BYTES) {
                    alert(
                      `Logo is too large (${Math.round(
                        file.size / 1024 / 1024,
                      )} MB). Maximum is ${MAX_LOGO_BYTES / 1024 / 1024} MB.`,
                    );
                    return;
                  }
                  setLogoUpload(file);
                  setChanged(true);
                }}
              />
              {logoUpload && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#1d8f47",
                    marginTop: 4,
                  }}
                >
                  Ready to upload: {logoUpload.name} (
                  {Math.round(logoUpload.size / 1024)} KB)
                </div>
              )}
            </div>

            <div className="inputLineBlock">
              <p className="fieldLabel">
                {t("createProfileFlow.basic.organizationFields.department", {}, { default: "Department / Division" })}
              </p>
              <input
                type="text"
                name="department"
                value={inputs?.department || ""}
                onChange={handleUpdate}
                placeholder={t("createProfileFlow.basic.organizationFields.departmentPlaceholder", {}, {
                  default: "e.g., Urban Mobility Lab",
                })}
              />
            </div>

            <div className="inputLineBlock">
              <p className="fieldLabel">
                {t("createProfileFlow.basic.organizationFields.website", {}, { default: "Organization/Company Website" })}
              </p>
              <input
                type="url"
                name="website"
                value={inputs?.website || ""}
                onChange={handleUpdate}
              />
            </div>

            <div className="inputLineBlock">
              <p className="fieldLabel">
                {t("createProfileFlow.basic.organizationFields.location", {}, { default: t("basic.location") })}
              </p>
              <p>
                {t("createProfileFlow.basic.organizationFields.locationDescription", {}, {
                  default: "Please list the city and state/country where you'll be operating from.",
                })}
              </p>
              <input
                type="text"
                name="location"
                value={inputs?.location || ""}
                onChange={handleUpdate}
              />
            </div>

            <div className="inputLineBlock">
              <p className="fieldLabel">
                {t("createProfileFlow.basic.organizationFields.primaryDomain", {}, { default: "Sponsor's Primary Domain" })}
              </p>
              <Dropdown
                fluid
                selection
                options={primaryDomainOptions.filter(opt => 
                  (typeof opt.value === 'string' ? opt.value.toLowerCase() !== 'other' : true)
                )}
                value={
                  (typeof inputs?.primaryDomain === 'string' && inputs?.primaryDomain.toLowerCase() === 'other')
                    ? ""
                    : inputs?.primaryDomain || ""
                }
                onChange={(_, data) => {
                  // Prevent selecting "other" if it's still present due to async props
                  if (
                    typeof data.value === "string" &&
                    data.value.toLowerCase() === "other"
                  ) {
                    return;
                  }
                  handleUpdate({
                    target: { name: "primaryDomain", value: data.value },
                  });
                }}
              />
     
            </div>

            <div className="inputLineBlock">
              <p className="fieldLabel">
                {t("createProfileFlow.basic.organizationFields.mission", {}, { default: "Organization/Company Mission or Description" })}
              </p>
              <p>
                {t("createProfileFlow.basic.organizationFields.missionDescription", {}, {
                  default: "Please describe your organization or unit including mission, key program activities, and nature of work.",
                })}
              </p>
              <textarea
                id="bio"
                rows="5"
                name="bio"
                value={inputs?.bio || ""}
                onChange={handleUpdate}
              />
            </div>
          </>
        ) : (
          <>
            <div className="inputLineBlock">
              <div className="twoColumnsInput">
                <div>
                  <p className="fieldLabel">{t("basic.firstName")}</p>
                  <input
                    type="text"
                    name="firstName"
                    autoComplete="firstName"
                    value={inputs?.firstName || ""}
                    onChange={handleUpdate}
                  />
                </div>
                <div>
                  <p className="fieldLabel">{t("basic.lastName")}</p>
                  <input
                    type="text"
                    name="lastName"
                    autoComplete="lastName"
                    value={inputs?.lastName || ""}
                    onChange={handleUpdate}
                  />
                </div>
              </div>
            </div>

            <div className="inputLineBlock">
              <p className="fieldLabel">{t("basic.email")}</p>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={inputs?.email || ""}
                onChange={handleUpdate}
                required
              />
            </div>

            <div className="inputLineBlock">
              <div className="twoColumnsInput">
                <div>
                  <p className="fieldLabel">{t("basic.pronouns")}</p>
                  <Dropdown
                    fluid
                    selection
                    options={[
                      {
                        key: "she",
                        text: t("basic.pronounsOptions.she"),
                        value: "she",
                      },
                      {
                        key: "he",
                        text: t("basic.pronounsOptions.he"),
                        value: "he",
                      },
                      {
                        key: "they",
                        text: t("basic.pronounsOptions.they"),
                        value: "they",
                      },
                    ]}
                    onChange={(event, data) => {
                      handleUpdate({
                        target: { name: "pronouns", value: data.value },
                      });
                    }}
                    value={inputs?.pronouns}
                    className="createdByDropdown"
                  />
                </div>

                <div>
                  <p className="fieldLabel">{t("basic.location")}</p>
                  <input
                    type="text"
                    name="location"
                    value={inputs?.location || ""}
                    onChange={handleUpdate}
                  />
                </div>
              </div>

              <div className="inputLineBlock">
                <p className="fieldLabel">{t("basic.organization")}</p>
                <input
                  type="text"
                  name="organization"
                  value={inputs?.organization || ""}
                  onChange={handleUpdate}
                  required
                />
              </div>

              <div className="inputLineBlock">
                <p className="fieldLabel">{t("basic.tagline")}</p>
                <input
                  type="text"
                  name="tagline"
                  value={inputs?.tagline || ""}
                  onChange={handleUpdate}
                  required
                />
              </div>
            </div>
          </>
        )}

        <StyledSaveButton changed={changed}>
          <button onClick={handleSubmit} disabled={!changed}>
            {t("basic.saveChanges")}
          </button>
        </StyledSaveButton>
      </StyledInput>
    </div>
  );
}
