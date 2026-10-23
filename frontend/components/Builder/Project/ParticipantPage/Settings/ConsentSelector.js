import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../DesignSystem/DropdownSelect";

import { GET_CONSENTS } from "../../../../Queries/Consent";

export default function ConsentSelector({ user, study, handleChange }) {
  const { t } = useTranslation("builder");
  const { data } = useQuery(GET_CONSENTS);
  const consents = data?.consents || [];
  const options = consents.map((consent) => ({
    value: consent.id,
    label: consent.title,
    labelText: consent.title,
  }));

  const value = (study && study?.consent?.map((c) => c?.id)) || [];

  const onChange = (next) => {
    handleChange({
      target: {
        name: "consent",
        value: next.map((c) => ({ id: c })),
      },
    });
  };

  return (
    <DropdownSelect
      multiple
      portal
      ariaLabel={t("settingsBlock.askForConsent")}
      placeholder={t("consentSelector.typeConsentProtocol")}
      options={options}
      value={value}
      onChange={onChange}
    />
  );
}
