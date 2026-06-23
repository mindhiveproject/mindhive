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
import { FieldShell } from "../styles";

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
    <FieldShell as="div">
      <span className="label-text">
        {fieldLabel(field, locale)}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {fieldHelper(field, locale) ? (
        <span className="hint">{fieldHelper(field, locale)}</span>
      ) : null}
      <div
        style={{
          border: "1px solid #d3dae0",
          borderRadius: 8,
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        <TipTapEditor
          content={typeof value === "string" ? value : ""}
          onUpdate={handleUpdate}
          isEditable={!disabled}
          toolbarVisible
        />
      </div>
      {error ? <span className="error">{error}</span> : null}
    </FieldShell>
  );
}
