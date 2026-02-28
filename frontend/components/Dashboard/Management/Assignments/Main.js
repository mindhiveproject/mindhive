import { useQuery } from "@apollo/client";
import moment from "moment";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Popup } from "semantic-ui-react";

// Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-grid.css";
// Optional Theme applied to the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
// React Data Grid Component
import { AgGridReact } from "ag-grid-react";

import EditAssignment from "./Edit";
import AddAssignment from "./Add";
import Button from "../../../DesignSystem/Button";
import { GET_TEMPLATE_ASSIGNMENTS, GET_ASSIGNMENTS_BY_TEMPLATE_SOURCE } from "../../../Queries/Assignment";
import DeleteAssignment from "./Delete";


const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 24px;

`;

// Styled edit button for grid (Outline style from Figma)
const EditButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-family: Lato;
  font-size: 16px;
  font-weight: 400;
  line-height: 16px;
  text-align: center;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: #ffffff;
  color: #336F8A;
  border: 1.5px solid #336F8A;
  
  &:hover {
    background: #f5f5f5;
    border-color: #b3b3b3;
    color: #666666;
  }
  
  &:active {
    background: #e0f2f1;
    border-color: #4db6ac;
    color: #4db6ac;
  }
`;

export default function TemplateAssignments({ query, user }) {
  const { data, loading, error } = useQuery(GET_TEMPLATE_ASSIGNMENTS);
  
  // Query all non-template assignments to find classes using each template
  const { data: assignmentsByTemplateData, loading: assignmentsLoading } = useQuery(
    GET_ASSIGNMENTS_BY_TEMPLATE_SOURCE
  );

  const templateAssignments = data?.assignments || [];
  const allAssignments = assignmentsByTemplateData?.assignments || [];

  // Filter to only assignments that have a templateSource (copied assignments)
  const assignmentsWithTemplate = allAssignments.filter(
    (assignment) => assignment?.templateSource?.id
  );

  // Build a map: templateId -> Set of unique classes
  const templateClassesMap = {};
  assignmentsWithTemplate.forEach((assignment) => {
    const templateId = assignment?.templateSource?.id;
    if (templateId) {
      if (!templateClassesMap[templateId]) {
        templateClassesMap[templateId] = new Map();
      }
      assignment?.classes?.forEach((cls) => {
        if (cls?.id) {
          templateClassesMap[templateId].set(cls.id, {
            id: cls.id,
            title: cls.title || 'Unknown',
          });
        }
      });
    }
  });

  // Enrich template assignments with unique classes from their copies
  const assignments = templateAssignments.map((template) => {
    const uniqueClasses = templateClassesMap[template.id]
      ? Array.from(templateClassesMap[template.id].values())
      : [];
    return {
      ...template,
      classesFromCopies: uniqueClasses,
    };
  });

  const { id, action } = query;
  if (action) {
    if (action === "add") {
      return <AddAssignment />;
    }
    if (action === "edit" && id) {
      return <EditAssignment user={user} id={id} />;
    }
  }

  // Cell renderer for title (clickable link)
  const TitleRenderer = (params) => {
    const title = params?.data?.title?.replace(/<[^>]*>/g, '') || '';
    return (
      <Link
        href={{
          pathname: "/dashboard/management/assignments",
          query: {
            id: params?.data?.id,
            action: "edit",
          },
        }}
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        {title}
      </Link>
    );
  };

  // Cell renderer for classes (shows count with tooltip listing all classes)
  const ClassesRenderer = (params) => {
    const classesFromCopies = params?.data?.classesFromCopies || [];
    if (classesFromCopies.length === 0) {
      return <span style={{ color: '#999' }}>Not used in any classes</span>;
    }
    
    const classTitles = classesFromCopies.map((cls) => cls?.title || 'Unknown');
    const tooltipContent = (
      <div style={{ padding: '8px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          Classes using this template ({classesFromCopies.length}):
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {classTitles.map((title, index) => (
            <div key={index}>{title}</div>
          ))}
        </div>
      </div>
    );

    return (
      <Popup
        content={tooltipContent}
        trigger={
          <span style={{ cursor: 'pointer', color: '#336F8A', textDecoration: 'underline' }}>
            {classesFromCopies.length} {classesFromCopies.length === 1 ? 'class' : 'classes'}
          </span>
        }
        position="top center"
        size="small"
      />
    );
  };

  // Cell renderer for edit button
  const EditButtonRenderer = (params) => {
    return (
      <Link
        href={{
          pathname: "/dashboard/management/assignments",
          query: {
            id: params?.data?.id,
            action: "edit",
          },
        }}
        style={{ textDecoration: 'none' }}
      >
        <EditButton>
          <Icon name="pencil" />
          Edit
        </EditButton>
      </Link>
    );
  };

  // Cell renderer for delete action
  const DeleteRenderer = (params) => {
    return (
      <DeleteAssignment id={params?.data?.id}>
        <span style={{ cursor: 'pointer', color: '#d32f2f' }}>Delete</span>
      </DeleteAssignment>
    );
  };

  // Column definitions
  const columnDefs = [
    {
      field: "title",
      headerName: "Title",
      cellRenderer: TitleRenderer,
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 2,
    },
    {
      field: "author",
      headerName: "Creator",
      valueGetter: (params) => params?.data?.author?.username || '',
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
    },
    {
      field: "classes",
      headerName: "Associated Classes",
      cellRenderer: ClassesRenderer,
      filter: "agTextColumnFilter",
      sortable: false,
      flex: 1.5,
      valueGetter: (params) => {
        const classesFromCopies = params?.data?.classesFromCopies || [];
        return classesFromCopies.map(c => c?.title || '').join(', ') || 'Not used';
      },
    },
    {
      field: "createdAt",
      headerName: "Date created",
      valueGetter: (params) => params?.data?.createdAt || null,
      valueFormatter: (params) =>
        params.value ? moment(params.value).format("MMMM D, YYYY") : '',
      filter: "agDateColumnFilter",
      sortable: true,
      flex: 1,
    },
    {
      field: "updatedAt",
      headerName: "Date updated",
      valueGetter: (params) => params?.data?.updatedAt || null,
      valueFormatter: (params) =>
        params.value ? moment(params.value).format("MMMM D, YYYY") : '',
      filter: "agDateColumnFilter",
      sortable: true,
      flex: 1,
    },
    {
      field: "edit",
      headerName: "Edit",
      cellRenderer: EditButtonRenderer,
      suppressFilter: true,
      sortable: false,
      width: 120,
      pinned: "right",
    },
    {
      field: "delete",
      headerName: "Delete",
      cellRenderer: DeleteRenderer,
      suppressFilter: true,
      sortable: false,
      width: 100,
      pinned: "right",
    },
  ];

  // Grid settings
  const pagination = true;
  const paginationPageSize = 50;
  const paginationPageSizeSelector = [20, 50, 100, 200];

  const autoSizeStrategy = {
    type: "fitGridWidth",
    defaultMinWidth: 100,
  };

  if (loading || assignmentsLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <ButtonContainer>
        <Link
          href={{
            pathname: "/dashboard/management/assignments",
            query: {
              action: "add",
            },
          }}
          style={{ textDecoration: 'none' }}
        >
          <Button variant="filled" style={{ padding: '14px 24px', fontSize: '18px', lineHeight: '18px' }}>Add assignment</Button>
        </Link>
      </ButtonContainer>

      <div
        className="ag-theme-quartz"
        style={{ height: 600, width: "100%" }}
      >
        <AgGridReact
          rowData={assignments}
          columnDefs={columnDefs}
          pagination={pagination}
          paginationPageSize={paginationPageSize}
          paginationPageSizeSelector={paginationPageSizeSelector}
          autoSizeStrategy={autoSizeStrategy}
        />
      </div>
    </div>
  );
}
