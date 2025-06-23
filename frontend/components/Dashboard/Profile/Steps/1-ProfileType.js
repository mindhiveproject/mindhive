import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

export default function ProfileType({}) {
  const { t } = useTranslation("connect");

  return (
    <>
      <p>{t("profileType.description")}</p>
      <div className="chooseProfileType">
        <h2>{t("profileType.chooseType")}</h2>

        <div className="profileChoicesArea">
          <div>
            <Link
              href={{
                pathname: `/dashboard/profile/create`,
                query: {
                  page: "about",
                  type: "organization",
                },
              }}
            >
              <div className="profileChoiceButton">
                <div>
                  <img src={`/assets/icons/profile/people.svg`} />
                </div>
                <div>{t("profileType.organization.title")}</div>
              </div>
            </Link>
            <p>{t("profileType.organization.description")}</p>
          </div>

          <div>
            <Link
              href={{
                pathname: `/dashboard/profile/edit`,
                query: {
                  page: "about",
                  type: "individual",
                },
              }}
            >
              <div className="profileChoiceButton">
                <div>
                  <img src={`/assets/icons/profile/user.svg`} />
                </div>
                <div>{t("profileType.individual.title")}</div>
              </div>
            </Link>
            <p>{t("profileType.individual.description")}</p>
          </div>
        </div>
      </div>
    </>
  );
}
