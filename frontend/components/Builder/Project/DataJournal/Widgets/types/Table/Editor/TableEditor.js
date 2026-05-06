import { useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { useDataJournal } from "../../../../Context/DataJournalContext";
import filterData from "../../../../Helpers/Filter";
import Button from "../../../../../../../DesignSystem/Button";
import Chip from "../../../../../../../DesignSystem/Chip";
import DropdownSelect from "../../../../../../../DesignSystem/DropdownSelect";
import { StyledTableEditor } from "../../../../styles/StyledDataJournal";

const FUNNEL_CHIP_ICON = (
  <img src="/assets/icons/funnel.svg" width={16} height={16} alt="" aria-hidden />
);

export default function TableEditor({ content, onChange, sectionId }) {
  const { t } = useTranslation("builder");
  const { variables, data, settings } = useDataJournal();
  const [expandedFilterField, setExpandedFilterField] = useState(null);
  const [columnSearch, setColumnSearch] = useState("");

  const availableColumns = variables.filter((column) => !column?.hide);
  const visibleColumns = content?.selectors?.visibleColumns;
  const columnFilters = content?.selectors?.filters || {};
  const dataRows = filterData({ data, settings });
  const selectedSet = new Set(
    Array.isArray(visibleColumns)
      ? visibleColumns
      : availableColumns.map((column) => column?.field).filter(Boolean),
  );

  const updateVisibleColumns = (nextVisibleColumns) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: {
          ...(content?.selectors || {}),
          visibleColumns: nextVisibleColumns,
        },
      },
    });
  };

  const updateFilters = (nextFilters) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: {
          ...(content?.selectors || {}),
          filters: nextFilters,
        },
      },
    });
  };

  const toggleColumn = (field) => {
    const nextSet = new Set(selectedSet);
    if (nextSet.has(field)) {
      nextSet.delete(field);
      if (expandedFilterField === field) {
        setExpandedFilterField(null);
      }
    } else {
      nextSet.add(field);
    }
    updateVisibleColumns(Array.from(nextSet));
  };

  const filteredColumns = useMemo(() => {
    const q = columnSearch.trim().toLowerCase();
    if (!q) return availableColumns;
    return availableColumns.filter((column) => {
      const field = String(column?.field ?? "").toLowerCase();
      const display = String(column?.displayName ?? "").toLowerCase();
      return field.includes(q) || display.includes(q);
    });
  }, [availableColumns, columnSearch]);

  const filteredFields = filteredColumns.map((column) => column?.field).filter(Boolean);

  const selectedColumns = availableColumns.filter((column) =>
    selectedSet.has(column?.field),
  );

  const metadataByField = useMemo(() => {
    const result = {};
    selectedColumns.forEach((column) => {
      const field = column?.field;
      if (!field) return;
      const rawValues = dataRows
        .map((row) => row?.[field])
        .filter((value) => value !== null && value !== undefined && value !== "");
      const numericValues = rawValues
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));
      const isNumeric =
        rawValues.length > 0 && numericValues.length === rawValues.length;
      if (isNumeric) {
        result[field] = {
          kind: "numeric",
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
        };
        return;
      }
      result[field] = {
        kind: "categorical",
        options: [...new Set(rawValues.map((value) => String(value)))].sort(),
      };
    });
    return result;
  }, [selectedColumns, dataRows]);

  const updateNumericFilter = (field, nextRange) => {
    updateFilters({
      ...columnFilters,
      [field]: { type: "numeric", ...nextRange },
    });
  };

  const updateCategoricalFilter = (field, value) => {
    if (!value) {
      const nextFilters = { ...columnFilters };
      delete nextFilters[field];
      updateFilters(nextFilters);
      return;
    }
    updateFilters({
      ...columnFilters,
      [field]: { type: "categorical", value },
    });
  };

  const clearAllFilters = () => updateFilters({});
  const toggleExpandedFilter = (field) => {
    setExpandedFilterField((prev) => (prev === field ? null : field));
  };

  return (
    <StyledTableEditor>
      <h3 className="tableEditorTitle">
        {t("dataJournal.table.editor.title", {}, { default: "Columns" })}
      </h3>
      <p className="tableEditorDescription">
        {t("dataJournal.table.editor.description", {}, {
          default: "Quickly choose which columns this table should display.",
        })}
      </p>
      <input
        type="search"
        value={columnSearch}
        onChange={(e) => setColumnSearch(e.target.value)}
        placeholder={t("dataJournal.table.editor.search.placeholder", {}, {
          default: "Search columns…",
        })}
        aria-label={t("dataJournal.table.editor.search.ariaLabel", {}, { default: "Search columns" })}
        autoComplete="off"
        className="tableEditorSearchInput"
      />
      <div className="tableEditorActions">
        <Button
          type="button"
          variant="text"
          className="tableEditorActionButton"
          onClick={() => {
            const next = new Set(selectedSet);
            filteredFields.forEach((f) => next.add(f));
            updateVisibleColumns(Array.from(next));
          }}
        >
          {t("dataJournal.table.editor.actions.selectAll", {}, { default: "Select all" })}
        </Button>
        <Button
          type="button"
          variant="text"
          className="tableEditorActionButton"
          onClick={() => {
            const remove = new Set(filteredFields);
            updateVisibleColumns(
              availableColumns
                .map((c) => c?.field)
                .filter((f) => f && selectedSet.has(f) && !remove.has(f)),
            );
          }}
        >
          {t("dataJournal.table.editor.actions.clearAll", {}, { default: "Clear all" })}
        </Button>
        <Button
          type="button"
          variant="text"
          className="tableEditorActionButton"
          onClick={clearAllFilters}
        >
          {t("dataJournal.table.editor.filters.clear", {}, { default: "Clear filters" })}
        </Button>
      </div>
      {availableColumns.length === 0 ? (
        <div className="tableEditorEmptyState">
          {t("dataJournal.table.editor.empty", {}, {
            default: "No visible columns are available from the dataset.",
          })}
        </div>
      ) : filteredColumns.length === 0 ? (
        <div className="tableEditorEmptyState">
          {t("dataJournal.table.editor.search.noMatches", {}, {
            default: "No columns match your search.",
          })}
        </div>
      ) : (
        <div className="tableEditorRows">
          {filteredColumns.map((column) => {
            const field = column?.field;
            if (!field) return null;
            const label = column?.displayName || field;
            const isSelected = selectedSet.has(field);
            const isExpanded = expandedFilterField === field;
            const meta = metadataByField[field];
            return (
              <div key={field} className="tableEditorRow">
                <div className="tableEditorRowHeader">
                  <label className="tableEditorRowLabel">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleColumn(field)}
                    />
                    <span className="tableEditorRowName" title={label}>{label}</span>
                  </label>
                  {isSelected ? (
                    <Chip
                      shape="square"
                      selected={isExpanded}
                      leading={FUNNEL_CHIP_ICON}
                      label={
                        isExpanded
                          ? t("dataJournal.table.editor.filters.close", {}, { default: "Close" })
                          : t("dataJournal.table.editor.filters.filterSettings", {}, { default: "Filter" })
                      }
                      onClick={() => toggleExpandedFilter(field)}
                      ariaLabel={t("dataJournal.table.editor.filters.toggleAria", { column: label }, {
                        default: "Toggle filters for {{column}}",
                      })}
                      title={t("dataJournal.table.editor.filters.toggleAria", { column: label }, {
                        default: "Toggle filters for {{column}}",
                      })}
                      className="tableEditorFilterChip"
                    />
                  ) : null}
                </div>

                {isSelected && isExpanded && meta ? (
                  <div className="tableEditorFiltersPanel">
                    {meta.kind === "numeric" ? (
                      (() => {
                        const min = meta.min;
                        const max = meta.max;
                        const savedMin = columnFilters?.[field]?.type === "numeric"
                          ? Number(columnFilters?.[field]?.min)
                          : min;
                        const savedMax = columnFilters?.[field]?.type === "numeric"
                          ? Number(columnFilters?.[field]?.max)
                          : max;
                        const currentMin = Number.isFinite(savedMin) ? savedMin : min;
                        const currentMax = Number.isFinite(savedMax) ? savedMax : max;
                        return (
                          <div className="tableEditorRangeGrid">
                            <div>
                              <div className="tableEditorFieldLabel">
                                {t("dataJournal.table.editor.filters.minLabel", {}, { default: "Min" })}
                              </div>
                              <input
                                type="number"
                                value={currentMin}
                                min={min}
                                max={currentMax}
                                onChange={(e) =>
                                  updateNumericFilter(field, {
                                    min: Number(e.target.value),
                                    max: currentMax,
                                  })
                                }
                                className="tableEditorNumericInput"
                              />
                            </div>
                            <div>
                              <div className="tableEditorFieldLabel">
                                {t("dataJournal.table.editor.filters.maxLabel", {}, { default: "Max" })}
                              </div>
                              <input
                                type="number"
                                value={currentMax}
                                min={currentMin}
                                max={max}
                                onChange={(e) =>
                                  updateNumericFilter(field, {
                                    min: currentMin,
                                    max: Number(e.target.value),
                                  })
                                }
                                className="tableEditorNumericInput"
                              />
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <DropdownSelect
                        ariaLabel={t("dataJournal.table.editor.filters.dropdownAria", { column: label }, {
                          default: "Filter {{column}}",
                        })}
                        value={
                          columnFilters?.[field]?.type === "categorical"
                            ? columnFilters?.[field]?.value || ""
                            : ""
                        }
                        onChange={(value) => updateCategoricalFilter(field, value)}
                        options={[
                          {
                            value: "",
                            label: t("dataJournal.table.editor.filters.allValues", {}, { default: "All values" }),
                          },
                          ...(meta.options || []).map((option) => ({ value: option, label: option })),
                        ]}
                        placeholder={t("dataJournal.table.editor.filters.allValues", {}, { default: "All values" })}
                      />
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </StyledTableEditor>
  );
}
