import DataTable from "react-data-table-component";

// helper function to get all column names of the given dataset
const getColumnNames = (data) => {
  const allKeys = data
    .map((line) => Object.keys(line))
    .reduce((a, b) => a.concat(b), []);
  const keys = Array.from(new Set(allKeys)).sort();
  return keys;
};

export default function Table({ content, handleContentChange, results }) {
  // update content in the local state
  const handleChange = async (content) => {
    handleContentChange({ name: "text", content });
  };

  // console.log({ results });
  const data = results.map((result) => {
    return {
      task: result?.task?.title,
      testVersion: result?.testVersion,
      participant:
        result?.guest?.publicReadableId || result?.user?.publicReadableId,
      ...result?.data,
    };
  });
  // console.log({ data });

  const columns = getColumnNames(data).map((variable) => ({
    name: variable,
    selector: (row) => row[variable],
    sortable: true,
  }));

  return (
    <div className="dataTable">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
