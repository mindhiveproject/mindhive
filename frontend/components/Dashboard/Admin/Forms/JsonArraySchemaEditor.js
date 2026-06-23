// Structured editor for FormField.jsonArraySchema. Lets admins define
// the sub-fields used in a json_array field (e.g. education rows,
// language rows) without hand-editing JSON.
//
// Shape produced:
// {
//   rowSchema: [
//     { name, fieldType, label, placeholder, defaultValue? }
//   ],
//   addLabel: "Add row",
//   minRows: 0,
//   maxRows: 10
// }
//
// Only sub-field types the runtime JsonArray component actually supports
// are exposed here (text / textarea / number / date / select). Selects
// take their options as a "value|Label" line list, same UX as the main
// FieldEditor.
import { useMemo } from "react";
import styled from "styled-components";

import { FieldRow, PillCheckbox } from "./EditorPanelStyles";

const SUB_FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
];

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid #d3dae0;
  border-radius: 8px;
  background: #fafbfc;
`;

const RowBlock = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 10px;
  align-items: end;
  padding: 10px;
  border: 1px solid #d3dae0;
  border-radius: 8px;
  background: #ffffff;

  .full {
    grid-column: 1 / -1;
  }
`;

const SmallButton = styled.button`
  background: none;
  border: 1px solid #d3dae0;
  border-radius: 8px;
  padding: 8px 12px;
  color: #c0392b;
  font-family: "Nunito", sans-serif;
  font-size: 12px;
  cursor: pointer;
  height: 36px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddRowButton = styled.button`
  align-self: flex-start;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px dashed #336f8a;
  background: #eef5f9;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
`;

function fmtOptions(opts) {
  if (!Array.isArray(opts) || opts.length === 0) return "";
  return opts.map((o) => `${o.value}|${o.label || ""}`).join("\n");
}

function parseOptions(raw) {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [value, ...rest] = line.split("|");
      return {
        value: (value || "").trim(),
        label: (rest.join("|") || value || "").trim(),
        order: i,
      };
    })
    .filter((o) => o.value);
}

export default function JsonArraySchemaEditor({ value, onChange }) {
  const schema = value && typeof value === "object" ? value : {};
  const rowSchema = useMemo(
    () => (Array.isArray(schema.rowSchema) ? schema.rowSchema : []),
    [schema.rowSchema]
  );
  const addLabel = schema.addLabel ?? "Add row";
  const minRows = schema.minRows ?? 0;
  const maxRows = schema.maxRows ?? 10;

  const emit = (next) => {
    const cleaned = {
      rowSchema: Array.isArray(next.rowSchema) ? next.rowSchema : [],
      addLabel: next.addLabel || "Add row",
      minRows: Number.isFinite(Number(next.minRows)) ? Number(next.minRows) : 0,
      maxRows: Number.isFinite(Number(next.maxRows))
        ? Number(next.maxRows)
        : 10,
    };
    onChange(cleaned);
  };

  const updateRow = (index, patch) => {
    const next = rowSchema.slice();
    next[index] = { ...rowSchema[index], ...patch };
    emit({ ...schema, rowSchema: next });
  };

  const removeRow = (index) => {
    emit({
      ...schema,
      rowSchema: rowSchema.filter((_, i) => i !== index),
    });
  };

  const addRow = () => {
    emit({
      ...schema,
      rowSchema: [
        ...rowSchema,
        {
          name: `field_${rowSchema.length + 1}`,
          fieldType: "text",
          label: "",
          placeholder: "",
        },
      ],
    });
  };

  return (
    <Shell>
      <FieldRow style={{ flex: 1 }}>
        <span className="label-text">Add-row button label</span>
        <input
          type="text"
          value={addLabel}
          onChange={(e) => emit({ ...schema, addLabel: e.target.value })}
        />
      </FieldRow>

      <div style={{ display: "flex", gap: 12 }}>
        <FieldRow style={{ flex: 1 }}>
          <span className="label-text">Min rows</span>
          <input
            type="number"
            min={0}
            value={minRows}
            onChange={(e) => emit({ ...schema, minRows: e.target.value })}
          />
        </FieldRow>
        <FieldRow style={{ flex: 1 }}>
          <span className="label-text">Max rows</span>
          <input
            type="number"
            min={1}
            value={maxRows}
            onChange={(e) => emit({ ...schema, maxRows: e.target.value })}
          />
        </FieldRow>
      </div>

      <FieldRow>
        <span className="label-text">Row schema (sub-fields)</span>
        <span className="hint">
          Each entry becomes a column in every row. Sub-fields are limited
          to the types listed below to keep the in-row editor manageable.
        </span>
      </FieldRow>

      {rowSchema.length === 0 ? (
        <span style={{ color: "#888", fontSize: 13, fontStyle: "italic" }}>
          No sub-fields yet — click "Add sub-field" below.
        </span>
      ) : null}

      {rowSchema.map((sf, i) => {
        const isSelect = sf.fieldType === "select";
        return (
          <RowBlock key={i}>
            <FieldRow>
              <span className="label-text">Name</span>
              <input
                type="text"
                value={sf.name || ""}
                onChange={(e) => updateRow(i, { name: e.target.value })}
              />
            </FieldRow>
            <FieldRow>
              <span className="label-text">Type</span>
              <select
                value={sf.fieldType || "text"}
                onChange={(e) => updateRow(i, { fieldType: e.target.value })}
              >
                {SUB_FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow>
              <span className="label-text">Label</span>
              <input
                type="text"
                value={sf.label || ""}
                onChange={(e) => updateRow(i, { label: e.target.value })}
              />
            </FieldRow>
            <SmallButton
              type="button"
              onClick={() => removeRow(i)}
              disabled={rowSchema.length <= 1 && minRows > 0}
              title="Remove sub-field"
            >
              Remove
            </SmallButton>

            <FieldRow className="full">
              <span className="label-text">Placeholder</span>
              <input
                type="text"
                value={sf.placeholder || ""}
                onChange={(e) => updateRow(i, { placeholder: e.target.value })}
              />
            </FieldRow>

            {isSelect ? (
              <FieldRow className="full">
                <span className="label-text">Options (value|Label, one per line)</span>
                <textarea
                  rows={4}
                  value={fmtOptions(sf.options)}
                  onChange={(e) =>
                    updateRow(i, { options: parseOptions(e.target.value) })
                  }
                />
              </FieldRow>
            ) : null}
          </RowBlock>
        );
      })}

      <AddRowButton type="button" onClick={addRow}>
        + Add sub-field
      </AddRowButton>
    </Shell>
  );
}
