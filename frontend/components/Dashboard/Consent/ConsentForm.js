import { useMemo, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import DisplayError from "../../ErrorMessage";
import Button from "../../DesignSystem/Button";
import Input from "../../DesignSystem/Input";
import Modal from "../../DesignSystem/Modal";
import ReactHtmlParser from "react-html-parser";

import JoditEditor from "../../Jodit/Editor";
import BackToProtocols from "./BackToProtocols";
import useSavedFlash from "./useSavedFlash";
import {
  LEGACY_SECTION,
  assembleText,
  completedSections,
  formReady,
  getConsentType,
  requiredSections,
  sectionFilled,
  consentTypesForGroups,
  isStudentUser,
} from "./consentTypes";

// Consent protocol editor (Figma "Consent protocol editor", node 10:359).
// Not a <form>: the rich-text editor toolbar must never submit it.
export default function ConsentForm({
  initialForm,
  groups,
  user,
  inputs,
  handleChange,
  handleSave,
  submitBtnName,
  loading,
  error,
  review,
  consentSections,
  onSubmitReview,
  submittingReview,
}) {
  const { t } = useTranslation("dashboard");
  const [activeName, setActiveName] = useState(initialForm || null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [justSaved, flashSaved] = useSavedFlash();

  async function save() {
    if (await handleSave()) flashSaved();
  }

  const info = inputs?.info || [];
  // The rich-text editor may keep its first onChange callback, so always
  // read the latest blocks from a ref to avoid losing edits
  const infoRef = useRef(info);
  infoRef.current = info;

  // only the forms of the participant groups ticked in the settings
  const tabs = useMemo(
    () => consentTypesForGroups(user, groups, info),
    [user, groups, info]
  );
  const currentName = tabs.includes(activeName) ? activeName : tabs[0];
  const block = info.find((b) => b?.name === currentName);
  const audience = getConsentType(currentName)?.audience;
  const { sectionsFor, sectionLabel, checklistLabel, sectionHint } =
    consentSections;
  const sections = sectionsFor(currentName);
  const required = requiredSections(sections);

  // approved by the teaching team: read-only until they reopen it
  const locked = review?.status === "approved";
  const canSave =
    !!inputs?.title?.trim() &&
    !loading &&
    !consentSections.loading &&
    !locked;

  const typeLabel = (name) => {
    const type = getConsentType(name);
    const fallback =
      type?.label || info.find((b) => b?.name === name)?.description || name;
    return t(`consentAdmin.types.${name}`, {}, { default: fallback });
  };

  const updateSection = (key, value) => {
    handleChange({
      target: {
        name: "info",
        value: infoRef.current.map((b) =>
          b?.name === currentName
            ? { ...b, sections: { ...(b.sections || {}), [key]: value } }
            : b
        ),
      },
    });
  };

  const previewLabel =
    {
      parent: t(
        "consentAdmin.previewParent",
        {},
        {
          default: "Preview permission form",
        }
      ),
      minor: t(
        "consentAdmin.previewAssent",
        {},
        {
          default: "Preview assent form",
        }
      ),
    }[audience] ||
    t("consentAdmin.previewConsent", {}, { default: "Preview consent form" });
  const previewText =
    previewOpen && block ? assembleText(block, sections) : "";

  // Teacher review (Figma node 10:491): students only
  const showReview = isStudentUser(user) && !!review;
  const allReady = tabs.every((name) =>
    formReady(
      info.find((b) => b?.name === name),
      sectionsFor(name)
    )
  );
  const reviewers = review?.reviewers?.length
    ? review.reviewers.join(", ")
    : t("consentAdmin.review.yourTeacher", {}, { default: "Your teacher" });
  const reviewBadge = {
    submitted: [
      "",
      t("consentAdmin.review.submitted", {}, { default: "Awaiting review" }),
    ],
    approved: [
      "ready",
      t("consentAdmin.review.approved", {}, { default: "Approved" }),
    ],
    reopened: [
      "",
      t("consentAdmin.review.reopened", {}, { default: "Changes requested" }),
    ],
  }[review?.status] || [
    "",
    t("consentAdmin.review.notSubmitted", {}, { default: "Not submitted yet" }),
  ];
  const completed = completedSections(block, sections);
  const hasLegacyText = block?.sections?.[LEGACY_SECTION] !== undefined;

  return (
    <div className="consentEditor">
      <div className="consentEditorHeader">
        <h1>
          <BackToProtocols />
          {inputs?.title?.trim() ||
            t("consentAdmin.untitled", {}, { default: "Untitled protocol" })}
        </h1>
        <div className="consentHeaderActions">
          {justSaved && (
            <span className="consentSavedNotice" role="status">
              ✓ {t("consentAdmin.saved", {}, { default: "Saved" })}
            </span>
          )}
          <Button
            variant="outline"
            type="button"
            onClick={() => setPreviewOpen(true)}
          >
            {previewLabel}
          </Button>
          <Button
            variant="filled"
            type="button"
            disabled={!canSave}
            onClick={save}
          >
            {loading
              ? t("consentAdmin.saving", {}, { default: "Saving…" })
              : submitBtnName}
          </Button>
        </div>
      </div>

      <DisplayError error={error} />

      {locked && (
        <p className="consentSettingsNote">
          {t(
            "consentAdmin.review.locked",
            {},
            {
              default:
                "This protocol was approved and is locked. Ask your teacher to reopen it to make changes.",
            }
          )}
        </p>
      )}

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
          const tabBlock = info.find((b) => b?.name === name);
          const complete = formReady(tabBlock, sectionsFor(name));
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

      <div className="consentEditorBody">
        <div className="consentSections" role="tabpanel">
          {sections.map((section) => {
            const hint = sectionHint(section);
            return (
              <div
                className="consentSectionCard"
                key={`${currentName}-${section.key}`}
              >
                <label
                  className="consentSectionLabel"
                  htmlFor={`consent-${currentName}-${section.key}`}
                >
                  {sectionLabel(section, currentName)}
                  {!section.required &&
                    ` (${t(
                      "consentAdmin.optional",
                      {},
                      { default: "optional" }
                    )})`}
                </label>
                {hint && <p className="consentSectionHint">{hint}</p>}
                <Input
                  id={`consent-${currentName}-${section.key}`}
                  multiline
                  rows={2}
                  value={block?.sections?.[section.key] || ""}
                  onChange={(value) => updateSection(section.key, value)}
                  placeholder={section.placeholder || undefined}
                  disabled={loading || locked}
                  className="consentSectionInput"
                />
              </div>
            );
          })}

          {hasLegacyText && (
            <div className="consentSectionCard" key={`${currentName}-legacy`}>
              <span className="consentSectionLabel">
                {t(
                  "consentAdmin.sections.additional",
                  {},
                  {
                    default: "Additional text",
                  }
                )}
              </span>
              <p className="consentSectionHint">
                {t(
                  "consentAdmin.sections.additionalHint",
                  {},
                  {
                    default:
                      "Text written before this form had sections. Move it into the sections above, then clear it.",
                  }
                )}
              </p>
              {locked ? (
                <div className="consentSectionText">
                  {ReactHtmlParser(block?.sections?.[LEGACY_SECTION] || "")}
                </div>
              ) : (
                <JoditEditor
                  key={currentName}
                  minHeight={200}
                  content={block?.sections?.[LEGACY_SECTION]}
                  setContent={(content) =>
                    updateSection(LEGACY_SECTION, content)
                  }
                />
              )}
            </div>
          )}
        </div>

        <section className="consentSideCard consentChecklistCard">
          <h2>
            {t(
              "consentAdmin.requiredElements",
              {},
              {
                default: "Required elements",
              }
            )}
          </h2>
          <p className="consentChecklistCount">
            {t(
              "consentAdmin.completeCount",
              { done: completed, total: required.length },
              { default: "{{done}} of {{total}} complete" }
            )}
          </p>
          <ul>
            {required.map((section) => {
              const filled = sectionFilled(block, section.key);
              return (
                <li key={section.key} className={filled ? "done" : "missing"}>
                  <span aria-hidden="true">{filled ? "✓" : "!"}</span>
                  <span>{checklistLabel(section, currentName)}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {showReview && (
          <section className="consentSideCard consentReviewCard">
            <h2>
              {t(
                "consentAdmin.review.title",
                {},
                { default: "Teacher review" }
              )}
            </h2>
            <span className={`statusBadge ${reviewBadge[0]}`}>
              {reviewBadge[1]}
            </span>
            <p>
              {review.hasClass
                ? t(
                    "consentAdmin.review.info",
                    { reviewers, count: tabs.length },
                    {
                      default:
                        "{{reviewers}} must approve all {{count}} forms before the study can accept participants.",
                    }
                  )
                : t(
                    "consentAdmin.review.noClass",
                    {},
                    {
                      default:
                        "Connect this protocol to your class in its settings to choose who reviews it.",
                    }
                  )}
            </p>
            {review.status === "reopened" && review.note && (
              <blockquote className="consentReviewNote">
                {review.note}
                {review.reviewedBy && <cite>— {review.reviewedBy}</cite>}
              </blockquote>
            )}
            {review.status !== "approved" && (
              <Button
                variant="tonal"
                type="button"
                disabled={
                  !review.hasClass ||
                  !allReady ||
                  review.status === "submitted" ||
                  submittingReview ||
                  loading
                }
                onClick={onSubmitReview}
                style={{ width: "100%" }}
              >
                {review.status === "submitted"
                  ? t("consentAdmin.review.sent", {}, { default: "Submitted" })
                  : t(
                      "consentAdmin.review.submit",
                      {},
                      {
                        default: "Submit for review",
                      }
                    )}
              </Button>
            )}
            {review.status !== "approved" &&
              review.status !== "submitted" &&
              review.hasClass &&
              !allReady && (
                <p>
                  {t(
                    "consentAdmin.review.completeFirst",
                    {},
                    { default: "Complete every form to submit it." }
                  )}
                </p>
              )}
          </section>
        )}
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewLabel}
        actions={
          <Button
            variant="filled"
            type="button"
            onClick={() => setPreviewOpen(false)}
          >
            {t("consentAdmin.close", {}, { default: "Close" })}
          </Button>
        }
      >
        {/* what participants of this form type see at study join */}
        <div className="consentPreviewText">
          {previewText ? (
            ReactHtmlParser(previewText)
          ) : (
            <p>
              {t("consentAdmin.emptyBlock", {}, { default: "No content yet." })}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
