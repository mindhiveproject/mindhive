import Link from "next/link";
import { useQuery } from "@apollo/client";
import { PUBLIC_USER_QUERY } from "../../../Queries/User";
import { StyledUserPage } from "../../../styles/StyledUser";

import { Card, Flag, Icon, Menu } from "semantic-ui-react";
import { languageOptions } from "../../../User/LanguageSelector";
import StyledConnect from "../../../styles/StyledConnect";

export default function ProfilePage({ query, user }) {
  const { id } = query;

  const { data, loading, error } = useQuery(PUBLIC_USER_QUERY, {
    variables: { id },
  });
  const profile = data?.profile || {};

  const language = languageOptions?.filter(
    (l) => l.value === user?.language
  )[0];

  return (
    <StyledConnect>
      <div className="navigation">
        <Link
          href={{
            pathname: `/dashboard/connect/my`,
          }}
        >
          <button>My connections</button>
        </Link>
      </div>
      <StyledUserPage>
        <div className="profile">
          <div className="profileContainer">
            <div className="firstLine">
              <div>
                <h1>
                  {profile?.firstName} {profile?.lastName}
                </h1>
              </div>

              <div>
                {profile?.image?.image?.publicUrlTransformed ? (
                  <img
                    src={profile?.image?.image?.publicUrlTransformed}
                    alt={profile?.username}
                  />
                ) : (
                  <div></div>
                )}
              </div>
            </div>

            <div className="secondLine">
              <p>{profile?.bioInformal}</p>
            </div>

            <div className="thirdLine">
              <div>{profile?.email}</div>
              <div>{profile?.location}</div>
            </div>
          </div>

          <div className="bioContainer">
            <div>
              <p>Bio</p> {profile?.bio}
            </div>
            <div>Available for</div>
            <div>Interests</div>
          </div>
        </div>

        <div className="display"></div>
      </StyledUserPage>
    </StyledConnect>
  );
}
