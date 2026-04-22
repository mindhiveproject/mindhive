import { useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { useDataJournal } from "../../../../Context/DataJournalContext";
import filterData from "../../../../Helpers/Filter";
import Button from "../../../../../../../DesignSystem/Button";
import Chip from "../../../../../../../DesignSystem/Chip";
import DropdownSelect from "../../../../../../../DesignSystem/DropdownSelect";

const INTER = "Inter, sans-serif";

/** Match DataJournal graph editor in-panel title/description typography */
const TITLE_TYPO = {
  fontFamily: INTER,
  fontWeight: 500,
  fontSize: "18px",
  lineHeight: "150%",
  color: "#000000",
};

const BODY_TYPO = {
  fontFamily: INTER,
  fontWeight: 400,
  fontSize: "14px",
  lineHeight: "150%",
  color: "#666666",
};

const FIELD_LABEL_TYPO = {
  fontFamily: INTER,
  fontWeight: 400,
  fontSize: "12px",
  lineHeight: "150%",
  color: "#6A6A6A",
};

const ROW_LABEL_TYPO = {
  fontFamily: INTER,
  fontWeight: 300,
  fontSize: "14px",
  lineHeight: "150%",
  color: "#000000",
};

const INPUT_TYPO = {
  fontFamily: INTER,
  fontWeight: 500,
  fontSize: "14px",
  lineHeight: "150%",
  color: "#000000",
  border: "1px solid #cccccc",
  borderRadius: "10px",
  padding: "10px 12px",
  boxSizing: "border-box",
};

const FUNNEL_CHIP_ICON = (
  <img src="/assets/icons/funnel.svg" width={16} height={16} alt="" aria-hidden />
);

export default function TableEditor({ content, onChange, sectionId }) {
  const { t } = useTranslation("builder");
  const { variables, data, settings } = useDataJournal();
  const [expandedFilterField, setExpandedFilterField] = useState(null);

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

  const allFields = availableColumns.map((column) => column?.field).filter(Boolean);
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
    <div
      style={{
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        fontFamily: INTER,
        padding: "20px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "0.25rem", ...TITLE_TYPO }}>
        {t("dataJournal.table.editor.title", {}, { default: "Columns" })}
      </h3>
      <p style={{ marginTop: 0, marginBottom: "0.75rem", ...BODY_TYPO }}>
        {t("dataJournal.table.editor.description", {}, {
          default: "Quickly choose which columns this table should display.",
        })}
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <Button
          type="button"
          variant="text"
          style={{ height: "32px", padding: "6px 12px" }}
          onClick={() => updateVisibleColumns(allFields)}
        >
          {t("dataJournal.table.editor.actions.selectAll", {}, { default: "Select all" })}
        </Button>
        <Button
          type="button"
          variant="text"
          style={{ height: "32px", padding: "6px 12px" }}
          onClick={() => updateVisibleColumns([])}
        >
          {t("dataJournal.table.editor.actions.clearAll", {}, { default: "Clear all" })}
        </Button>
        <Button
          type="button"
          variant="text"
          style={{ height: "32px", padding: "6px 12px" }}
          onClick={clearAllFilters}
        >
          {t("dataJournal.table.editor.filters.clear", {}, { default: "Clear filters" })}
        </Button>
      </div>
      {availableColumns.length === 0 ? (
        <div style={{ ...BODY_TYPO }}>
          {t("dataJournal.table.editor.empty", {}, {
            default: "No visible columns are available from the dataset.",
          })}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {availableColumns.map((column) => {
            const field = column?.field;
            if (!field) return null;
            const label = column?.displayName || field;
            const isSelected = selectedSet.has(field);
            const isExpanded = expandedFilterField === field;
            const meta = metadataByField[field];
            return (
              <div key={field} style={{ border: "1px solid #E6E6E6", borderRadius: "10px", padding: "0.65rem 0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "space-between" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      margin: 0,
                      flex: 1,
                      font: "inherit",
                      color: "inherit",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleColumn(field)}
                    />
                    <span style={ROW_LABEL_TYPO}>{label}</span>
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
                      style={{ flexShrink: 0, height: "32px" }}
                    />
                  ) : null}
                </div>

                {isSelected && isExpanded && meta ? (
                  <div style={{ marginTop: "0.6rem", paddingTop: "0.6rem", borderTop: "1px solid #F0F0F0" }}>
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
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                            <div>
                              <div style={{ ...FIELD_LABEL_TYPO, marginBottom: "0.25rem" }}>
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
                                style={{ width: "100%", ...INPUT_TYPO }}
                              />
                            </div>
                            <div>
                              <div style={{ ...FIELD_LABEL_TYPO, marginBottom: "0.25rem" }}>
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
                                style={{ width: "100%", ...INPUT_TYPO }}
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
    </div>
  );
}
