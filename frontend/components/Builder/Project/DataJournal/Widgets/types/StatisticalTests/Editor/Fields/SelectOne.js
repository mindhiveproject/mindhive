"use client";

import { useMemo } from "react";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../../../../../DesignSystem/DropdownSelect";
import FieldRow from "../../../_shared/FieldRow";

const SELECT_ONE_CLEAR_SENTINEL = "__mh_stat_test_select_one_clear__";

const G_FIELDS = "dataJournal.graph.fields";

export default function SelectOne({
  sectionId,
  options,
  selectors,
  onSelectorChange,
  title,
  parameter,
}) {
  const { t } = useTranslation("builder");

  const stored = selectors[parameter];
  const normalized =
    stored === undefined || stored === null || stored === "" ? "" : String(stored);

  const dropdownOptions = useMemo(() => {
    const clearLabel = t(`${G_FIELDS}.clearSelection`, {}, { default: "None" });
    const clearRow = {
      value: SELECT_ONE_CLEAR_SENTINEL,
      label: clearLabel,
    };
    const rows = (options || [])
      .filter((o) => String(o?.value ?? "") !== SELECT_ONE_CLEAR_SENTINEL)
      .map((o) => ({
        value: String(o?.value ?? ""),
        label: o?.text ?? String(o?.value ?? ""),
      }));
    return [clearRow, ...rows];
  }, [options, t]);

  const placeholder = t(
    `${G_FIELDS}.selectPlaceholder`,
    { field: title },
    { default: "Select {{field}}" },
  );

  const handleChange = (next) => {
    if (next === "" || next === SELECT_ONE_CLEAR_SENTINEL) {
      onSelectorChange({
        target: {
          name: parameter,
          value: "",
        },
      });
      return;
    }
    onSelectorChange({
      target: {
        name: parameter,
        value: next,
      },
    });
  };

  const hiddenValue =
    stored === undefined || stored === null || stored === "" ? "" : String(stored);

  return (
    <FieldRow label={title}>
      <DropdownSelect
        ariaLabel={title}
        placeholder={placeholder}
        value={normalized}
        onChange={handleChange}
        options={dropdownOptions}
        searchableSingle
      />
      <input
        type="hidden"
        id={`${parameter}-${sectionId}`}
        name={parameter}
        value={hiddenValue}
        readOnly
      />
    </FieldRow>
  );
}
