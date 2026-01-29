import Link from "next/link";
import moment from "moment";
import { useMemo, useState, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import { useQuery } from "@apollo/client";
import { GET_ASSIGNMENT } from "../../../../Queries/Assignment";
import { GET_STUDENTS_DATA } from "../../../../Queries/Classes";
import ReviewHomework from "./Homework/Review";

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

// Styled secondary button (Outline style from Figma)
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

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
`;

const TopSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-family: Lato;
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
`;

const Subtitle = styled.p`
  margin: 0;
  font-family: Lato;
  font-size: 16px;
  color: #666666;
`;

const OptionsLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 8px 16px;
  border-radius: 100px;
  margin-left: 8px;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #336F8A;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: #FDF2D0;
    color: #171717;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

// Status chip matching the design from HomeworkCompletion
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
    if (status === 'completed') {
      return `
        background: #E0F2F1; /* Light teal */
        color: #00695C;      /* Medium green */
      `;
    } else if (status === 'started') {
      return `
        background: #E3F2FD; /* Very light pastel blue */
        color: #1976D2;      /* Medium blue */
      `;
    } else if (status === 'needs feedback') {
      return `
        background: #FCE4EC; /* Very light pastel pink/light red */
        color: #C2185B;      /* Medium red */
      `;
    } else if (status === 'feedback given') {
      return `
        background: #F3E5F5; /* Very light pastel lavender/light purple */
        color: #7B1FA2;      /* Medium purple */
      `;
    } else {
      return `
        background: #F5F5F5; /* Light gray */
        color: #616161;      /* Gray text */
      `;
    }
  }}
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

const ColumnToggleContainer = styled.div`
  display: ${props => props.show ? 'flex' : 'none'};
  gap: 24px;
  align-items: center;
  margin-top: 16px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: Lato;
  font-size: 14px;
  color: #1a1a1a;
  cursor: pointer;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #336F8A;
  }
  
  &:hover {
    color: #336F8A;
  }
`;

