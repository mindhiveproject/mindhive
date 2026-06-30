import { useMemo } from "react";

import { fieldLabel, optionLabel } from "../i18n";
import { FieldShell } from "../styles";

function ErrorRow({ error }) {
  if (!error) return null;
  return <span className="error">{error}</span>;
}

function normalizeValue(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      subA: value.subA ?? "",
      subB: value.subB ?? "",
    };
  }
  return { subA: "", subB: "" };
}

export default function DualTextarea({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const label = fieldLabel(field, locale);
  const current = normalizeValue(value);

  const [subALabel, subBLabel] = useMemo(() => {
    const raw = Array.isArray(field?.options) ? field.options : [];
    const sorted = raw
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return [
      sorted[0] ? optionLabel(sorted[0], locale) : "",
      sorted[1] ? optionLabel(sorted[1], locale) : "",
    ];
  }, [field?.options, locale]);

  const updatePart = (part, text) => {
    onChange({ ...current, [part]: text });
  };

  return (
    <FieldShell as="div" className="reviewItem">
      {label ? (
        <span className="label-text">
          {label}
          {field.isRequired && <span className="required">*</span>}
        </span>
      ) : null}
      {subALabel ? <div className="subtitle">{subALabel}</div> : null}
      <textarea
        type="text"
        id={`${field.name}-subA`}
        name={`${field.name}-subA`}
        value={current.subA}
        className="answer"
        onChange={(e) => updatePart("subA", e.target.value)}
        disabled={disabled}
        maxLength={field?.validation?.maxLength || undefined}
      />
      {subBLabel ? <div className="subtitle">{subBLabel}</div> : null}
      <textarea
        type="text"
        id={`${field.name}-subB`}
        name={`${field.name}-subB`}
        value={current.subB}
        className="answer"
        onChange={(e) => updatePart("subB", e.target.value)}
        disabled={disabled}
        maxLength={field?.validation?.maxLength || undefined}
      />
      <ErrorRow error={error} />
    </FieldShell>
  );
}
