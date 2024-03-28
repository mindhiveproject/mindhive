import DataTable from "react-data-table-component";

export default function Table({
  content,
  handleContentChange,
  data,
  variables,
}) {
  // update content in the local state
  const handleChange = async (content) => {
    handleContentChange({ name: "text", content });
  };

  // filter columns
  const columns = variables
    .filter((column) => !column?.hide)
    .map((column) => ({
      name: column?.displayName || column?.field,
      selector: (row) => row[column?.field],
      sortable: true,
    }));

  // A super simple expandable component.
  const ExpandedComponent = ({ data }) => (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      pagination
      // expandableRows
      // expandableRowsComponent={ExpandedComponent}
      dense
      highlightOnHover
    />
  );
}