export default function HomeworkOverview({ code, myclass, user, query }) {
  const { t } = useTranslation("classes");
  const { homework } = query;
  
  // State for optional column visibility (off by default)
  const [showHomeworkTitle, setShowHomeworkTitle] = useState(false);
  const [showUpdatedAt, setShowUpdatedAt] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Fetch assignment data - skip if viewing a specific homework
  const { data: assignmentData, loading: assignmentLoading, error: assignmentError } = useQuery(GET_ASSIGNMENT, {
    variables: { code },
    skip: !!homework,
  });

  // Fetch students data - skip if viewing a specific homework
  const { data: studentsData, loading: studentsLoading, error: studentsError } = useQuery(GET_STUDENTS_DATA, {
    variables: { classId: myclass?.id },
    skip: !!homework,
  });

  // Get data with safe defaults
  const assignment = assignmentData?.assignment || {};
  const students = studentsData?.profiles || [];
  const allHomework = assignment?.homework || [];

  // Strip HTML from title - helper function
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  // Process data for grid - combine students with their homework
  const rowData = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    
    return students.map((student) => {
      // Find homework for this student and assignment
      const studentHomework = allHomework.find(
        (hw) => hw?.author?.id === student?.id
      );

      return {
        id: student?.id,
        username: student?.username || 'Unknown',
        homeworkCode: studentHomework?.code || null,
        homeworkTitle: studentHomework?.title || null,
        status: studentHomework?.settings?.status || 'Not started',
        createdAt: studentHomework?.createdAt || null,
        updatedAt: studentHomework?.updatedAt || null,
        hasHomework: !!studentHomework,
      };
    });
  }, [students, allHomework]);

  // Status renderer
  const StatusRenderer = useCallback((params) => {
    const status = params?.value || 'Not started';
    return <StatusChip status={status}>{status}</StatusChip>;
  }, []);

  // View button renderer
  const ViewButtonRenderer = useCallback((params) => {
    const homeworkCode = params?.data?.homeworkCode;
    if (!homeworkCode) {
      return (
        <span style={{ color: '#999', fontSize: '12px' }}>
          {t("assignment.noHomework") || "No homework"}
        </span>
      );
    }

    return (
      <Link
        href={{
          pathname: `/dashboard/myclasses/${myclass?.code}`,
          query: {
            page: "assignments",
            action: "homeworkOverview",
            assignment: code,
            homework: homeworkCode,
          },
        }}
        style={{ textDecoration: 'none' }}
      >
        <PrimaryButton style={{ padding: '6px 12px', fontSize: '12px' }}>
          {t("assignment.open") || "Open"}
        </PrimaryButton>
      </Link>
    );
  }, [code, myclass, t]);

  // Column definitions
  const columnDefs = useMemo(() => {
    const columns = [
      {
        field: "username",
        headerName: t("students.username") || "Username",
        filter: "agTextColumnFilter",
        sortable: true,
        flex: 1,
        pinned: "left",
      },
    ];
    
    // Conditionally add homeworkTitle column
    if (showHomeworkTitle) {
      columns.push({
        field: "homeworkTitle",
        headerName: t("homework.homeworkTitle") || "Homework Title",
        filter: "agTextColumnFilter",
        sortable: true,
        flex: 2,
        valueGetter: (params) => params?.data?.homeworkTitle || '-',
      });
    }
    
    columns.push({
      field: "status",
      headerName: t("assignment.status") || "Status",
      cellRenderer: StatusRenderer,
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1.5,
    });
    
    // Conditionally add updatedAt column
    if (showUpdatedAt) {
      columns.push({
        field: "updatedAt",
        headerName: t("assignment.dateUpdated") || "Last Updated",
        valueFormatter: (params) =>
          params.value ? moment(params.value).format("MMMM D, h:mm A") : '-',
        filter: "agDateColumnFilter",
        sortable: true,
        flex: 1,
      });
    }
    
    columns.push({
      field: "view",
      headerName: t("assignment.actions") || "Actions",
      cellRenderer: ViewButtonRenderer,
      suppressFilter: true,
      sortable: false,
      width: 150,
      pinned: "right",
      cellStyle: { 
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    });
    
    return columns;
  }, [code, myclass, t, showHomeworkTitle, showUpdatedAt, StatusRenderer, ViewButtonRenderer]);

  // Grid settings
  const pagination = true;
  const paginationPageSize = 20;
  const paginationPageSizeSelector = [10, 20, 50, 100];

  const autoSizeStrategy = {
    type: "fitGridWidth",
    defaultMinWidth: 100,
  };

  // If viewing a specific homework, show ReviewHomework (after all hooks)
  if (homework) {
    return (
      <Container>
        <ReviewHomework
          code={code}
          myclass={myclass}
          user={user}
          query={query}
          homeworkCode={homework}
        />
      </Container>
    );
  }

  if (assignmentLoading || studentsLoading) {
    return <Container><div>{t("common.loading") || "Loading..."}</div></Container>;
  }

  if (assignmentError || studentsError) {
    return (
      <Container>
        <div>Error: {assignmentError?.message || studentsError?.message}</div>
      </Container>
    );
  }

  const assignmentTitle = stripHtml(assignment?.title || '');

  return (
    <Container>
      <TopSection>
        <ButtonContainer>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "assignments",
              },
            }}
            style={{ textDecoration: 'none' }}
          >
            <SecondaryButton>← {t("assignment.goBack") || "Go back"}</SecondaryButton>
          </Link>
        </ButtonContainer>
        <HeaderTitle>{assignmentTitle}</HeaderTitle>
        <Subtitle>
          {t("assignment.homeworkOverview") || "View and manage student homework submissions"}
          <OptionsLink
            // href="#column-options"
            onClick={(e) => {
              e.preventDefault();
              setShowOptions(!showOptions);
              if (!showOptions) {
                // Scroll to options section after showing it
                setTimeout(() => {
                  document.getElementById('column-options')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
          >
            (Options)
          </OptionsLink>
        </Subtitle>
      </TopSection>

      <ColumnToggleContainer id="column-options" show={showOptions}>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={showHomeworkTitle}
            onChange={(e) => setShowHomeworkTitle(e.target.checked)}
          />
          <span>{t("homework.homeworkTitle") || "Homework Title"}</span>
        </CheckboxLabel>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={showUpdatedAt}
            onChange={(e) => setShowUpdatedAt(e.target.checked)}
          />
          <span>{t("assignment.dateUpdated") || "Last Updated"}</span>
        </CheckboxLabel>
      </ColumnToggleContainer>

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
              sortable: true,
              filter: true,
            }}
          />
        </div>
      </GridContainer>
    </Container>
  );
}
