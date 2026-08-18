import Link from "next/link";
import { useQuery } from "@apollo/client";
import { useState, useMemo } from "react";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import { GET_STUDENTS_DATA } from "../../../../Queries/Classes";
import Button from "../../../../DesignSystem/Button";

// Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-grid.css";
// Optional Theme applied to the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
// React Data Grid Component
import { AgGridReact } from "ag-grid-react";

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
  font-weight: 400;
  color: #666666;
  margin-top: 8px;
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
`;

// Status chip styled components (colors match Builder Card homework status scheme)
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
  background: #FFFFFF;
  border: 1px solid;
  
  ${props => {
    const status = props.status?.toLowerCase() || '';
    const backgroundColor = status === 'completed'
      ? '#DEF8FB'
      : status === 'started'
      ? '#FDFEF0'
      : status === 'needs feedback'
      ? '#E4DFF6'
      : status === 'feedback given'
      ? '#F6F9F8'
      : '#FFFFFF';
    const color = status === 'completed'
      ? '#337C84'
      : status === 'started'
      ? '#5D5763'
      : status === 'needs feedback'
      ? '#3F288F'
      : status === 'feedback given'
      ? '#0D3944'
      : '#666';
    return `
      background-color: ${backgroundColor};
      border-color: ${color};
      color: ${color};
    `;
  }}
`;

export default function HomeworkCompletion({
  myclass,
  user,
  query,
  assignments,
}) {
  const { t } = useTranslation("classes");
  const assignmentsPublic = assignments.filter((a) => a?.public);

  const { data, loading, error } = useQuery(GET_STUDENTS_DATA, {
    variables: { classId: myclass?.id },
  });

  // Strip HTML from title
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const students = data?.profiles || [];
  const studentsProcessed = students.map((student) => {
    const studentAssignments = assignmentsPublic.map((a) => {
      const homeworks = student?.authorOfHomework
        ?.filter((homework) => homework?.assignment?.id === a?.id) || [];
      const [homework] = homeworks;
      const status = homework?.settings?.status || 'Not started';
      const homeworkCode = homework?.code;
      
      // Use assignment ID as key instead of title to avoid HTML issues
      return {
        [`assignment_${a.id}`]: status,
        [`homework_${a.id}`]: homeworkCode, // Store homework code for the button
      };
    });

    const studentAssignmentsObject = studentAssignments.reduce((acc, item) => {
      return { ...acc, ...item };
    }, {});

    return {
      id: student?.id,
      username: student?.username,
      ...studentAssignmentsObject,
    };
  });

  // Status renderer for assignment columns - clickable to view homework
  const StatusRenderer = (params) => {
    const status = params?.value || 'Not started';
    const assignmentId = params?.colDef?.field?.replace('assignment_', '');
    const homeworkCode = params?.data?.[`homework_${assignmentId}`];
    const assignment = assignmentsPublic.find(a => a.id === assignmentId);
    
    // If there's no homework (status is "Not started"), just show the chip
    if (!homeworkCode || !assignment || status === 'Not started') {
      return <StatusChip status={status}>{status}</StatusChip>;
    }

    // If there's homework, make it clickable
    return (
      <Link
        href={{
          pathname: `/dashboard/myclasses/${myclass?.code}`,
          query: {
            page: "assignments",
            action: "view",
            assignment: assignment?.code,
            homework: homeworkCode,
          },
        }}
        style={{ textDecoration: 'none' }}
      >
        <StatusChip 
          status={status}
          style={{ cursor: 'pointer' }}
        >
          {status}
        </StatusChip>
      </Link>
    );
  };

  // Column definitions with proper configuration
  const columnDefs = useMemo(() => {
    const baseColumns = [
      {
        field: "username",
        headerName: t("students.username"),
        filter: "agTextColumnFilter",
        sortable: true,
        flex: 1,
        pinned: "left",
      },
    ];

    const assignmentColumns = assignmentsPublic.map((a) => ({
      field: `assignment_${a.id}`,
      headerName: stripHtml(a?.title || 'Untitled'),
      cellRenderer: StatusRenderer,
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1.5,
      valueGetter: (params) => params?.data?.[`assignment_${a.id}`] || 'Not started',
    }));

    return [...baseColumns, ...assignmentColumns];
  }, [assignmentsPublic, t, myclass]);

  if (loading) return <div>{t("assignment.loading")}</div>;
  if (error) return <div>{t("assignment.error")}: {error.message}</div>;

  // Grid settings
  const pagination = true;
  const paginationPageSize = 20;
  const paginationPageSizeSelector = [10, 20, 50, 100];

  const autoSizeStrategy = {
    type: "fitGridWidth",
    defaultMinWidth: 100,
  };

  return (
    <Container>
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
          <Button variant="outline">{t("assignment.goBack", {}, { default: "Go back" })}</Button>
        </Link>
        <HeaderTitle>{t("assignment.classAssignmentOverview")}</HeaderTitle>
        <Subtitle>{t("assignment.homeworkOverviewSubtitle")}</Subtitle>
      </TopSection>

      <div style={{ width: '100%', height: '600px' }}>
        <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            rowData={studentsProcessed}
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
      </div>
    </Container>
  );
}
