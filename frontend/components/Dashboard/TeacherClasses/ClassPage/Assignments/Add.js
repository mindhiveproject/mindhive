import Link from "next/link";
import moment from "moment";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

// Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-grid.css";
// Optional Theme applied to the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
// React Data Grid Component
import { AgGridReact } from "ag-grid-react";

import {
  GET_MY_CLASS_ASSIGNMENTS,
  GET_TEMPLATE_ASSIGNMENTS,
} from "../../../../Queries/Assignment";

// Styled button matching Figma design (Primary Action - Teal)
const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  font-family: Lato;
  font-size: 18px;
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

const SectionContainer = styled.div`
  margin-bottom: 48px;
`;

const SectionTitle = styled.h2`
  font-family: Lato;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
`;

const SectionDescription = styled.p`
  font-family: Lato;
  font-size: 16px;
  color: #666666;
  margin-bottom: 16px;
`;

const ButtonContainer = styled.div`
  margin-bottom: 32px;
`;

const TopSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 32px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  font-family: Lato;
  font-size: 18px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
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

export default function AddAssignment({ myclass, user, query }) {
  const { t } = useTranslation("classes");

  const { data, loading, error } = useQuery(GET_MY_CLASS_ASSIGNMENTS, {
    variables: { userId: user?.id, classId: myclass?.id },
  });
  const assignments = data?.assignments || [];

  const { data: templateData, loading: templatesLoading } = useQuery(GET_TEMPLATE_ASSIGNMENTS);
  const templates = templateData?.assignments || [];

  // Cell renderer for title (strips HTML)
  const TitleRenderer = (params) => {
    const title = params?.data?.title?.replace(/<[^>]*>/g, '') || '';
    return <span>{title}</span>;
  };

  // Cell renderer for "Copy and Edit" button
  const UseButtonRenderer = (params, isTemplate = false) => {
    return (
      <Link
        href={{
          pathname: `/dashboard/myclasses/${myclass?.code}`,
          query: {
            page: "assignments",
            action: "copy",
            assignment: params?.data?.code,
          },
        }}
        style={{ textDecoration: 'none' }}
      >
        <PrimaryButton style={{ padding: '8px 16px', fontSize: '14px' }}>
          Link a Copy
        </PrimaryButton>
      </Link>
    );
  };

  // Column definitions for My Assignments
  const myAssignmentsColumnDefs = [
    {
      field: "title",
      headerName: t("assignment.title"),
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
      field: "action",
      headerName: "Action",
      cellRenderer: (params) => UseButtonRenderer(params, false),
      suppressFilter: true,
      sortable: false,
      width: 150,
      cellStyle: { 
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
      },
    },
    {
      field: "author",
      headerName: t("assignment.creator"),
      valueGetter: (params) => params?.data?.author?.username || '',
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      wrapText: true,
      autoHeight: true,
    },
    {
      field: "createdAt",
      headerName: t("assignment.dateCreated"),
      valueGetter: (params) => params?.data?.createdAt || null,
      valueFormatter: (params) =>
        params.value ? moment(params.value).format("MMMM D, YYYY") : '',
      filter: "agDateColumnFilter",
      sortable: true,
      flex: 1,
      wrapText: true,
      autoHeight: true,
    },
    {
      field: "updatedAt",
      headerName: t("assignment.dateUpdated"),
      valueGetter: (params) => params?.data?.updatedAt || null,
      valueFormatter: (params) =>
        params.value ? moment(params.value).format("MMMM D, YYYY") : '',
      filter: "agDateColumnFilter",
      sortable: true,
      flex: 1,
      wrapText: true,
      autoHeight: true,
    },
  ];

  // Column definitions for Templates (same structure)
  const templatesColumnDefs = [
    {
      field: "title",
      headerName: t("assignment.title"),
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
      field: "action",
      headerName: "Action",
      cellRenderer: (params) => UseButtonRenderer(params, true),
      suppressFilter: true,
      sortable: false,
      width: 150,
      cellStyle: { 
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
      },
    },
    {
      field: "author",
      headerName: t("assignment.creator"),
      valueGetter: (params) => params?.data?.author?.username || '',
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      wrapText: true,
      autoHeight: true,
    },
    {
      field: "createdAt",
      headerName: t("assignment.dateCreated"),
      valueGetter: (params) => params?.data?.createdAt || null,
      valueFormatter: (params) =>
        params.value ? moment(params.value).format("MMMM D, YYYY") : '',
      filter: "agDateColumnFilter",
      sortable: true,
      flex: 1,
      wrapText: true,
      autoHeight: true,
    },
    {
      field: "updatedAt",
      headerName: t("assignment.dateUpdated"),
      valueGetter: (params) => params?.data?.updatedAt || null,
      valueFormatter: (params) =>
        params.value ? moment(params.value).format("MMMM D, YYYY") : '',
      filter: "agDateColumnFilter",
      sortable: true,
      flex: 1,
      wrapText: true,
      autoHeight: true,
    },
  ];

  // Grid settings
  const pagination = true;
  const paginationPageSize = 20;
  const paginationPageSizeSelector = [10, 20, 50, 100];

  const autoSizeStrategy = {
    type: "fitGridWidth",
    defaultMinWidth: 100,
  };

  if (loading || templatesLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="selector">
      <TopSection>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "assignments",
            },
          }}
          style={{ textDecoration: 'none' }}
        >
          <SecondaryButton>← {t("assignment.goBack")}</SecondaryButton>
        </Link>
      </TopSection>

      {/* Create from Scratch Section */}
      <SectionContainer>
        <SectionTitle>Create from scratch and link this class</SectionTitle>
        <SectionDescription>
          Start with a blank assignment and build it from the ground up. You'll have full control over the title, instructions, and placeholder content. This is ideal when you want to create something completely new and unique to your class.
        </SectionDescription>
        <ButtonWrapper>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "assignments",
                action: "create",
              },
            }}
            style={{ textDecoration: 'none' }}
          >
            <PrimaryButton>{t("assignment.createNew")} from scratch</PrimaryButton>
          </Link>
        </ButtonWrapper>
      </SectionContainer>

      {/* My Assignments Section */}
      <SectionContainer>
        <SectionTitle>{t("assignment.createFromExisting")}</SectionTitle>
        <SectionDescription>
          Select an assignment you've created to use as a starting point. These are your own assignments.
        </SectionDescription>
        {assignments.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>
            You don't have any existing assignments yet.
          </p>
        ) : (
          <div
            className="ag-theme-quartz"
            style={{ height: 400, width: "100%" }}
          >
            <AgGridReact
              rowData={assignments}
              columnDefs={myAssignmentsColumnDefs}
              pagination={pagination}
              paginationPageSize={paginationPageSize}
              paginationPageSizeSelector={paginationPageSizeSelector}
              autoSizeStrategy={autoSizeStrategy}
            />
          </div>
        )}
      </SectionContainer>

      {/* Templates Section */}
      <SectionContainer>
        <SectionTitle>{t("assignment.createFromTemplate")}</SectionTitle>
        <SectionDescription>
          Select from pre-made assignment templates created by administrators. These are shared templates available to all teachers.
        </SectionDescription>
        {templates.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>
            No templates are available at this time.
          </p>
        ) : (
          <div
            className="ag-theme-quartz"
            style={{ height: 400, width: "100%" }}
          >
            <AgGridReact
              rowData={templates}
              columnDefs={templatesColumnDefs}
              pagination={pagination}
              paginationPageSize={paginationPageSize}
              paginationPageSizeSelector={paginationPageSizeSelector}
              autoSizeStrategy={autoSizeStrategy}
            />
          </div>
        )}
      </SectionContainer>
    </div>
  );
}
