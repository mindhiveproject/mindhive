import { useQuery } from "@apollo/client";
import IdentIcon from "../../Account/IdentIcon";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../DesignSystem/Chip";
import CopyButton from "../../DesignSystem/CopyButton";
import Tooltip from "../../DesignSystem/Tooltip";
import { GET_PROFILE } from "../../Queries/User";
import { getProfileImageUrl } from "../../../lib/profileStudyImageUrls";

export default function Profile() {
  const { t } = useTranslation("home");
  // query the full profile of the user
  const { data } = useQuery(GET_PROFILE);
  const user = data?.authenticatedItem || {};
  const profileImageUrl = getProfileImageUrl(user);

  const {
    profileType,
    firstName,
    lastName,
    email,
    pronouns,
    location,
    bio,
    bioInformal,
    occupation,
    education,
    languages,
    introVideoFile,
    mentorPreferGrade,
    mentorPreferGroup,
    mentorPreferClass,
    interests,
    publicId,
    publicReadableId,
    permissions,
  } = user;

  const isProfileComplete =
    profileType &&
    firstName &&
    lastName &&
    email &&
    pronouns &&
    location &&
    bio &&
    bioInformal &&
    occupation &&
    education &&
    languages &&
    introVideoFile?.url &&
    mentorPreferGrade &&
    mentorPreferGroup &&
    mentorPreferClass &&
    interests;

  const permissionNames =
    permissions?.map((permission) => permission?.name).filter(Boolean) || [];

  return (
    <>
      <div className="titleIcon">
        <div>
          <div className="h36">
            {t("welcome")}
            {isProfileComplete && ` back`}
            {user.username ? `, ${user.username}` : `, MindHive User`}
          </div>
        </div>

        <div className="profileMetaStack">
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

          {permissionNames.length > 0 && (
            <div className="profileMetaChips">
              {permissionNames.map((name) => (
                <Chip key={name} label={name} />
              ))}
            </div>
          )}

          {(publicId || publicReadableId) && (
            <div className="profileMetaIds">
              {publicId && (
                <div className="profileMetaId">
                  <span className="profileMetaIdLabel">
                    {t("participantID", {}, { default: "Participant ID" })}
                  </span>
                  <Tooltip
                    content={t("copyParticipantIdAria", {}, {
                      default: "Copy participant ID to clipboard",
                    })}
                    side="left"
                  >
                    <CopyButton
                      value={publicId}
                      ariaLabel={t("copyParticipantIdAria", {}, {
                        default: "Copy participant ID to clipboard",
                      })}
                      style={{
                        border: "none",
                        background: "#E6E6E6",
                        backgroundColor: "#E6E6E6",
                      }}
                    >
                      {publicId}
                    </CopyButton>
                  </Tooltip>
                </div>
              )}
              {publicReadableId && (
                <div className="profileMetaId">
                  <span className="profileMetaIdLabel">
                    {t("publicReadableID", {}, { default: "Public readable ID" })}
                  </span>
                  <Tooltip
                    content={t("copyPublicIdAria", {}, {
                      default: "Copy public readable ID to clipboard",
                    })}
                    side="left"
                  >
                    <CopyButton
                      value={publicReadableId}
                      ariaLabel={t("copyPublicIdAria", {}, {
                        default: "Copy public readable ID to clipboard",
                      })}
                      style={{
                        border: "none",
                        background: "#E6E6E6",
                        backgroundColor: "#E6E6E6",
                      }}
                    >
                      {publicReadableId}
                    </CopyButton>
                  </Tooltip>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
