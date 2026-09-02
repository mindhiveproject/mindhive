import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../../DesignSystem/DropdownSelect";

export default function Status({ settings, handleChange }) {
  const { t } = useTranslation("classes");
  const options = [
    {
      value: "Started",
      label: t("teacherClass.started", {}, { default: "Started" }),
    },
    {
      value: "Needs feedback",
      label: t("teacherClass.needsFeedback", {}, { default: "Needs feedback" }),
    },
    {
      value: "Feedback given",
      label: t("teacherClass.feedbackGiven", {}, { default: "Feedback given" }),
    },
    {
      value: "Completed",
      label: t("teacherClass.completed", {}, { default: "Completed" }),
    },
  ];

  return (
    <div className="status">
      <DropdownSelect
        value={settings?.status || "Started"}
        onChange={(value) =>
          handleChange({
            target: {
              name: "settings",
              value: { ...settings, status: value },
            },
          })
        }
        options={options}
        placeholder={t("teacherClass.selectStatus", {}, {
          default: "Select status",
        })}
        ariaLabel={t("teacherClass.selectStatus", {}, {
          default: "Select status",
        })}
        fitContent
      />
    </div>
  );
}
