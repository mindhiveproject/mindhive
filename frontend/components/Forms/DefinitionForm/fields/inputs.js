// Simple field-type components for DefinitionForm. Each receives the
// same props shape: { field, value, onChange, error, locale, disabled }.
//
// Complex types (rich text, image upload, file upload, video URL with
// embed preview, tag multiselect, json array) live in their own files
// so this module stays small.
import { useMemo } from "react";
import { Dropdown } from "semantic-ui-react";

import { fieldLabel, fieldHelper, fieldPlaceholder, optionLabel } from "../i18n";
import { FieldShell, ReadOnlyBanner } from "../styles";

function LabelHeader({ field, locale }) {
  const label = fieldLabel(field, locale);
  const helper = fieldHelper(field, locale);
  return (
    <>
      <span className="label-text">
        {label}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {helper && <span className="hint">{helper}</span>}
    </>
  );
}

function ErrorRow({ error }) {
  if (!error) return null;
  return <span className="error">{error}</span>;
}

export function TextInput({ field, value, onChange, error, locale, disabled }) {
  return (
    <FieldShell>
      <LabelHeader field={field} locale={locale} />
      <input
        type="text"
        value={value ?? ""}
        placeholder={fieldPlaceholder(field, locale)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={field?.validation?.maxLength || undefined}
      />
      <ErrorRow error={error} />
    </FieldShell>
  );
}

export function TextareaInput({ field, value, onChange, error, locale, disabled }) {
  const wordLimit = field?.validation?.wordLimit;
  const wordCount = useMemo(() => {
    if (!wordLimit || !value) return 0;
    return String(value).trim().split(/\s+/).filter(Boolean).length;
  }, [value, wordLimit]);
  return (
    <FieldShell>
      <LabelHeader field={field} locale={locale} />
      <textarea
        value={value ?? ""}
        placeholder={fieldPlaceholder(field, locale)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={field?.validation?.maxLength || undefined}
      />
      {wordLimit ? (
        <span className="hint">
          {wordCount} / {wordLimit} words
        </span>
      ) : null}
      <ErrorRow error={error} />
    </FieldShell>
  );
}

export function NumberInput({ field, value, onChange, error, locale, disabled }) {
  const { min, max } = field?.validation || {};
  return (
    <FieldShell>
      <LabelHeader field={field} locale={locale} />
      <input
        type="number"
        value={value ?? ""}
        placeholder={fieldPlaceholder(field, locale)}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? null : Number(raw));
        }}
        disabled={disabled}
        min={min}
        max={max}
      />
      <ErrorRow error={error} />
    </FieldShell>
  );
}

export function DateInput({ field, value, onChange, error, locale, disabled }) {
  return (
    <FieldShell>
      <LabelHeader field={field} locale={locale} />
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
      />
      <ErrorRow error={error} />
    </FieldShell>
  );
}

export function CheckboxInput({ field, value, onChange, error, locale, disabled }) {
  const label = fieldLabel(field, locale);
  const helper = fieldHelper(field, locale);
  return (
    <FieldShell as="div">
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span>
          {label}
          {field.isRequired && <span className="required">*</span>}
        </span>
      </label>
      {helper && <span className="hint">{helper}</span>}
      <ErrorRow error={error} />
    </FieldShell>
  );
}

export function SelectInput({ field, value, onChange, error, locale, disabled }) {
  const options = useMemo(() => {
    const raw = Array.isArray(field?.options) ? field.options : [];
    return raw
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((o) => ({
        key: o.value,
        value: o.value,
        text: optionLabel(o, locale),
      }));
  }, [field?.options, locale]);
  return (
    <FieldShell as="div">
      <LabelHeader field={field} locale={locale} />
      <Dropdown
        selection
        clearable={!field.isRequired}
        placeholder={fieldPlaceholder(field, locale)}
        options={options}
        value={value ?? ""}
        onChange={(_, { value: v }) => onChange(v || null)}
        disabled={disabled}
      />
      <ErrorRow error={error} />
    </FieldShell>
  );
}

export function MultiselectInput({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const options = useMemo(() => {
    const raw = Array.isArray(field?.options) ? field.options : [];
    return raw
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((o) => ({
        key: o.value,
        value: o.value,
        text: optionLabel(o, locale),
      }));
  }, [field?.options, locale]);
  return (
    <FieldShell as="div">
      <LabelHeader field={field} locale={locale} />
      <Dropdown
        selection
        multiple
        clearable
        placeholder={fieldPlaceholder(field, locale)}
        options={options}
        value={Array.isArray(value) ? value : []}
        onChange={(_, { value: v }) => onChange(v)}
        disabled={disabled}
      />
      <ErrorRow error={error} />
    </FieldShell>
  );
}

// Read-only HTML — for inline help/info banners inside a card. The
// `field.helperText` (or labelI18n) carries the HTML / plain text to
// display. No value, no onChange.
export function ReadOnlyHtml({ field, locale }) {
  const body = fieldHelper(field, locale) || fieldLabel(field, locale);
  if (!body) return null;
  // eslint-disable-next-line react/no-danger
  return <ReadOnlyBanner dangerouslySetInnerHTML={{ __html: body }} />;
}
