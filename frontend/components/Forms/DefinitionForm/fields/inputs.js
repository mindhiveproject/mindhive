// Simple field-type components for DefinitionForm. Each receives the
// same props shape: { field, value, onChange, error, locale, disabled }.
//
// Complex types (rich text, image upload, file upload, video URL with
// embed preview, tag multiselect, json array) live in their own files
// so this module stays small.
import { useMemo } from "react";
import clsx from "clsx";

import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import { fieldLabel, fieldHelper, fieldPlaceholder, optionLabel } from "../i18n";
import {
  FieldShell,
  ReadOnlyBanner,
  fieldShellLayoutProps,
} from "../styles";

function useSelectOptions(field, locale) {
  return useMemo(() => {
    const raw = Array.isArray(field?.options) ? field.options : [];
    return raw
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((o) => {
        const label = optionLabel(o, locale);
        return {
          value: o.value,
          label,
          labelText: label,
        };
      });
  }, [field?.options, locale]);
}

function selectTriggerStyle(hasError) {
  return {
    border: `2px solid ${
      hasError
        ? "#c0392b"
        : "var(--MH-Theme-Neutrals-Medium, #a1a1a1)"
    }`,
    borderRadius: 8,
    padding: "9px 11px",
    fontFamily: "Lato, sans-serif",
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: 400,
    color: "var(--MH-Theme-Neutrals-Black, #171717)",
    background: "var(--MH-Theme-Neutrals-White, #ffffff)",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  };
}

/** Visible option list for read-only / preview (disabled dropdowns hide choices). */
function SelectOptionsPreview({ options, value, multiple }) {
  const selected = useMemo(() => {
    if (multiple) {
      return new Set(Array.isArray(value) ? value : []);
    }
    if (value == null || value === "") return new Set();
    return new Set([value]);
  }, [value, multiple]);

  if (!options.length) {
    return <div className="select-options-preview field-control-block" />;
  }

  return (
    <ul className="select-options-preview field-control-block" role="list">
      {options.map((o) => {
        const isSelected = selected.has(o.value);
        return (
          <li
            key={String(o.value)}
            className={clsx("select-option-preview", isSelected && "is-selected")}
          >
            <span
              className={clsx(
                "select-option-marker",
                multiple ? "multi" : "single",
              )}
              aria-hidden
            />
            <span>{o.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

function LabelHeader({ field, locale }) {
  const label = fieldLabel(field, locale);
  const helper = fieldHelper(field, locale);
  return (
    <div className="field-label-block">
      <span className="label-text">
        {label}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {helper && <span className="hint">{helper}</span>}
    </div>
  );
}

function ErrorRow({ error }) {
  if (!error) return null;
  return <span className="error">{error}</span>;
}

export function TextInput({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
  readOnlyInline = false,
}) {
  return (
    <FieldShell {...fieldShellLayoutProps({ error, readOnlyInline })}>
      <LabelHeader field={field} locale={locale} />
      <input
        type="text"
        className="field-control-block"
        value={value ?? ""}
        placeholder={fieldPlaceholder(field, locale)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={field?.validation?.maxLength || undefined}
        readOnly={disabled}
      />
      <ErrorRow error={error} />
    </FieldShell>
  );
}

export function TextareaInput({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
  readOnlyInline = false,
}) {
  const wordLimit = field?.validation?.wordLimit;
  const wordCount = useMemo(() => {
    if (!wordLimit || !value) return 0;
    return String(value).trim().split(/\s+/).filter(Boolean).length;
  }, [value, wordLimit]);
  return (
    <FieldShell {...fieldShellLayoutProps({ error, readOnlyInline })}>
      <LabelHeader field={field} locale={locale} />
      <textarea
        className="field-control-block"
        value={value ?? ""}
        placeholder={fieldPlaceholder(field, locale)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={field?.validation?.maxLength || undefined}
        readOnly={disabled}
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

export function NumberInput({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
  readOnlyInline = false,
}) {
  const { min, max } = field?.validation || {};
  return (
    <FieldShell {...fieldShellLayoutProps({ error, readOnlyInline })}>
      <LabelHeader field={field} locale={locale} />
      <input
        type="number"
        className="field-control-block"
        value={value ?? ""}
        placeholder={fieldPlaceholder(field, locale)}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? null : Number(raw));
        }}
        disabled={disabled}
        readOnly={disabled}
        min={min}
        max={max}
      />
      <ErrorRow error={error} />
    </FieldShell>
  );
}

export function DateInput({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
  readOnlyInline = false,
}) {
  return (
    <FieldShell {...fieldShellLayoutProps({ error, readOnlyInline })}>
      <LabelHeader field={field} locale={locale} />
      <input
        type="date"
        className="field-control-block"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        readOnly={disabled}
      />
      <ErrorRow error={error} />
    </FieldShell>
  );
}

export function CheckboxInput({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
  readOnlyInline = false,
}) {
  const label = fieldLabel(field, locale);
  const helper = fieldHelper(field, locale);
  return (
    <FieldShell
      as="div"
      {...fieldShellLayoutProps({ error, readOnlyInline })}
    >
      <div className="field-label-block">
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
      </div>
      <ErrorRow error={error} />
    </FieldShell>
  );
}

export function SelectInput({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
  readOnlyInline = false,
}) {
  const options = useSelectOptions(field, locale);
  const label = fieldLabel(field, locale);
  const placeholder = fieldPlaceholder(field, locale);
  return (
    <FieldShell
      as="div"
      {...fieldShellLayoutProps({ error, readOnlyInline })}
    >
      <LabelHeader field={field} locale={locale} />
      {disabled ? (
        <SelectOptionsPreview options={options} value={value} multiple={false} />
      ) : (
        <div className="field-control-block">
          <DropdownSelect
            ariaLabel={label}
            placeholder={placeholder}
            options={options}
            value={value ?? ""}
            onChange={(v) => onChange(v || null)}
            triggerStyle={selectTriggerStyle(Boolean(error))}
            searchableSingle={options.length > 8}
          />
        </div>
      )}
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
  readOnlyInline = false,
}) {
  const options = useSelectOptions(field, locale);
  const label = fieldLabel(field, locale);
  const placeholder = fieldPlaceholder(field, locale);
  return (
    <FieldShell
      as="div"
      {...fieldShellLayoutProps({ error, readOnlyInline })}
    >
      <LabelHeader field={field} locale={locale} />
      {disabled ? (
        <SelectOptionsPreview options={options} value={value} multiple />
      ) : (
        <div className="field-control-block">
          <DropdownSelect
            multiple
            ariaLabel={label}
            placeholder={placeholder}
            options={options}
            value={Array.isArray(value) ? value.map(String) : []}
            onChange={(v) => onChange(v)}
            triggerStyle={selectTriggerStyle(Boolean(error))}
          />
        </div>
      )}
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
