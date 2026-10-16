import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import StudyVisibilityModal from "./StudyVisibilityModal";

// Class Settings section for the class's featured study block list (Class.hiddenStudies).
export default function StudyVisibilitySettings({ myclass }) {
  const { t } = useTranslation("classes");
  const [open, setOpen] = useState(false);

  // Hidden studies that are no longer featured right now don't affect students.
  const hiddenCount = (myclass?.hiddenStudies || []).filter(
    (study) => study?.featured
  ).length;

  return (
    <section className="settingsSection">
      <div className="settingsSectionHeader">
        <h3>{t("studyVisibility.title", {}, { default: "Featured studies" })}</h3>
        <p>
          {t(
            "studyVisibility.description",
            {},
            {
              default:
                "Choose which featured studies your students see on the discover page and as templates in the study builder.",
            }
          )}
        </p>
      </div>
      <div className="block curriculumTypeBlock">
        <p className="classDescriptionSettingsHint">
          {hiddenCount
            ? t(
                "studyVisibility.summaryHidden",
                { count: hiddenCount },
                {
                  default: `${hiddenCount} hidden from your students. Everything else, including studies featured later, is visible.`,
                }
              )
            : t(
                "studyVisibility.summaryAll",
                {},
                {
                  default:
                    "All featured studies are visible to your students.",
                }
              )}
        </p>
        <div>
          <Button variant="outline" onClick={() => setOpen(true)}>
            {t("studyVisibility.manage", {}, { default: "Manage" })}
          </Button>
        </div>
      </div>

      <StudyVisibilityModal
        open={open}
        onClose={() => setOpen(false)}
        myclass={myclass}
      />
    </section>
  );
}
