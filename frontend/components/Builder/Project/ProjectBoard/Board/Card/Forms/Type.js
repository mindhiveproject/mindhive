import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function CardType({ type, handleChange }) {
  const { t } = useTranslation("builder");
  const options = [
    { key: "proposal", text: t("typeCard.proposal", "Proposal"), value: "PROPOSAL" },
    { key: "assignment", text: t("typeCard.assignment", "Assignment"), value: "ASSIGNMENT" },
    { key: "lesson", text: t("typeCard.lesson", "Lesson"), value: "LESSON" },
    { key: "article", text: t("typeCard.article", "Article"), value: "ARTICLE" },
    { key: "survey", text: t("typeCard.survey", "Survey"), value: "SURVEY" },
    { key: "link", text: t("typeCard.link", "Link"), value: "LINK" },
  ];

  return (
    <Dropdown
      placeholder={t("typeCard.selectType", "Select type")}
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
