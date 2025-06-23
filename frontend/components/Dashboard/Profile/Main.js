import { useQuery } from "@apollo/client";
import IdentIcon from "../../Account/IdentIcon";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../Queries/User";

export default function Profile() {
  const { t } = useTranslation("home");
  // query the full profile of the user
  const { data } = useQuery(GET_PROFILE);
  const user = data?.authenticatedItem || {};

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
    introVideo,
    mentorPreferGrade,
    mentorPreferGroup,
    mentorPreferClass,
    interests,
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
    introVideo &&
    mentorPreferGrade &&
    mentorPreferGroup &&
    mentorPreferClass &&
    interests;

  return (
    <>
      <div className="titleIcon">
        <div>
          <div className="h36">
            {t("welcome")}{isProfileComplete && ` back`}
            {user.username ? `, ${user.username}` : `, MindHive User`}
          </div>
          <div className="p20">
            {t("editProfile")}
          </div>
        </div>

        <div>
          {user?.image?.image?.publicUrlTransformed ? (
            <img
              src={user?.image?.image?.publicUrlTransformed}
              alt={user?.name}
            />
          ) : (
            <div>
              <IdentIcon size="120" value={user?.name} />
            </div>
          )}
        </div>
      </div>

      {(user?.permissions?.map((p) => p?.name).includes("ADMIN") ||
        user?.permissions?.map((p) => p?.name).includes("MENTOR")) && (
        <div className="createProfileAreaWrapper">
          <Link
            href={{
              pathname: `/dashboard/profile/edit`,
              query: {
                page: "type",
              },
            }}
          >
            <div className="createProfileArea">
              <div>
                <div className="h32">
                  {isProfileComplete ? t("editYourProfile") : t("createYourProfile")}
                </div>
                <div className="p18">
                  {isProfileComplete
                    ? t("updateProfileDescription")
                    : t("createProfileDescription")}
                </div>
              </div>
            </div>
          </Link>

          {/* <Link
            href={{
              pathname: `/dashboard/profile/set`,
            }}
          >
            <div className="createProfileArea">
              <div>
                <div className="h32">{t("setAvail")}</div>
                <div className="p18">
                  {t("setAvailDescription")}
                </div>
              </div>
            </div>
          </Link> */}
        </div>
      )}
    </>
  );
}
