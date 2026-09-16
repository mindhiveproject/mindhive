import { useMemo } from "react";

import { dualTextareaSubLabels, fieldLabel } from "../i18n";
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

  const { subA: subALabel, subB: subBLabel } = useMemo(
    () => dualTextareaSubLabels(field, locale),
    [field, locale]
  );

  const updatePart = (part, text) => {
    onChange({ ...current, [part]: text });
  };

  // The second box is only meaningful when its own sub-prompt asks something.
  // Board-scoped copies can lose their sub-labels, and rendering a second
  // unlabelled box there just reads as a stray empty field.
  const showSubB = Boolean(subBLabel);

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
      {showSubB ? (
        <>
          <div className="subtitle">{subBLabel}</div>
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
        </>
      ) : null}
      <ErrorRow error={error} />
    </FieldShell>
  );
}
