import absoluteUrl from "next-absolute-url";
import useTranslation from "next-translate/useTranslation";

import CopyButton from "../../../../DesignSystem/CopyButton";

export default function ShareStudy({ study, handleChange }) {
  const { t } = useTranslation("builder");
  const { origin } = absoluteUrl();
  const studyUrl = study?.slug ? `${origin}/studies/${study.slug}` : "";

  const sanitizeInput = (e) => {
    // Spaces turn into hyphens as they are typed (no trim, or the space
    // would vanish before it could be converted).
    const cleanedValue = e.target.value
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
      .replace(/-{2,}/g, "-");
    handleChange({
      target: {
        name: e.target.name,
        value: cleanedValue,
      },
    });
  };

  return (
    <div id="shareStudy" className="settingsSection">
      <div className="settingsSectionHeader">
        <h2>{t("share.shareYourStudy")}</h2>
      </div>

      <div className="settingsField">
        <p className="settingsFieldLabel">{t("share.studyUrl")}</p>
        {studyUrl ? (
          <CopyButton
            value={studyUrl}
            className="studyUrlCopy"
            title={studyUrl}
            // Let the label fill the chip so "Copied" centres on its full width
            labelStyle={{ flex: 1 }}
          >
            <span className="studyUrl">{studyUrl}</span>
          </CopyButton>
        ) : (
          <p className="settingsSectionNote">{t("share.customizeBelow")}</p>
        )}
      </div>

      <div className="settingsField" id="customizeUrl">
        <label className="settingsFieldLabel" htmlFor="slug">
          {t("share.customizeUrl")}
        </label>
        <div className="slugInput">
          <span className="slugPrefix">/studies/</span>
          <input
            type="text"
            id="slug"
            name="slug"
            value={study.slug || ""}
            onChange={sanitizeInput}
            required
          />
        </div>
        <p className="settingsSectionNote">{t("share.tip")}</p>
      </div>
    </div>
  );
}
