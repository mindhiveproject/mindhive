// Multi-row external links stored as plain JSON in the form answer:
//   [{ title, url, comment? }, ...]
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import { fieldHelper, fieldLabel } from "../i18n";
import { FieldShell, fieldShellErrorProps } from "../styles";
import ResourceChipList from "./ResourceChipList";

const MAX_ROWS = 25;

const LINK_CHIP_LEADING = (
  <img
    src="/assets/tiptapIcons/link.svg"
    alt=""
    width={18}
    height={18}
    style={{ display: "block" }}
    aria-hidden
  />
);

function emptyRow() {
  return { title: "", url: "", comment: "" };
}

function normalizeRows(value) {
  if (!Array.isArray(value)) return [];
  return value.map((row) => ({
    title: typeof row?.title === "string" ? row.title : "",
    url: typeof row?.url === "string" ? row.url : "",
    comment: typeof row?.comment === "string" ? row.comment : "",
  }));
}

function chipItemsFromRows(rows) {
  return rows
    .filter((row) => row.url?.trim() || row.title?.trim())
    .map((row, index) => {
      const title = row.title?.trim();
      const url = row.url?.trim() || "";
      const comment = row.comment?.trim() || "";
      let label = title;
      if (!label && url) {
        try {
          label = new URL(url).hostname || url;
        } catch {
          label = url.length > 40 ? `${url.slice(0, 37)}…` : url;
        }
      }
      return {
        key: `link-${index}-${url || label}`,
        label: label || url,
        url: url || null,
        comment: comment || null,
      };
    });
}

export default function LinkListField({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const { t } = useTranslation("common");
  const rows = normalizeRows(value);

  const setRow = (index, patch) => {
    const next = rows.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeRow = (index) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    if (rows.length >= MAX_ROWS) return;
    onChange([...rows, emptyRow()]);
  };

  if (disabled) {
    return (
      <FieldShell as="div" {...fieldShellErrorProps(error)}>
        <span className="label-text">
          {fieldLabel(field, locale)}
          {field.isRequired && <span className="required">*</span>}
        </span>
        {fieldHelper(field, locale) ? (
          <span className="hint">{fieldHelper(field, locale)}</span>
        ) : null}
        <ResourceChipList
          items={chipItemsFromRows(rows)}
          leading={LINK_CHIP_LEADING}
          kind="link"
          emptyLabel={t("definitionForm.linkList.emptyReadonly", {}, {
            default: "No links shared",
          })}
        />
        {error ? <span className="error">{error}</span> : null}
      </FieldShell>
    );
  }

  return (
    <FieldShell as="div" {...fieldShellErrorProps(error)}>
      <span className="label-text">
        {fieldLabel(field, locale)}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {fieldHelper(field, locale) ? (
        <span className="hint">{fieldHelper(field, locale)}</span>
      ) : null}

      {rows.length === 0 ? (
        <span className="hint" style={{ fontStyle: "italic" }}>
          {t("definitionForm.linkList.empty", {}, {
            default: "No links yet — add one below.",
          })}
        </span>
      ) : null}

      {rows.map((row, i) => (
        <div
          key={`link-row-${i}`}
          style={{
            border: "1px solid #d3dae0",
            borderRadius: 8,
            padding: 12,
            display: "grid",
            gap: 10,
            gridTemplateColumns: "1fr 1fr auto",
            alignItems: "end",
            background: "#fafbfc",
          }}
        >
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: "#5f6871" }}>
              {t("definitionForm.linkList.title", {}, { default: "Title" })}
            </span>
            <input
              type="text"
              value={row.title}
              onChange={(e) => setRow(i, { title: e.target.value })}
              placeholder={t("definitionForm.linkList.titlePlaceholder", {}, {
                default: "Resource name",
              })}
              style={{
                border: "1px solid #d3dae0",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 14,
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: "#5f6871" }}>
              {t("definitionForm.linkList.url", {}, { default: "URL" })}
            </span>
            <input
              type="url"
              value={row.url}
              onChange={(e) => setRow(i, { url: e.target.value })}
              placeholder="https://"
              style={{
                border: "1px solid #d3dae0",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 14,
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => removeRow(i)}
            style={{
              background: "none",
              border: "1px solid #d3dae0",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              color: "#c0392b",
              fontSize: 13,
              height: 42,
            }}
          >
            {t("definitionForm.linkList.remove", {}, { default: "Remove" })}
          </button>
          <label
            style={{
              display: "grid",
              gap: 4,
              fontSize: 13,
              gridColumn: "1 / -1",
            }}
          >
            <span style={{ fontWeight: 600, color: "#5f6871" }}>
              {t("definitionForm.linkList.comment", {}, {
                default: "Comment (optional)",
              })}
            </span>
            <input
              type="text"
              value={row.comment}
              onChange={(e) => setRow(i, { comment: e.target.value })}
              placeholder={t("definitionForm.linkList.commentPlaceholder", {}, {
                default: "Short note for viewers",
              })}
              style={{
                border: "1px solid #d3dae0",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 14,
              }}
            />
          </label>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addRow}
        disabled={rows.length >= MAX_ROWS}
      >
        {t("definitionForm.linkList.add", {}, { default: "Add link" })}
      </Button>

      {error ? <span className="error">{error}</span> : null}
    </FieldShell>
  );
}
