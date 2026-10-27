import { useState } from "react";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import ReactHtmlParser from "react-html-parser";

import Button from "../../DesignSystem/Button";
import BackToProtocols from "./BackToProtocols";
import TeacherReviewPanel from "./TeacherReviewPanel";
import {
  CONSENT_SECTIONS,
  LEGACY_SECTION,
  completedSections,
  consentTypesForGroups,
  getConsentType,
  normalizeInfo,
  normalizeSettings,
  sectionFilled,
} from "./consentTypes";

// Read-only view of a protocol, laid out like the editor: one tab per form
// type, one card per section. The class teaching team reviews from here.
export default function ConsentPreview({ consent, user, canEdit, isReviewer }) {
  const { t } = useTranslation("dashboard");
  const info = normalizeInfo(consent?.info);
  const tabs = consentTypesForGroups(
    user,
    normalizeSettings(consent?.settings).eligibility.groups,
    consent?.info
  );
  const [activeName, setActiveName] = useState(null);
  const currentName = tabs.includes(activeName) ? activeName : tabs[0];
  const block = info.find((b) => b?.name === currentName);
  const audience = getConsentType(currentName)?.audience;
  const href = `/dashboard/irb/${consent?.code}`;

  const typeLabel = (name) => {
    const type = getConsentType(name);
    const fallback =
      type?.label || info.find((b) => b?.name === name)?.description || name;
    return t(`consentAdmin.types.${name}`, {}, { default: fallback });
  };

  const sectionLabel = (section) =>
    t(
      `consentAdmin.sections.${section.key}${
        section.key === "activities" && audience === "parent" ? "Parent" : ""
      }`,
      {},
      { default: section.label(audience) }
    );

  const hint = getConsentType(currentName)?.hint;

  return (
    <div className="consentEditor">
      <div className="consentEditorHeader">
        <h1>
          <BackToProtocols />
          {consent?.title}
        </h1>
        {canEdit && (
          <div className="consentHeaderActions">
            <Link href={{ pathname: href, query: { action: "settings" } }}>
              <Button variant="outline" type="button">
                {t("consentAdmin.settings", {}, { default: "Settings" })}
              </Button>
            </Link>
            <Link
              href={{
                pathname: href,
                query: { action: "edit", form: currentName },
              }}
            >
              <Button variant="filled" type="button">
                {t("consentAdmin.editForms", {}, { default: "Edit forms" })}
              </Button>
            </Link>
          </div>
        )}
      </div>
      {consent?.description && (
        <p className="consentSettingsIntro">{consent.description}</p>
      )}

      {tabs.length > 0 && (
        <div
          className="consentFormTabs"
          role="tablist"
          aria-label={t(
            "consentAdmin.formVersions",
            {},
            {
              default: "Consent form versions",
            }
          )}
        >
          {tabs.map((name) => {
            const complete =
              completedSections(info.find((b) => b?.name === name)) ===
              CONSENT_SECTIONS.length;
            return (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={name === currentName}
                className={name === currentName ? "selected" : undefined}
                onClick={() => setActiveName(name)}
              >
                <span>{typeLabel(name)}</span>
                <span
                  className={complete ? "dot complete" : "dot"}
                  aria-label={
                    complete
                      ? t("consentAdmin.complete", {}, { default: "Complete" })
                      : t(
                          "consentAdmin.incomplete",
                          {},
                          {
                            default: "Incomplete",
                          }
                        )
                  }
                />
              </button>
            );
          })}
        </div>
      )}

      <div
        className={
          isReviewer ? "consentEditorBody" : "consentEditorBody noSide"
        }
      >
        <div className="consentSections" role="tabpanel">
          {hint && (
            <p className="consentSettingsNote">
              {t(
                `consentSettings.hints.${currentName}`,
                {},
                {
                  default: hint,
                }
              )}
            </p>
          )}
          {CONSENT_SECTIONS.map((section) => {
            const filled = sectionFilled(block, section.key);
            return (
              <section
                className="consentSectionCard"
                key={`${currentName}-${section.key}`}
              >
                <h3 className="consentSectionLabel">{sectionLabel(section)}</h3>
                {filled ? (
                  <p className="consentSectionText">
                    {block.sections[section.key]}
                  </p>
                ) : (
                  <p className="consentSectionText empty">
                    {t(
                      "consentAdmin.notFilled",
                      {},
                      {
                        default: "Not filled in yet",
                      }
                    )}
                  </p>
                )}
              </section>
            );
          })}
          {sectionFilled(block, LEGACY_SECTION) && (
            <section className="consentSectionCard">
              <h3 className="consentSectionLabel">
                {t(
                  "consentAdmin.sections.additional",
                  {},
                  {
                    default: "Additional text",
                  }
                )}
              </h3>
              <div className="consentSectionText">
                {ReactHtmlParser(block.sections[LEGACY_SECTION])}
              </div>
            </section>
          )}
        </div>

        {isReviewer && <TeacherReviewPanel consent={consent} />}
      </div>
    </div>
  );
}
