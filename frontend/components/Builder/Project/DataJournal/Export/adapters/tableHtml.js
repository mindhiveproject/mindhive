import filterData from "../../Helpers/Filter";

/**
 * Build semantic HTML table snapshot (mirrors Table.js column/filter logic).
 *
 * @param {object} content - VizSection content
 * @param {{ data?: unknown[]; variables?: unknown[]; settings?: object } | null} slice
 */
export function buildTableHtmlFromContent(content, slice) {
  const data = slice && Array.isArray(slice.data) ? slice.data : [];
  const variables =
    slice && Array.isArray(slice.variables) ? slice.variables : [];
  const settings =
    slice?.settings && typeof slice.settings === "object" ? slice.settings : {};

  const datasetVisibleColumns = variables.filter((column) => !column?.hide);
  const selectedVisibleColumns = content?.selectors?.visibleColumns;
  const columnFilters = content?.selectors?.filters || {};

  const tableColumns = Array.isArray(selectedVisibleColumns)
    ? datasetVisibleColumns.filter((column) =>
        selectedVisibleColumns.includes(column?.field),
      )
    : datasetVisibleColumns;

  const baseRows = filterData({ data, settings });
  const filteredRows = baseRows.filter((row) => {
    return Object.entries(columnFilters).every(([field, filterConfig]) => {
      if (!filterConfig || !field) return true;
      const cellValue = row?.[field];
      if (filterConfig.type === "numeric") {
        const numericValue = Number(cellValue);
        if (!Number.isFinite(numericValue)) return false;
        const minValue = Number(filterConfig.min);
        const maxValue = Number(filterConfig.max);
        const legacyMaxValue = Number(filterConfig.value);
        const hasMin = Number.isFinite(minValue);
        const hasMax = Number.isFinite(maxValue);
        if (!hasMin && !hasMax && Number.isFinite(legacyMaxValue)) {
          return numericValue <= legacyMaxValue;
        }
        if (hasMin && numericValue < minValue) return false;
        if (hasMax && numericValue > maxValue) return false;
        return true;
      }
      if (filterConfig.type === "categorical") {
        if (!filterConfig.value) return true;
        return String(cellValue) === String(filterConfig.value);
      }
      return true;
    });
  });

  const escapeHtml = (val) =>
    String(val ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const headerCells = tableColumns
    .map(
      (col) =>
        `<th style="border:1px solid #A1A1A1;padding:4px 8px;text-align:left;background:#F3F3F3;">${escapeHtml(col?.displayName || col?.field)}</th>`,
    )
    .join("");

  const bodyRows = filteredRows
    .slice(0, 500)
    .map((row) => {
      const cells = tableColumns
        .map(
          (col) =>
            `<td style="border:1px solid #E6E6E6;padding:4px 8px;">${escapeHtml(row?.[col?.field])}</td>`,
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table style="border-collapse:collapse;width:100%;font-size:12px;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}
