import { useQuery } from "@apollo/client";
import IdentIcon from "../../Account/IdentIcon";
import Link from "next/link";

import { GET_PROFILE } from "../../Queries/User";

export default function Profile() {
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
            Welcome{isProfileComplete && ` back`}
            {user.username ? `, ${user.username}` : `, MindHive User`}
          </div>
          <div className="p20">
            You can edit your Profile, schedule time with mentors, stay
            up-to-date with the latest MH notifications here
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
                  {isProfileComplete ? `Edit` : `Create`} your MindHive profile
                </div>
                <div className="p18">
                  {isProfileComplete
                    ? `You’re already a part of the MindHive community! Update your profile by clicking here.`
                    : `Ready to join the MindHive community? Create your profile now
                  by clicking here.`}
                </div>
              </div>
            </div>
          </Link>

          <Link
            href={{
              pathname: `/dashboard/profile/set`,
            }}
          >
            <div className="createProfileArea">
              <div>
                <div className="h32">Set your mentorship availability</div>
                <div className="p18">
                  Set your availability to start mentoring. Click here to get
                  started
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}
    </>
  );
}
