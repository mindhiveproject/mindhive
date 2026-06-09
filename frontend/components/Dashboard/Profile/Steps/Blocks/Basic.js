import useForm from "../../../../../lib/useForm";
import UpdateAvatarModal from "../../../../Account/AvatarEditor/AvatarModal";
import IdentIcon from "../../../../Account/IdentIcon";
import { Dropdown } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import { StyledInput } from "../../../../styles/StyledForm";
import { StyledSaveButton } from "../../../../styles/StyledProfile";
import { useState } from "react";
import { getProfileImageUrl } from "../../../../../lib/profileStudyImageUrls";
import { resolveProfileType } from "../../../../../lib/profileEditNavigation";

const PRIMARY_DOMAIN_KEYS = [
  "academic",
  "government",
  "industry",
  "nonprofit",
  "other",
];

export default function BasicInformation({ query, user }) {
  const { t } = useTranslation("connect");
  const [changed, setChanged] = useState(false);
  const profileImageUrl = getProfileImageUrl(user);

  const profileType = resolveProfileType(query, user);
  const isOrganization = profileType === "organization";

  const { inputs, handleChange } = useForm(
    isOrganization
      ? {
          organization: user?.organization,
          department: user?.department,
          website: user?.website,
          location: user?.location,
          primaryDomain: user?.primaryDomain,
          bio: user?.bio,
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
  );

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
    variables: {
      id: user?.id,
      input: { ...inputs },
    },
    refetchQueries: [{ query: GET_PROFILE }],
  });

  async function handleSubmit(e) {
    e.preventDefault();
    await updateProfile();
    setChanged(false);
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
              alt={user?.name}
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
