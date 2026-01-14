import moment from "moment";
import Link from "next/link";
import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

// Styled button matching Figma design (Primary Action - Teal)
const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
  text-align: center;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: #336F8A;
  color: #ffffff;
  
  &:hover {
    background: #ffc107;
    color: #1a1a1a;
  }
  
  &:active {
    background: #4db6ac;
    color: #1a1a1a;
  }
  
  &:disabled {
    background: #e0e0e0;
    color: #9e9e9e;
    cursor: not-allowed;
  }
`;


const GridContainer = styled.div`
  width: 100%;
  height: 600px;
  margin-top: 24px;
  
  .ag-theme-alpine {
    --ag-font-family: Lato;
    --ag-font-size: 14px;
    --ag-header-height: 48px;
    --ag-row-height: 48px;
    --ag-header-background-color: #f5f5f5;
    --ag-header-foreground-color: #1a1a1a;
    --ag-border-color: #e0e0e0;
    --ag-row-hover-color: #f5f5f5;
  }
`;

// Status chip styled component
const StatusChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 16px;
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
  border: none;
  
  ${props => {
    const status = props.status?.toLowerCase() || '';
    if (status === 'submitted') {
      return `
        background: #E0F2F1; /* Light teal */
        color: #00695C;      /* Medium green */
      `;
    } else if (status === 'needs feedback') {
      return `
        background: #FCE4EC; /* Light pink */
        color: #C2185B;      /* Medium red */
      `;
    } else if (status === 'feedback given') {
      return `
        background: #F3E5F5; /* Light purple */
        color: #7B1FA2;      /* Medium purple */
      `;
    } else if (status === 'in progress') {
      return `
        background: #E3F2FD; /* Light blue */
        color: #1976D2;      /* Medium blue */
      `;
    } else {
      return `
        background: #F5F5F5; /* Light gray */
        color: #616161;      /* Gray text */
      `;
    }
  }}
`;

export default function AssignmentTab({ assignments, myclass, user, query }) {
  const { t } = useTranslation("common");

  // Strip HTML from title
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  // Process assignments for grid
  const rowData = useMemo(() => {
    if (!assignments || !Array.isArray(assignments)) return [];
    return assignments
      .filter((a) => a?.public)
      .map((assignment) => {
        // Get the user's homework for this assignment
        const userHomework = assignment?.homework && assignment.homework.length > 0 
          ? assignment.homework[0] 
          : null;
        
        // Determine status based on homework settings
        let status = "Not Started";
        if (userHomework) {
          const homeworkStatus = userHomework?.settings?.status || "Started";
          // Map status values to display text
          if (homeworkStatus === "Completed") {
            status = "Submitted";
          } else if (homeworkStatus === "Needs feedback") {
            status = "Needs feedback";
          } else if (homeworkStatus === "Feedback given") {
            status = "Feedback given";
          } else {
            status = "In Progress";
          }
        }
        
        return {
          id: assignment?.id,
          code: assignment?.code,
          title: stripHtml(assignment?.title || ''),
          createdAt: assignment?.createdAt,
          status: status,
        };
      });
  }, [assignments]);

  // Title renderer with HTML stripped
  const TitleRenderer = (params) => {
    const title = params?.value || '';
    return <span>{title}</span>;
  };

  // Status renderer with chip
  const StatusRenderer = (params) => {
    const status = params?.value || 'Not Started';
    return <StatusChip status={status}>{status}</StatusChip>;
  };

  // Open button renderer
  const OpenButtonRenderer = (params) => {
    const assignmentCode = params?.data?.code;
    if (!assignmentCode) return null;

    return (
      <Link
        href={{
          pathname: `/dashboard/assignments/${assignmentCode}`,
        }}
        style={{ textDecoration: 'none' }}
      >
        <PrimaryButton style={{ padding: '6px 12px', fontSize: '12px' }}>
          {t("assignments.open") || "Open"}
        </PrimaryButton>
      </Link>
    );
  };


  // Column definitions
  const columnDefs = useMemo(() => [
    {
      field: "title",
      headerName: t("assignment.title") || "Title",
      cellRenderer: TitleRenderer,
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 2,
      wrapText: true,
      autoHeight: true,
      cellStyle: { 
        whiteSpace: 'normal',
        lineHeight: '1.5',
        display: 'flex',
        alignItems: 'center',
        wordBreak: 'break-word',
      },
    },
    {
      field: "createdAt",
      headerName: t("assignment.dateCreated") || "Date Created",
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
      flex: 1,
      valueGetter: (params) => params?.data?.status || 'Not Started',
    },
    {
      field: "open",
      headerName: t("assignment.actions") || "Actions",
      cellRenderer: OpenButtonRenderer,
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
  ], [t]);

  // Grid settings
  const pagination = true;
  const paginationPageSize = 20;
  const paginationPageSizeSelector = [10, 20, 50, 100];

  const autoSizeStrategy = {
    type: "fitGridWidth",
    defaultMinWidth: 100,
  };

  if (!assignments || assignments.length === 0) {
    return null;
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
