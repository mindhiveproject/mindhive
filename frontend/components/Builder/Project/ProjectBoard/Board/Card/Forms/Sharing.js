import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function CardType({ type, handleChange }) {
  const { t } = useTranslation("builder");
  const options = [
    { key: "collective", text: t("sharingCard.collective", "Collective"), value: "COLLECTIVE" },
    { key: "individual", text: t("sharingCard.individual", "Individual"), value: "INDIVIDUAL" },
  ];

  return (
    <Dropdown
      placeholder={t("sharingCard.selectType", "Select type")}
      fluid
      selection
      options={options}
      onChange={(e, data) => {
        handleChange({ target: { name: "shareType", value: data?.value } });
      }}
      value={type}
    />
  );
}
