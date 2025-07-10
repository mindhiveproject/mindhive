import Link from "next/link";
import { Divider } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import Permissions from "./Consent/Permissions";
import Documents from "./Consent/Documents";
import Activity from "./Consent/Activity";

export default function Consent({ query, user }) {
  const { t } = useTranslation("common");
  const { section } = query;

  if (section === "permissions") {
    return <Permissions query={query} user={user} />;
  }

  if (section === "documents") {
    return <Documents query={query} user={user} />;
  }

  if (section === "activity") {
    return <Activity query={query} user={user} />;
  }

  return (
    <>
      <h1>{t("consent.title")}</h1>

      <h3>{t("consent.description")}</h3>

      <Divider />

      <div className="quickLinks">
        <div className="links">
          <Link
            href={{
              pathname: `/dashboard/settings/consent`,
              query: {
                section: "permissions",
              },
            }}
          >
            <div className="link">
              <div>
                <img
                  src={`/assets/icons/profile/consent.svg`}
                  alt="permissions"
                />
              </div>
              <div className="content">
                <div className="p18">{t("consent.permissionsTitle")}</div>
                <div>{t("consent.permissionsDescription")}</div>
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
              query: {
                section: "documents",
              },
            }}
          >
            <div className="link">
              <div>
                <img
                  src={`/assets/icons/profile/documents.svg`}
                  alt="documents"
                />
              </div>
              <div className="content">
                <div className="p18">{t("consent.documentsTitle")}</div>
                <div>{t("consent.documentsDescription")}</div>
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
              query: {
                section: "activity",
              },
            }}
          >
            <div className="link">
              <div>
                <img
                  src={`/assets/icons/profile/activity.svg`}
                  alt="activity"
                />
              </div>
              <div className="content">
                <div className="p18">{t("consent.activityTitle")}</div>
                <div>{t("consent.activityDescription")}</div>
              </div>
              <div>
                <img src={`/assets/icons/profile/arrow.svg`} alt="arrow" />
              </div>
            </div>
          </Link>

          <Divider />
        </div>
      </div>

      <div className="buttons">
        <div></div>
        <div className="consentButtonBack">
          <Link
            href={{
              pathname: `/dashboard/settings`,
            }}
          >
            <button className="back">{t("consent.backToSettings")}</button>
          </Link>
        </div>
      </div>
    </>
  );
}
