import { Dropdown } from "semantic-ui-react";

export default function CardType({ type, handleChange }) {
  const options = [
    { key: "proposal", text: "Proposal", value: "PROPOSAL" },
    { key: "assignment", text: "Assignment", value: "ASSIGNMENT" },
    { key: "lesson", text: "Lesson", value: "LESSON" },
    { key: "article", text: "Article", value: "ARTICLE" },
    { key: "survey", text: "Survey", value: "SURVEY" },
    { key: "link", text: "Link", value: "LINK" },
    {
      key: "actionSubmit",
      text: "Action card - Submit",
      value: "ACTION_SUBMIT",
    },
  ];

  return (
    <Dropdown
      placeholder="Select type"
      fluid
      selection
      options={options}
      onChange={(e, data) => {
        handleChange({ target: { name: "type", value: data?.value } });
      }}
      value={type}
    />
  );
}
