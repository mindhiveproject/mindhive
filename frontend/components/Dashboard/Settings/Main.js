import { useEffect, useState } from "react";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import { Divider } from "semantic-ui-react";

import Button from "../../DesignSystem/Button";
import {
  isSponsorOnboardingDismissed,
  setSponsorOnboardingDismissed,
} from "../../../lib/sponsorOnboardingDismiss";

export default function Main({ query, user }) {
  const { t } = useTranslation("common");
  const isSponsor = (user?.permissions || []).some((p) => p?.name === "SPONSOR");
  const [setupDismissed, setSetupDismissed] = useState(false);

  useEffect(() => {
    if (!user?.id || !isSponsor) return;
    setSetupDismissed(isSponsorOnboardingDismissed(user.id));
  }, [user?.id, isSponsor]);

  const handleRestoreSetupTips = () => {
    if (!user?.id) return;
    setSponsorOnboardingDismissed(user.id, false);
    setSetupDismissed(false);
  };

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

      {isSponsor && (
        <div className="quickLinks" style={{ marginTop: 32 }}>
          <div className="p24">
            {t("settings.sponsorSetup.title", {}, {
              default: "Sponsor setup tips",
            })}
          </div>
          <div className="links" style={{ padding: 24 }}>
            <div style={{ marginBottom: 12, color: "#5f6871", fontSize: 14 }}>
              {t("settings.sponsorSetup.description", {}, {
                default:
                  "Show the profile, organization, and opportunity setup tips on your Home page.",
              })}
            </div>
            {setupDismissed ? (
              <Button variant="filled" onClick={handleRestoreSetupTips}>
                {t("settings.sponsorSetup.restoreButton", {}, {
                  default: "Show setup tips on Home",
                })}
              </Button>
            ) : (
              <div style={{ color: "#5f6871", fontSize: 14 }}>
                {t("settings.sponsorSetup.visibleNote", {}, {
                  default: "Setup tips are currently visible on your Home page.",
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
