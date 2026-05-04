"use client";

import { useMemo } from "react";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../../../../../DesignSystem/DropdownSelect";
import FieldRow from "../_shared/FieldRow";

/** Matches legacy native <select> first option value for Python / DOM bridges */
const GRAPH_SELECT_NOT_SELECTED = "not selected";

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
    stored === undefined ||
    stored === null ||
    stored === "" ||
    stored === GRAPH_SELECT_NOT_SELECTED
      ? ""
      : String(stored);

  const dropdownOptions = useMemo(
    () =>
      (options || []).map((o) => ({
        value: String(o?.value ?? ""),
        label: o?.text ?? String(o?.value ?? ""),
      })),
    [options],
  );

  const placeholder = t(
    "dataJournal.graph.fields.selectPlaceholder",
    { field: title },
    { default: "Select {{field}}" },
  );

  const handleChange = (next) => {
    onSelectorChange({
      target: {
        name: parameter,
        value: next === "" ? GRAPH_SELECT_NOT_SELECTED : next,
      },
    });
  };

  const hiddenValue =
    stored === undefined ||
    stored === null ||
    stored === "" ||
    stored === GRAPH_SELECT_NOT_SELECTED
      ? GRAPH_SELECT_NOT_SELECTED
      : String(stored);

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
