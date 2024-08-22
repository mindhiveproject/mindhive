import { Dropdown } from "semantic-ui-react";

export default function Status({ settings, handleChange }) {
  const options = [
    // {
    //   key: "Not started",
    //   text: "Not started",
    //   value: "Not started",
    //   className: "info-status status-not-started",
    // },
    {
      key: "Started",
      text: "Started",
      value: "Started",
      className: "info-status status-started",
    },
    {
      key: "Needs feedback",
      text: "Needs feedback",
      value: "Needs feedback",
      className: "info-status status-needs-feedback",
    },
    {
      key: "Feedback given",
      text: "Feedback given",
      value: "Feedback given",
      className: "info-status status-feedback-given",
    },
    {
      key: "Completed",
      text: "Completed",
      value: "Completed",
      className: "info-status status-completed",
    },
  ];

  return (
    <div className="status">
      <Dropdown
        placeholder="Select status"
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
