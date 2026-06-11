import { useState, useEffect } from "react";
import useForm from "../../../../../lib/useForm";
import { useMutation } from "@apollo/client";
import { Divider } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";
import { resolveProfileType } from "../../../../../lib/profileEditNavigation";

import { StyledInput } from "../../../../styles/StyledForm";
import { StyledSaveButton } from "../../../../styles/StyledProfile";

export default function Background({ query, user, onDirtyChange }) {
  const { t } = useTranslation("connect");
  const [changed, setChanged] = useState(false);

  const profileType = resolveProfileType(query, user);
  const isOrganization = profileType === "organization";

  const { inputs, handleChange } = useForm(
    isOrganization
      ? {
          firstName: user?.firstName,
          lastName: user?.lastName,
          occupation: user?.occupation,
          passion: user?.passion,
          publicMail: user?.publicMail,
          timeCommitment: user?.timeCommitment,
        }
      : {
          bioInformal: user?.bioInformal,
          bio: user?.bio,
          occupation: user?.occupation,
          education: user?.education || [{ institution: "", degree: "" }],
          languages: user?.languages || [{ language: "" }],
        },
    { freezeInitialSync: changed },
  );

  useEffect(() => {
    onDirtyChange?.(changed);
  }, [changed, onDirtyChange]);

  const handleUpdate = (data) => {
    setChanged(true);
    handleChange(data);
  };

  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: GET_PROFILE }],
  });

  function buildPayload() {
    if (isOrganization) {
      return {
        firstName: inputs?.firstName,
        lastName: inputs?.lastName,
        occupation: inputs?.occupation,
        passion: inputs?.passion,
        publicMail: inputs?.publicMail,
        timeCommitment: inputs?.timeCommitment,
      };
    }
    return {
      bio: inputs?.bio,
      bioInformal: inputs?.bioInformal,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await updateProfile({
        variables: {
          id: user?.id,
          input: buildPayload(),
        },
      });
      setChanged(false);
    } catch {
      alert(
        t("createProfileFlow.saveError", {}, {
          default: "Something went wrong while saving. Please try again.",
        }),
      );
    }
  }

  return (
    <div className="profileBlock">
      <div>
        <div className="title">
          {isOrganization
            ? t("createProfileFlow.background.organization.title", {}, { default: t("background.title") })
            : t("background.title")}
        </div>
        {isOrganization && (
          <p>
            {t("createProfileFlow.background.organization.primaryProjectLead", {}, {
              default: "Sponsor's Primary Project Lead",
            })}
          </p>
        )}
        {!isOrganization && <p>{t("background.description")}</p>}
      </div>

      <StyledInput>
        {isOrganization ? (
          <>
            <p>
              {t("createProfileFlow.background.organization.intro1", {}, {
                default: "To ensure a successful capstone experience, each sponsoring organization must designate a primary sponsor who will serve as a stakeholder and point of contact for the student team. The designated sponsor will be the key liaison for all project-related communications.",
              })}
            </p>
            <p>
              {t("createProfileFlow.background.organization.intro2", {}, {
                default: "Capstone projects are most successful when sponsors provide high-level strategic guidance while mentors offer day-to-day insights and support. Your involvement is essential to both student learning and project success.",
              })}
            </p>

            <div className="inputLineBlock">
              <div className="twoColumnsInput">
                <div>
                  <p className="fieldLabel">
                    {t("createProfileFlow.background.organization.firstName", {}, { default: t("basic.firstName") })}
                  </p>
                  <input
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    value={inputs?.firstName || ""}
                    onChange={handleUpdate}
                    required
                  />
                </div>
                <div>
                  <p className="fieldLabel">
                    {t("createProfileFlow.background.organization.lastName", {}, { default: t("basic.lastName") })}
                  </p>
                  <input
                    type="text"
                    name="lastName"
                    autoComplete="family-name"
                    value={inputs?.lastName || ""}
                    onChange={handleUpdate}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="inputLineBlock">
              <p className="fieldLabel">
                {t("createProfileFlow.background.organization.leadTitle", {}, { default: "Title" })}
              </p>
              <input
                type="text"
                name="occupation"
                value={inputs?.occupation || ""}
                onChange={handleUpdate}
                required
              />
            </div>

            <div className="inputLineBlock">
              <p className="fieldLabel">
                {t("createProfileFlow.background.organization.leadExpertise", {}, { default: "Area of expertise" })}
              </p>
              <input
                type="text"
                name="passion"
                value={inputs?.passion || ""}
                onChange={handleUpdate}
                required
              />
            </div>

            <div className="inputLineBlock">
              <p className="fieldLabel">
                {t("createProfileFlow.background.organization.leadEmail", {}, { default: "Email address" })}
              </p>
              <input
                type="email"
                name="publicMail"
                autoComplete="email"
                value={inputs?.publicMail || ""}
                onChange={handleUpdate}
                required
              />
            </div>

            <div className="inputLineBlock">
              <p className="fieldLabel">
                {t("createProfileFlow.background.organization.leadAvailability", {}, {
                  default: "Expected availability/time commitment during project",
                })}
              </p>
              <p>
                {t("createProfileFlow.background.organization.leadAvailabilityDescription", {}, {
                  default: 'Please estimate a numerical time per week or per month. Refrain from answering "meet when available" or similar response.',
                })}
              </p>
              <input
                type="text"
                name="timeCommitment"
                value={inputs?.timeCommitment || ""}
                onChange={handleUpdate}
                required
              />
            </div>
          </>
        ) : (
          <div>
            <div className="inputLineBlock">
              <p className="fieldLabel">{t("background.officialBio.title")}</p>
              <p>{t("background.officialBio.description")}</p>
              <textarea
                id="bio"
                rows="5"
                name="bio"
                placeholder=""
                value={inputs?.bio || ""}
                onChange={handleUpdate}
              />
            </div>

            <p className="fieldLabel">{t("background.unofficialBio.title")}</p>
            <p>{t("background.unofficialBio.description")}</p>
            <textarea
              id="bioInformal"
              rows="5"
              name="bioInformal"
              placeholder=""
              value={inputs?.bioInformal || ""}
              onChange={handleUpdate}
            />
          </div>
        )}

        <StyledSaveButton changed={changed}>
          <button onClick={handleSubmit} disabled={!changed}>
            {t("background.saveChanges")}
          </button>
        </StyledSaveButton>
      </StyledInput>
    </div>
  );
}
