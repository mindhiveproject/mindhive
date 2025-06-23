import React from "react";
import useTranslation from "next-translate/useTranslation";

const Links = () => {
  const { t } = useTranslation("home");

  return (
    <div className="updatesBoard">
      <h2>{t("info")}</h2>
      <div className="updates">
        <div>
          <a href="/docs/about" target="_blank" rel="noreferrer">
            {t("about")}
          </a>
        </div>

        <div>
          <a href="/teachers" target="_blank" rel="noreferrer">
            {t("teachers")}
          </a>
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
