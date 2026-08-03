import { useMemo } from "react";
import { Dropdown } from "semantic-ui-react";
import clsx from "clsx";
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

  const sortedOptions = useMemo(() => {
    const raw = Array.isArray(field?.options) ? field.options : [];
    return raw.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [field?.options]);

  const dropdownOptions = useMemo(
    () =>
      sortedOptions.map((option) => ({
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
      })),
    [sortedOptions, locale],
  );

  return (
    <FieldShell as="div" className="reviewItem">
      <span className="label-text">
        {label}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {helper && <span className="hint">{helper}</span>}
      {disabled ? (
        <ul className="select-options-preview" role="list">
          {sortedOptions.map((option) => {
            const isSelected = value === option.value;
            return (
              <li
                key={option.value}
                className={clsx(
                  "select-option-preview",
                  isSelected && "is-selected",
                )}
              >
                <span className="select-option-marker single" aria-hidden />
                <span className="dropdownOption">
                  {option.icon ? (
                    <img
                      src={`/assets/icons/status/${option.icon}.svg`}
                      alt=""
                    />
                  ) : null}
                  <div>
                    <div className="title">{optionLabel(option, locale)}</div>
                    {option.subtitle ? (
                      <div className="subtitle">{option.subtitle}</div>
                    ) : null}
                  </div>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <Dropdown
          placeholder={t("reviewDetail.selectOption")}
          fluid
          selection
          options={dropdownOptions}
          onChange={(_, { value: selected }) => onChange(selected || null)}
          value={value ?? ""}
          className="custom-dropdown"
        />
      )}
      <ErrorRow error={error} />
    </FieldShell>
  );
}
