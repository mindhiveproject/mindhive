// Variable-length array of structured rows. The row schema is provided
// by the admin in `field.jsonArraySchema`:
//
//   {
//     rowSchema: [
//       { name: "institution", fieldType: "text", label: "Institution",
//         placeholder: "MIT" },
//       { name: "degree",      fieldType: "text", label: "Degree" }
//     ],
//     addLabel: "Add row",
//     minRows: 0,
//     maxRows: 10
//   }
//
// Each row sub-field is rendered via the same field registry — but only
// the simple types are realistic to embed here. Complex nested types
// (image, json_array recursion, rich_text) are not allowed in v1.
import { fieldLabel, fieldHelper } from "../i18n";
import { FieldShell } from "../styles";
import { TextInput, TextareaInput, NumberInput, DateInput, SelectInput } from "./inputs";

const SUBFIELD_REGISTRY = {
  text: TextInput,
  textarea: TextareaInput,
  number: NumberInput,
  date: DateInput,
  select: SelectInput,
};

function emptyRow(rowSchema) {
  const row = {};
  for (const sf of rowSchema || []) {
    row[sf.name] =
      sf.defaultValue ??
      (sf.fieldType === "number"
        ? null
        : sf.fieldType === "select"
          ? ""
          : "");
  }
  return row;
}

export default function JsonArray({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const schema = field?.jsonArraySchema || {};
  const rowSchema = Array.isArray(schema.rowSchema) ? schema.rowSchema : [];
  const addLabel = schema.addLabel || "Add row";
  const minRows = schema.minRows ?? 0;
  const maxRows = schema.maxRows ?? 50;
  const rows = Array.isArray(value) ? value : [];

  const setRow = (index, patch) => {
    const next = rows.slice();
    next[index] = { ...rows[index], ...patch };
    onChange(next);
  };

  const removeRow = (index) => {
    if (rows.length <= minRows) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    if (rows.length >= maxRows) return;
    onChange([...rows, emptyRow(rowSchema)]);
  };

  return (
    <FieldShell as="div">
      <span className="label-text">
        {fieldLabel(field, locale)}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {fieldHelper(field, locale) ? (
        <span className="hint">{fieldHelper(field, locale)}</span>
      ) : null}

      {rows.length === 0 ? (
        <span className="hint" style={{ fontStyle: "italic" }}>
          No rows yet — click {addLabel} below to add one.
        </span>
      ) : null}

      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #d3dae0",
            borderRadius: 8,
            padding: 12,
            display: "grid",
            gap: 12,
            gridTemplateColumns: `repeat(${rowSchema.length || 1}, 1fr) auto`,
            alignItems: "end",
            background: "#fafbfc",
          }}
        >
          {rowSchema.map((sf) => {
            const SubComponent = SUBFIELD_REGISTRY[sf.fieldType] || TextInput;
            return (
              <SubComponent
                key={sf.name}
                field={sf}
                value={row?.[sf.name]}
                onChange={(v) => setRow(i, { [sf.name]: v })}
                locale={locale}
                disabled={disabled}
              />
            );
          })}
          <button
            type="button"
            onClick={() => removeRow(i)}
            disabled={disabled || rows.length <= minRows}
            style={{
              background: "none",
              border: "1px solid #d3dae0",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: rows.length <= minRows ? "not-allowed" : "pointer",
              color: "#c0392b",
              fontSize: 13,
              alignSelf: "end",
              height: 42,
            }}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        disabled={disabled || rows.length >= maxRows}
        style={{
          background: "#eef5f9",
          border: "1px dashed #336f8a",
          borderRadius: 8,
          padding: "10px 16px",
          color: "#336f8a",
          fontFamily: "Nunito, sans-serif",
          fontWeight: 600,
          cursor: rows.length >= maxRows ? "not-allowed" : "pointer",
          width: "max-content",
        }}
      >
        + {addLabel}
      </button>

      {error ? <span className="error">{error}</span> : null}
    </FieldShell>
  );
}
