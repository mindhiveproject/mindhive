import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import TaskVisibilityModal from "./TaskVisibilityModal";

// Class Settings section for the class's task block list (Class.hiddenTasks).
export default function TaskVisibilitySettings({ myclass }) {
  const { t } = useTranslation("classes");
  const [open, setOpen] = useState(false);

  // Hidden tasks that are not public right now don't affect students.
  const hiddenCount = (myclass?.hiddenTasks || []).filter(
    (task) => task?.public
  ).length;

  return (
    <section className="settingsSection">
      <div className="settingsSectionHeader">
        <h3>{t("taskVisibility.title", {}, { default: "Tasks & surveys" })}</h3>
        <p>
          {t(
            "taskVisibility.description",
            {},
            {
              default:
                "Choose which public tasks and surveys your students see on the discover page, in the descriptions PDF and in the study builder.",
            }
          )}
        </p>
      </div>
      <div className="block curriculumTypeBlock">
        <p className="classDescriptionSettingsHint">
          {hiddenCount
            ? t(
                "taskVisibility.summaryHidden",
                { count: hiddenCount },
                {
                  default: `${hiddenCount} hidden from your students. Everything else, including anything published later, is visible.`,
                }
              )
            : t(
                "taskVisibility.summaryAll",
                {},
                {
                  default:
                    "All public tasks and surveys are visible to your students.",
                }
              )}
        </p>
        <div>
          <Button variant="outline" onClick={() => setOpen(true)}>
            {t("taskVisibility.manage", {}, { default: "Manage" })}
          </Button>
        </div>
      </div>

      <TaskVisibilityModal
        open={open}
        onClose={() => setOpen(false)}
        myclass={myclass}
      />
    </section>
  );
}
