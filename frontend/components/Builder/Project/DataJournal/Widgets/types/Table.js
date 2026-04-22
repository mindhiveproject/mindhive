import DataTable from "react-data-table-component";
import filterData from "../../Helpers/Filter";

import { useDataJournal } from "../../Context/DataJournalContext";

export default function Table({ content }) {
  const { data, variables, settings } = useDataJournal();

  const datasetVisibleColumns = variables.filter((column) => !column?.hide);
  const selectedVisibleColumns = content?.selectors?.visibleColumns;
  const columnFilters = content?.selectors?.filters || {};

  const tableColumns = Array.isArray(selectedVisibleColumns)
    ? datasetVisibleColumns.filter((column) =>
        selectedVisibleColumns.includes(column?.field),
      )
    : datasetVisibleColumns;

  const columns = tableColumns
    .map((column) => ({
      name: column?.displayName || column?.field,
      selector: (row) => row[column?.field],
      sortable: true,
    }));

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

  return (
    <DataTable
      columns={columns}
      data={filteredRows}
      pagination
      dense
      highlightOnHover
    />
  );
}
