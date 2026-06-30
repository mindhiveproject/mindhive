import { useMemo } from "react";
import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { fieldLabel, fieldHelper, optionLabel } from "../i18n";
import { FieldShell } from "../styles";

function ErrorRow({ error }) {
  if (!error) return null;
  return <span className="error">{error}</span>;
}

export default function SelectOneIcon({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const { t } = useTranslation("builder");
  const label = fieldLabel(field, locale);
  const helper = fieldHelper(field, locale);

  const options = useMemo(() => {
    const raw = Array.isArray(field?.options) ? field.options : [];
    return raw
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((option) => ({
        key: option.value,
        value: option.value,
        content: (
          <div className="dropdownOption">
            {option.icon ? (
              <img src={`/assets/icons/status/${option.icon}.svg`} alt="" />
            ) : null}
            <div>
              <div className="title">{optionLabel(option, locale)}</div>
              {option.subtitle ? (
                <div className="subtitle">{option.subtitle}</div>
              ) : null}
            </div>
          </div>
        ),
        text: (
          <div className="dropdownSelectedOption">
            {option.icon ? (
              <img src={`/assets/icons/status/${option.icon}.svg`} alt="" />
            ) : null}
            <div>
              <div className="title">{optionLabel(option, locale)}</div>
            </div>
          </div>
        ),
      }));
  }, [field?.options, locale]);

  return (
    <FieldShell as="div" className="reviewItem">
      <span className="label-text">
        {label}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {helper && <span className="hint">{helper}</span>}
      <Dropdown
        placeholder={t("reviewDetail.selectOption")}
        fluid
        selection
        options={options}
        onChange={(_, { value: selected }) => onChange(selected || null)}
        value={value ?? ""}
        className="custom-dropdown"
        disabled={disabled}
      />
      <ErrorRow error={error} />
    </FieldShell>
  );
}
