"use client";

import { useState, useEffect, useMemo } from "react";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../../../../../DesignSystem/DropdownSelect";
import FieldRow from "../_shared/FieldRow";

function normalizeToStringArray(raw) {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (raw === undefined || raw === null || raw === "") return [];
  return [String(raw)];
}

export default function SelectMultiple({
  sectionId,
  options,
  selectors,
  onSelectorChange,
  title,
  parameter,
}) {
  const { t } = useTranslation("builder");

  const [selected, setSelected] = useState(() =>
    normalizeToStringArray(selectors[parameter]),
  );

  useEffect(() => {
    setSelected(normalizeToStringArray(selectors[parameter]));
  }, [selectors, parameter]);

  const dropdownOptions = useMemo(
    () =>
      (options || []).map((o) => ({
        value: String(o?.value ?? ""),
        label: o?.text ?? String(o?.value ?? ""),
      })),
    [options],
  );

  const placeholder = t(
    "dataJournal.graph.fields.selectVariablesPlaceholder",
    {},
    { default: "Select variable(s)" },
  );

  const handleChange = (nextArr) => {
    const next = Array.isArray(nextArr) ? nextArr.map(String) : [];
    setSelected(next);
    onSelectorChange({
      target: {
        name: parameter,
        value: next,
      },
    });
  };

  const hiddenJoined = selected.join(",");

  return (
    <FieldRow label={title}>
      <DropdownSelect
        multiple
        ariaLabel={title}
        placeholder={placeholder}
        value={selected}
        onChange={handleChange}
        options={dropdownOptions}
      />
      <input type="hidden" id={`${parameter}-${sectionId}`} value={hiddenJoined} readOnly />
    </FieldRow>
  );
}
