import React from "react";
import useTranslation from "next-translate/useTranslation";
import Link from "next/link";

const Links = () => {
  const { t } = useTranslation("home");

  return (
    <div className="updatesBoard">
      <h2>{t("info")}</h2>
      <div className="updates">
        <div>
          <Link href="/docs/about" legacyBehavior>
            <a target="_blank" rel="noreferrer">{t("about")}</a>
          </Link>
        </div>

        <div>
          <Link href="/teachers" target="_blank" rel="noreferrer">
              {t("teachers")}
          </Link>
        </div>

        <div>
          <a href="/docs/privacy" target="_blank" rel="noreferrer">
            {t("privacyPolicy")}
          </a>
        </div>

        <div>
          <a href="/docs/terms" target="_blank" rel="noreferrer">
            {t("termsCondition")}
          </a>
        </div>

        <div>
          <a href={`mailto:${t("footer.email")}`}>{t("footer.email")}</a>
        </div>
      </div>
    </div>
  );
};

export default Links;
