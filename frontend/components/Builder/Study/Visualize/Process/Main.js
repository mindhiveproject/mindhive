import { useState, useMemo } from "react";

import { AgGridReact } from "ag-grid-react"; // AG Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the grid

export default function ProcessMain({ data, variables }) {
  // re-format columns definitions
  const colDefs = variables.map((variable) => ({
    field: variable?.field,
    hide: variable?.hide,
    editable: variable?.editable,
  }));

  // apply settings across all columns
  const defaultColDef = useMemo(() => ({
    // filter: true,
    // floatingFilter: true,
  }));

  // settings
  const pagination = true;
  const paginationPageSize = 500;
  const paginationPageSizeSelector = [200, 500, 1000];

  if (data && data?.length) {
    return (
      <div>
        <div
          className="ag-theme-quartz" // applying the grid theme
          style={{ width: "100%", height: "100%" }}
        >
          <AgGridReact
            rowData={data}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            pagination={pagination}
            paginationPageSize={paginationPageSize}
            paginationPageSizeSelector={paginationPageSizeSelector}
            // onCellValueChanged={(event) => console.log({ event })}
          />
        </div>
      </div>
    );
  }
}
