import React from "react";
import { Dropdown } from "semantic-ui-react";
import { useRouter } from "next/router";

// User preference language options (for GraphQL)
export const userLanguageOptions = [
  { key: "EN-US", text: "English (American)", value: "EN-US" },
  { key: "ES-ES", text: "Español (Spain)", value: "ES-ES" },
  { key: "ES-LA", text: "Español (Latin America)", value: "ES-LA" },
  { key: "ZH-CN", text: "中文", value: "ZH-CN" },
  { key: "FR-FR", text: "Français", value: "FR-FR" },
  { key: "AR-AE", text: "العربية", value: "AR-AE" },
  { key: "HI-IN", text: "हिन्दी", value: "HI-IN" },
  { key: "HI-MA", text: "हिंदी मराठी", value: "HI-MA" },
  { key: "RU-RU", text: "Русский", value: "RU-RU" },
  { key: "NL-NL", text: "Nederlands", value: "NL-NL" },
  { key: "PT-BR", text: "Português", value: "PT-BR" }
];

const LanguageSelector = ({ handleChange, value }) => {
  const router = useRouter();
  const { locale } = router;

  const changeLanguage = (newLocale) => {
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: newLocale.toLowerCase() });
  };

  return (
    <Dropdown
      placeholder="Select Language"
      fluid
      selection
      options={userLanguageOptions}
      defaultValue={value}
      className="customDropdown"
      onChange={(event, data) => {
        handleChange({
          target: {
            name: "language",
            value: data?.value,
            type: "text",
          },
        });
      }}
    />
  );
};

export default LanguageSelector;