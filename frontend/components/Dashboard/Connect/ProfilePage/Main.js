import Link from "next/link";
import { useQuery } from "@apollo/client";
import { PUBLIC_USER_QUERY } from "../../../Queries/User";
import { StyledUserPage } from "../../../styles/StyledUser";

import { languageOptions } from "../../../User/LanguageSelector";
import useTranslation from "next-translate/useTranslation";
import StyledConnect from "../../../styles/StyledConnect";
import ManageFavorite from "../ManageFavorite";

const pronouns = {
  he: "he/him/his",
  she: "she/her/hers",
  they: "they/them/theirs",
};

export default function ProfilePage({ query, user }) {
  const { id } = query;
  const { t } = useTranslation("connect");
  const { data, loading, error } = useQuery(PUBLIC_USER_QUERY, {
    variables: { id },
  });
  const profile = data?.profile || {};

  const language = languageOptions?.filter(
    (l) => l.value === user?.language
  )[0];

  const pronoun = pronouns[profile.pronouns] || undefined;

  return (
    <StyledConnect>
      <div className="navigation">
        <Link
          href={{
            pathname: `/dashboard/connect/my`,
          }}
        >
          <button>{t("myConnections")}</button>
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
                <div>{pronoun}</div>
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

              <ManageFavorite user={user} profileId={profile?.id} />
            </div>

            <div className="secondLine">
              <div>
                <p>{profile?.tagline}</p>
              </div>
            </div>

            <div className="thirdLine">
              <div>{profile?.email}</div>
              <div>{profile?.location}</div>
              <div>{profile?.organization}</div>
            </div>
          </div>

          <div className="bioContainer">
            <div>
              <div>
                <h3>{t("officialBio")}</h3>
                {profile?.bio}
              </div>
              <h3>{t("unofficialBio")}</h3>
              <p>{profile?.bioInformal}</p>
            </div>

            <div>
              <h3>{t("introductionVideo")}</h3>
              {profile?.introVideo?.filename && (
                <video width="100%" controls>
                  <source
                    src={`/videos/${profile?.introVideo?.filename}`}
                    type="video/mp4"
                  />
                  {t("videoNotSupported")}
                </video>
              )}
            </div>

            <div>
              <h3>{t("passionNow")}</h3>
              <div>{profile?.passion}</div>
            </div>

            <div>
              <h3>{t("availability")}</h3>
              {profile?.involvement?.mentor?.async_answering_questions && (
                <p>{t("asyncAnsweringQuestions")}</p>
              )}

              {profile?.involvement?.mentor?.async_providing_feedback && (
                <p>{t("asyncProvidingFeedback")}</p>
              )}

              {profile?.involvement?.mentor?.sync_making_visit_in_person && (
                <p>{t("syncInPersonVisit")}</p>
              )}

              {profile?.involvement?.mentor
                ?.sync_making_visit_in_person_over_zoom && (
                <p>{t("syncZoomVisit")}</p>
              )}
            </div>
          </div>
        </div>

        <div className="display"></div>
      </StyledUserPage>
    </StyledConnect>
  );
}
