import Link from "next/link";
import moment from "moment";
import "moment-duration-format";

// Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-grid.css";
// Optional Theme applied to the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
// React Data Grid Component
import { AgGridReact } from "ag-grid-react";
import ChangeDatasetStatuses from "./ChangeStatuses";

export default function Grid({ studyId, participants }) {
  const OpenButtonRenderer = (props) => {
    return (
      <Link
        href={{
          pathname: `/builder/studies`,
          query: {
            selector: studyId,
            tab: `collect`,
            id: props?.data?.publicId,
            type: props?.data?.accountType?.toLowerCase(),
          },
        }}
      >
        <div>
          <a>Open</a>
        </div>
      </Link>
    );
  };

  const IncludeAnalysisRenderer = (props) => {
    return (
      <ChangeDatasetStatuses
        studyId={studyId}
        participantId={props?.data?.publicId}
        datasets={props?.data?.datasets}
        type={props?.data?.accountType}
      />
    );
  };

  const variables = [
    {
      field: "actions",
      headerName: "",
      cellRenderer: OpenButtonRenderer,
      suppressFilter: true,
      sortable: false, // Disable sorting for this column
      width: 70, // Set a fixed width
      pinned: "left",
    },
    {
      field: "includeAnalysis",
      headerName: "Analysis",
      cellRenderer: IncludeAnalysisRenderer,
      width: 110,
      pinned: "left",
      filter: "agSetColumnFilter",
    },
    {
      field: "publicId",
      headerName: "Public Id",
      filter: "agTextColumnFilter",
    },
    {
      field: "publicReadableId",
      headerName: "Public Readable Id",
      filter: "agTextColumnFilter",
    },
    {
      field: "startedAt",
      headerName: "Started At",
      valueFormatter: (params) =>
        moment(params.value).format("MM/DD/YYYY hh:mm A"),
      filter: "agDateColumnFilter", // Use the date filter
    },
    {
      field: "duration",
      headerName: "Duration",
      valueFormatter: (params) => {
        const duration = moment.duration(
          params.value * 1000 * 60,
          "milliseconds"
        );
        return duration.format("h:mm:ss", { trim: false });
      },
      filter: "agNumberColumnFilter",
    },
    {
      field: "numberCompleted",
      headerName: "Number Completed",
      filter: "agNumberColumnFilter",
    },
    {
      field: "condition",
      headerName: "Condition",
      filter: "agTextColumnFilter",
    },
    { field: "consent", headerName: "Consent", filter: "agTextColumnFilter" },
    {
      field: "accountType",
      headerName: "Account Type",
      filter: "agTextColumnFilter",
    },
  ];

  //  columns definitions
  const colDefs = variables.map((variable) => ({
    field: variable?.field,
    hide: false,
    editable: false,
    headerName: variable?.headerName,
    headerTooltip: variable?.field,
    filter: variable?.filter,
    sortable: variable?.sortable,
    width: variable?.width,
    cellRenderer: variable?.cellRenderer,
    pinned: variable?.pinned,
    valueFormatter: variable?.valueFormatter,
  }));

  // settings
  const pagination = true;
  const paginationPageSize = 50;
  const paginationPageSizeSelector = [20, 50, 100, 200, 500, 1000];

  const autoSizeStrategy = {
    type: "fitGridWidth",
    defaultMinWidth: 100,
    columnLimits: [
      {
        colId: "publicReadableId",
        minWidth: 240,
      },
      {
        colId: "startedAt",
        minWidth: 180,
      },
    ],
  };

  return (
    <div
      className="ag-theme-quartz" // applying the Data Grid theme
      style={{ height: 500 }} // the Data Grid will fill the size of the parent container
    >
      <AgGridReact
        rowData={participants}
        columnDefs={colDefs}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        paginationPageSizeSelector={paginationPageSizeSelector}
        autoSizeStrategy={autoSizeStrategy}
      />
    </div>
  );
}
