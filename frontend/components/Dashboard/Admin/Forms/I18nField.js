// Reusable per-locale input panel. Renders alongside an English-baseline
// text field. The bag is { "en-us": "...", "es-es": "...", ... } —
// any subset of the platform's 11 supported locales. Empty strings are
// dropped on save so the bag stays compact.
//
// The renderer's pickText falls back to the plain-text baseline column
// when a locale is missing, so admins can leave most languages blank and
// only fill in the ones they care about.
import { useMemo, useState } from "react";
import styled from "styled-components";

import { FieldRow } from "./EditorPanelStyles";

const LOCALES = [
  { code: "en-us", label: "English (US)" },
  { code: "es-es", label: "Español (ES)" },
  { code: "es-la", label: "Español (LA)" },
  { code: "zh-cn", label: "中文" },
  { code: "fr-fr", label: "Français" },
  { code: "ar-ae", label: "العربية" },
  { code: "hi-in", label: "हिन्दी" },
  { code: "hi-ma", label: "हिंदी मराठी" },
  { code: "ru-ru", label: "Русский" },
  { code: "nl-nl", label: "Nederlands" },
  { code: "pt-br", label: "Português" },
];

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  width: max-content;

  &:hover {
    text-decoration: underline;
  }
`;

const LocaleGrid = styled.div`
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 6px 12px;
  align-items: center;
  padding: 8px 0 0;
  border-top: 1px dashed #d3dae0;
  margin-top: 4px;

  .locale-code {
    font-size: 12px;
    color: #5f6871;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
  }

  input,
  textarea {
    border: 1px solid #d3dae0;
    border-radius: 6px;
    padding: 6px 10px;
    font-family: "Lato", sans-serif;
    font-size: 13px;
    color: #171717;
    background: #ffffff;
  }

  textarea {
    min-height: 48px;
    resize: vertical;
  }
`;

// Strip empty / whitespace-only values so the persisted bag stays minimal.
export function cleanI18n(bag) {
  if (!bag || typeof bag !== "object") return null;
  const out = {};
  for (const [k, v] of Object.entries(bag)) {
    if (typeof v === "string" && v.trim() !== "") {
      out[k] = v;
    }
  }
  return Object.keys(out).length ? out : null;
}

export default function I18nField({
  bag,
  onChange,
  multiline = false,
  toggleLabel = "Add translations",
}) {
  const [open, setOpen] = useState(false);

  // Count non-empty locales as a hint on the toggle.
  const filled = useMemo(() => {
    if (!bag || typeof bag !== "object") return 0;
    return Object.values(bag).filter(
      (v) => typeof v === "string" && v.trim() !== ""
    ).length;
  }, [bag]);

  const handleLocaleChange = (code, value) => {
    const next = { ...(bag || {}), [code]: value };
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <ToggleButton type="button" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide translations" : toggleLabel}
        {filled > 0 ? ` (${filled} set)` : ""}
      </ToggleButton>
      {open ? (
        <LocaleGrid>
          {LOCALES.map(({ code, label }) => (
            <FragmentRow
              key={code}
              code={code}
              label={label}
              value={bag?.[code] ?? ""}
              onChange={(v) => handleLocaleChange(code, v)}
              multiline={multiline}
            />
          ))}
        </LocaleGrid>
      ) : null}
    </div>
  );
}

function FragmentRow({ code, label, value, onChange, multiline }) {
  return (
    <>
      <span className="locale-code" title={code}>
        {label}
      </span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </>
  );
}
