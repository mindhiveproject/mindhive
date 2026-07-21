// Rich-text field — thin wrapper around the existing TipTapEditor so
// definition-driven forms can offer the same writing experience as the
// rest of the platform. Output is an HTML string (TipTap's getHTML()).
//
// We hide the collaboration props on purpose: a form field is a one-
// session editor, not a long-lived collaborative document. The toolbar
// stays visible.
import { useCallback } from "react";
import TipTapEditor from "../../../TipTap/Main";

import { fieldLabel, fieldHelper } from "../i18n";
import { FieldShell, fieldShellErrorProps } from "../styles";

export default function RichText({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const handleUpdate = useCallback(
    (html) => onChange(html ?? ""),
    [onChange]
  );

  return (
    <FieldShell as="div" {...fieldShellErrorProps(error)}>
      <span className="label-text">
        {fieldLabel(field, locale)}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {fieldHelper(field, locale) ? (
        <span className="hint">{fieldHelper(field, locale)}</span>
      ) : null}
      {/* TipTapEditor renders its own styled container (border,
          border-radius, background). Wrapping it in another styled
          <div> caused visible double-rounding — the outer radius +
          overflow-hidden clipped the inner element's own rounded
          corners at a different radius. Let TipTap own its chrome. */}
      <TipTapEditor
        content={typeof value === "string" ? value : ""}
        onUpdate={handleUpdate}
        isEditable={!disabled}
        toolbarVisible
      />
      {error ? <span className="error">{error}</span> : null}
    </FieldShell>
  );
}
