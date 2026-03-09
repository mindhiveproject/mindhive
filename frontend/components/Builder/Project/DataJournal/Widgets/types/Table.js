import DataTable from "react-data-table-component";
import filterData from "../../Helpers/Filter";

import { useDataJournal } from "../../Context/DataJournalContext";

export default function Table({}) {
  const { data, variables, settings } = useDataJournal();

  // filter columns
  const columns = variables
    .filter((column) => !column?.hide)
    .map((column) => ({
      name: column?.displayName || column?.field,
      selector: (row) => row[column?.field],
      sortable: true,
    }));

  return (
    <DataTable
      columns={columns}
      data={filterData({ data, settings })}
      pagination
      dense
      highlightOnHover
    />
  );
}
