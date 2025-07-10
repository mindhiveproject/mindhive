import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import { Divider } from "semantic-ui-react";

export default function Main({ query, user }) {
  const { t } = useTranslation("common");

  return (
    <>
      <h1>{t("settings.title")}</h1>

      <h3>{t("settings.description")}</h3>

      <div className="quickLinks">
        <div className="p24">{t("settings.quickLinks")}</div>
        <div className="links">
          <Link
            href={{
              pathname: `/dashboard/settings/email`,
            }}
          >
            <div className="link">
              <div>
                <img src={`/assets/icons/profile/email.svg`} alt="email" />
              </div>
              <div className="content">
                <div className="p18">{t("settings.email")}</div>
                <div>{user?.email}</div>
              </div>
              <div>
                <img src={`/assets/icons/profile/arrow.svg`} alt="arrow" />
              </div>
            </div>
          </Link>

          <Divider />

          <Link
            href={{
              pathname: `/dashboard/settings/username`,
            }}
          >
            <div className="link">
              <div>
                <img
                  src={`/assets/icons/profile/username.svg`}
                  alt="username"
                />
              </div>
              <div className="content">
                <div className="p18">{t("settings.username")}</div>
                <div>{user?.username}</div>
              </div>
              <div>
                <img src={`/assets/icons/profile/arrow.svg`} alt="arrow" />
              </div>
            </div>
          </Link>

          <Divider />

          <Link
            href={{
              pathname: `/dashboard/settings/languages`,
            }}
          >
            <div className="link">
              <div>
                <img
                  src={`/assets/icons/profile/languages.svg`}
                  alt="languages"
                />
              </div>
              <div className="content">
                <div className="p18">{t("settings.languages")}</div>
                <div>{t("settings.languagePreferences")}</div>
              </div>
              <div>
                <img src={`/assets/icons/profile/arrow.svg`} alt="arrow" />
              </div>
            </div>
          </Link>

          <Divider />

          <Link
            href={{
              pathname: `/dashboard/settings/consent`,
            }}
          >
            <div className="link">
              <div>
                <img src={`/assets/icons/profile/consent.svg`} alt="consent" />
              </div>
              <div className="content">
                <div className="p18">{t("settings.dataConsent")}</div>
                <div>{t("settings.dataConsentDescription")}</div>
              </div>
              <div>
                <img src={`/assets/icons/profile/arrow.svg`} alt="arrow" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
