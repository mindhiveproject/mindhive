import { useMemo } from "react";

import { AgGridReact } from "ag-grid-react"; // AG Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the grid

// @Yury, nned help making sure the func below has control
export function CustomTooltip(params) {
  return (
    <div
      style={{
        padding: "10px",
        backgroundColor: "#272727",
        border: "10px solid #d4d4d4",
        transition: "opacity 0.3s",
        opacity: params.hovered ? "1" : "0",
      }}
    >
      {params.value}
    </div>
  );
}

export default function ProcessMain({
  data,
  variables,
  settings,
  updateDataset,
}) {
  const { filter } = settings;

  // check whether the values in the dataset are numbers
  const isNumeric = (string) => Number.isFinite(+string);
  const isNumericScale = ({ variable }) => {
    const values = data.map((row) => row[variable?.field]);
    return values.every((val) => isNumeric(val));
  };

  // re-format columns definitions
  const colDefs = variables.map((variable) => ({
    field: variable?.field,
    hide: variable?.hide,
    editable: variable?.editable,
    headerName: variable?.displayName || variable?.field,
    headerTooltip: variable?.displayName || variable?.field,
    tooltipComponent: "customTooltip",
    tooltipComponentParams: { hovered: true },
    filter: isNumericScale({ variable })
      ? "agNumberColumnFilter"
      : "agTextColumnFilter",
  }));

  // apply settings across all columns
  const defaultColDef = useMemo(() => {
    return {
      initialWidth: 200,
      filter: true,
      floatingFilter: true,
      filterParams: {
        maxNumConditions: 1, // This disables the AND/OR logic
      },
      // wrapHeaderText: true,
      // autoHeaderHeight: true,
    };
  }, []);

  // settings
  const pagination = true;
  const paginationPageSize = 100;
  const paginationPageSizeSelector = [50, 100, 200, 500, 1000];

  const onFilterChanged = (params) => {
    const allFilterModels = params.api.getFilterModel();
    const updatedSettings = {
      ...settings,
      filter: allFilterModels,
    };
    updateDataset({ updatedSettings });
  };

  const onGridReady = (params) => {
    if (filter && Object.keys(filter).length) {
      params.api.setFilterModel(filter);
    }
  };

  const gridOptions = {
    onFilterChanged: onFilterChanged,
    onGridReady: onGridReady,
  };

  if (data && data?.length) {
    return (
      <div>
        <div
          className="ag-theme-quartz" // applying the grid theme
          style={{ width: "100%", height: "100%" }}
        >
          <AgGridReact
            rowData={data}
            gridOptions={gridOptions}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            pagination={pagination}
            paginationPageSize={paginationPageSize}
            paginationPageSizeSelector={paginationPageSizeSelector}
            frameworkComponents={{ customTooltip: CustomTooltip }}
          />
          {/* // onCellValueChanged={(event) => console.log({ event })}
          /> */}
        </div>
      </div>
    );
  }
}
