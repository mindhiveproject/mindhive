import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function Status({ settings, handleChange }) {
  const { t } = useTranslation("classes");
  const options = [
    // {
    //   key: "Not started",
    //   text: t("teacherClass.notStarted"),
    //   value: "Not started",
    //   className: "info-status status-not-started",
    // },
    {
      key: "Started",
      text: t("teacherClass.started"),
      value: "Started",
      className: "info-status status-started",
    },
    {
      key: "Needs feedback",
      text: t("teacherClass.needsFeedback"),
      value: "Needs feedback",
      className: "info-status status-needs-feedback",
    },
    {
      key: "Feedback given",
      text: t("teacherClass.feedbackGiven"),
      value: "Feedback given",
      className: "info-status status-feedback-given",
    },
    {
      key: "Completed",
      text: t("teacherClass.completed"),
      value: "Completed",
      className: "info-status status-completed",
    },
  ];

  return (
    <div className="status">
      <Dropdown
        placeholder={t("teacherClass.selectStatus")}
        fluid
        selection
        options={options}
        onChange={(event, data) =>
          handleChange({
            target: {
              name: "settings",
              value: { ...settings, status: data.value },
            },
          })
        }
        value={settings?.status || "Started"}
      />
    </div>
  );
}
