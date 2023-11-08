import React from "react";
import { Dropdown } from "semantic-ui-react";

export const languageOptions = [
  {
    key: "EN-US",
    text: "English (US)",
    value: "EN-US",
    locale: "en-US",
    flag: "us",
  },
  {
    key: "EN-GB",
    text: "English (UK)",
    value: "EN-GB",
    locale: "en-GB",
    flag: "gb",
  },
  { key: "BG", text: "Български", value: "BG", locale: "bg", flag: "bg" },
  { key: "ZH", text: "中文", value: "ZH", locale: "zh", flag: "cn" },
  { key: "CS", text: "Čeština", value: "CS", locale: "cs", flag: "cs" },
  { key: "DA", text: "Dansk", value: "DA", locale: "da", flag: "dk" },
  { key: "NL", text: "Nederlands", value: "NL", locale: "nl", flag: "nl" },
  { key: "ET", text: "Eesti keel", value: "ET", locale: "et", flag: "et" },
  { key: "FI", text: "Suomi", value: "FI", locale: "fi", flag: "fi" },
  { key: "FR", text: "Français", value: "FR", locale: "fr", flag: "fr" },
  { key: "DE", text: "Deutsch", value: "DE", locale: "de", flag: "de" },
  { key: "EL", text: "Ελληνικά", value: "EL", locale: "el", flag: "gr" },
  { key: "HU", text: "Magyar", value: "HU", locale: "hu", flag: "hu" },
  { key: "IT", text: "Italiano", value: "IT", locale: "it", flag: "it" },
  { key: "JA", text: "日本語", value: "JA", locale: "ja", flag: "jp" },
  { key: "KO", text: "한국어", value: "KO", locale: "ko", flag: "kr" },
  { key: "LV", text: "Latviešu valoda", value: "LV", locale: "lv", flag: "lv" },
  { key: "LT", text: "Lietuvių kalba", value: "LT", locale: "lt", flag: "lt" },
  { key: "PL", text: "Polski", value: "PL", locale: "pl", flag: "pl" },
  {
    key: "PT-PT",
    text: "Português",
    value: "PT-PT",
    locale: "pt-PT",
    flag: "pt",
  },
  {
    key: "PT-BR",
    text: "Português (BR)",
    value: "PT-BR",
    locale: "pt-BR",
    flag: "br",
  },
  { key: "RO", text: "Român", value: "RO", locale: "ro", flag: "ro" },
  { key: "RU", text: "Русский", value: "RU", locale: "ru", flag: "ru" },
  { key: "SK", text: "Slovenčina", value: "SK", locale: "sk", flag: "sk" },
  { key: "SL", text: "Slovenščina", value: "SL", locale: "sl", flag: "sl" },
  { key: "ES", text: "Español", value: "ES", locale: "es", flag: "es" },
  { key: "SV", text: "Svenska", value: "SV", locale: "sv", flag: "sv" },
];

const LanguageSelector = ({ handleChange, value }) => (
  <Dropdown
    placeholder="Select Language"
    fluid
    selection
    options={languageOptions}
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

export default LanguageSelector;
