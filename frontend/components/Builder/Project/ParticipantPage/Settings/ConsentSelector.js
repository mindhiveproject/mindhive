import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";

import { GET_CONSENTS } from "../../../../Queries/Consent";

export default function ConsentSelector({
  user,
  study,
  handleChange,
  disabled,
}) {
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
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      <DropdownSelect
        multiple
        portal
        disabled={disabled}
        ariaLabel={t("settingsBlock.askForConsent")}
        placeholder={t("consentSelector.typeConsentProtocol")}
        options={options}
        value={value}
        onChange={onChange}
      />
      {/* new tab, so unsaved builder changes are kept */}
      <a href="/dashboard/irb" target="_blank" rel="noopener noreferrer">
        <Button variant="outline" type="button">
          {t("consentSelector.manageProtocols", {}, {
            default: "Manage consent protocols",
          })}
        </Button>
      </a>
    </div>
  );
}
