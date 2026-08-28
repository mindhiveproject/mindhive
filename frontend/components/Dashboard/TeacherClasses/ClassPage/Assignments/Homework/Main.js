import Link from "next/link";
import moment from "moment";
import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import ReviewHomework from "./Review";
import Button from "../../../../../DesignSystem/Button";
import Chip from "../../../../../DesignSystem/Chip";

// Homework status -> Chip tone (was a bespoke colour map; keeps the coding).
const STATUS_TONE = {
  completed: "success",
  submitted: "success",
  "feedback given": "success",
  started: "info",
  "in progress": "info",
  "needs feedback": "warning",
};
const statusTone = (status) =>
  STATUS_TONE[String(status || "").toLowerCase()] ?? "neutral";

const GridContainer = styled.div`
  width: 100%;
  height: 500px;
  margin-top: 24px;
  
  .ag-theme-alpine {
    --ag-font-family: "Inter", sans-serif;
    --ag-font-size: 14px;
    --ag-header-height: 48px;
    --ag-row-height: 48px;
    --ag-header-background-color: #f5f5f5;
    --ag-header-foreground-color: #1a1a1a;
    --ag-border-color: #e0e0e0;
    --ag-row-hover-color: #f5f5f5;
  }
`;

export default function HomeworkMain({
  code,
  myclass,
  user,
  query,
  homeworks,
}) {
  const { t } = useTranslation("classes");
  const { homework } = query;

  if (homework) {
    return (
      <ReviewHomework
        code={code}
        myclass={myclass}
        user={user}
        query={query}
        homeworkCode={homework}
      />
    );
  }

  // Process homework data for grid
  const rowData = useMemo(() => {
    if (!homeworks || !Array.isArray(homeworks)) return [];
    return homeworks.map((work) => ({
      id: work?.id,
      code: work?.code,
      username: work?.author?.username || 'Unknown',
      createdAt: work?.createdAt,
      status: work?.settings?.status || 'Not started',
      title: work?.title || '',
    }));
  }, [homeworks]);

  // Status renderer
  const StatusRenderer = (params) => {
    const status = params?.value || 'Not started';
    return <Chip variant="static" tone={statusTone(status)} label={status} />;
  };

  // View button renderer
  const ViewButtonRenderer = (params) => {
    const homeworkCode = params?.data?.code;
    if (!homeworkCode) return null;

    return (
      <Link
        href={{
          pathname: `/dashboard/myclasses/${myclass?.code}`,
          query: {
            page: "assignments",
            action: "view",
            assignment: code,
            homework: homeworkCode,
          },
        }}
        style={{ textDecoration: 'none' }}
      >
        <Button variant="filled">
          {t("assignment.view", {}, { default: "View" })}
        </Button>
      </Link>
    );
  };

  // Column definitions
  const columnDefs = useMemo(() => [
    {
      field: "username",
      headerName: t("students.username") || "Username",
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      pinned: "left",
    },
    {
      field: "createdAt",
      headerName: t("assignment.dateCreated") || "Date",
      valueFormatter: (params) =>
        params.value ? moment(params.value).format("MMMM D, YYYY") : '',
      filter: "agDateColumnFilter",
      sortable: true,
      flex: 1,
    },
    {
      field: "status",
      headerName: t("assignment.status") || "Status",
      cellRenderer: StatusRenderer,
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1.5,
    },
    {
      field: "view",
      headerName: "Actions",
      cellRenderer: ViewButtonRenderer,
      suppressFilter: true,
      sortable: false,
      width: 120,
      pinned: "right",
      cellStyle: { 
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
  ], [code, myclass, t]);

  // Grid settings
  const pagination = true;
  const paginationPageSize = 20;
  const paginationPageSizeSelector = [10, 20, 50, 100];

  const autoSizeStrategy = {
    type: "fitGridWidth",
    defaultMinWidth: 100,
  };

  if (!homeworks || homeworks.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
        {t("assignment.noHomework") || "No homework submissions yet"}
      </div>
    );
  }

  return (
    <GridContainer>
      <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          pagination={pagination}
          paginationPageSize={paginationPageSize}
          paginationPageSizeSelector={paginationPageSizeSelector}
          autoSizeStrategy={autoSizeStrategy}
          defaultColDef={{
            resizable: true,
          }}
        />
      </div>
    </GridContainer>
  );
}
