"use client";

import { useState, useEffect, useMemo } from "react";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../../../../../DesignSystem/DropdownSelect";
import FieldRow from "../../../_shared/FieldRow";

function normalizeToStringArray(raw) {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (raw === undefined || raw === null || raw === "") return [];
  return [String(raw)];
}

const STATS_FIELDS = "dataJournal.statistics.fields";

export default function SelectMultiple({
  sectionId,
  options,
  selectors,
  onSelectorChange,
  parameter,
  valueMode,
  /** @deprecated use valueMode */
  selectedDataFormat,
}) {
  const { t } = useTranslation("builder");
  const resolvedValueMode = valueMode ?? selectedDataFormat ?? "quant";

  const [selected, setSelected] = useState(() =>
    normalizeToStringArray(selectors[parameter]),
  );

  useEffect(() => {
    setSelected(normalizeToStringArray(selectors[parameter]));
  }, [selectors, parameter]);

  const label =
    resolvedValueMode === "quant"
      ? t(`${STATS_FIELDS}.quantColumnsLabel`, {}, { default: "Quantitative column(s)" })
      : t(`${STATS_FIELDS}.qualColumnsLabel`, {}, { default: "Qualitative column(s)" });

  const dropdownOptions = useMemo(
    () =>
      (options || []).map((o) => ({
        value: String(o?.value ?? ""),
        label: o?.text ?? String(o?.value ?? ""),
      })),
    [options],
  );

  const placeholder = t(
    `${STATS_FIELDS}.selectVariablesPlaceholder`,
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
    <FieldRow label={label}>
      <DropdownSelect
        multiple
        ariaLabel={label}
        placeholder={placeholder}
        value={selected}
        onChange={handleChange}
        options={dropdownOptions}
      />
      <input type="hidden" id={`${parameter}-${sectionId}`} value={hiddenJoined} readOnly />
    </FieldRow>
  );
}
