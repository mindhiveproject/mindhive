import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import moment from "moment";
import { useMutation } from "@apollo/client";
import { Button, Popup, Menu, Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

// Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-grid.css";
// Optional Theme applied to the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
// React Data Grid Component
import { AgGridReact } from "ag-grid-react";

import { EDIT_ASSIGNMENT, DELETE_ASSIGNMENT } from "../../../../Mutations/Assignment";
import { GET_MY_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";

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

const SecondaryButton = styled.button`
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

const EditButton = styled.button`
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

// Status chip styled components based on Figma design
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
  border: 1.5px solid;
  background: transparent;
  
  ${props => props.isPublished ? `
    border-color: #B2DFDB;
    color: #00695C;
  ` : `
    border-color: #E0E0E0;
    color: #616161;
  `}
`;

// Chip styles reused from LinkedItems.js (Published/Unpublished only)
const styledChipPublished = {
  display: "inline-flex",
  height: "24px",
  padding: "14px",
  justifyContent: "center",
  alignItems: "center",
  flexShrink: "0",
  borderRadius: "8px",
  background: "#DEF8FB",
  border: "1px solid #625B71",
  maxWidth: '100%',
  wordBreak: 'break-word',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: 'Lato',
  fontSize: '14px',
  fontWeight: 400,
  color: '#434343',
};

const styledChipUnpublished = {
  display: "inline-flex",
  height: "24px",
  padding: "14px",
  justifyContent: "center",
  alignItems: "center",
  flexShrink: "0",
  borderRadius: "8px",
  background: "#F3F3F3",
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  maxWidth: '100%',
  wordBreak: 'break-word',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: 'Lato',
  fontSize: '14px',
  fontWeight: 400,
  color: '#434343',
};

export default function AssignmentTab({ assignments, myclass, user }) {
  const { t } = useTranslation("classes");
  const router = useRouter();

  // Filter state: Published/Unpublished chips only
  const [selectedPublishedFilter, setSelectedPublishedFilter] = useState(null); // null = all, true = published, false = unpublished

  const [editAssignment] = useMutation(EDIT_ASSIGNMENT, {
    refetchQueries: [
      {
        query: GET_MY_CLASS_ASSIGNMENTS,
        variables: { userId: user?.id, classId: myclass?.id },
      },
    ],
  });

  const [deleteAssignment] = useMutation(DELETE_ASSIGNMENT, {
    refetchQueries: [
      {
        query: GET_MY_CLASS_ASSIGNMENTS,
        variables: { userId: user?.id, classId: myclass?.id },
      },
    ],
  });

  // Strip HTML from title
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  // Filter assignments by published state only
  const filteredAssignments =
    selectedPublishedFilter === null
      ? assignments
      : (assignments || []).filter((a) => a?.public === selectedPublishedFilter);

  const handlePublishedFilterToggle = (value) => {
    setSelectedPublishedFilter((prev) => (prev === value ? null : value));
  };

  // Count completed homework
  const getCompletedHomeworkCount = (homework) => {
    if (!homework || !Array.isArray(homework)) return 0;
    return homework.filter(hw => hw?.settings?.status === "Completed").length;
  };

  // Title renderer with HTML stripped
  const TitleRenderer = (params) => {
    const title = stripHtml(params?.data?.title || '');
    return <span>{title}</span>;
  };

  // Status chip renderer
  const StatusRenderer = (params) => {
    const isPublished = params?.data?.public || false;
    return (
      <StatusChip isPublished={isPublished}>
        {isPublished ? t("assignment.published") : t("assignment.unpublished")}
      </StatusChip>
    );
  };

  // Completed homework renderer
  const CompletedHomeworkRenderer = (params) => {
    const completedCount = getCompletedHomeworkCount(params?.data?.homework);
    const totalCount = params?.data?.homework?.length || 0;
    return (
      <span>
        {completedCount} / {totalCount}
      </span>
    );
  };

  // Actions dropdown renderer
  const ActionsRenderer = (params) => {
    const assignment = params?.data;
    const isPublished = assignment?.public || false;
    const router = useRouter();

    const handleEdit = () => {
      router.push({
        pathname: `/dashboard/myclasses/${myclass?.code}`,
        query: {
          page: "assignments",
          action: "edit",
          assignment: assignment?.code,
        },
      });
    };

    const handlePreview = () => {
      router.push({
        pathname: `/dashboard/myclasses/${myclass?.code}`,
        query: {
          page: "assignments",
          action: "view",
          assignment: assignment?.code,
        },
      });
    };

    const handlePublish = () => {
      const confirmMessage = isPublished 
        ? t("assignment.revokeConfirm")
        : t("assignment.submitConfirm");
      
      if (confirm(confirmMessage)) {
        editAssignment({
          variables: { 
            id: assignment?.id,
            input: { public: !isPublished } 
          },
        }).catch((err) => {
          alert(err.message);
        });
      }
    };

    const handleDelete = () => {
      if (confirm(t("assignment.deleteConfirm"))) {
        deleteAssignment({
          variables: { id: assignment?.id },
        }).catch((err) => {
          alert(err.message);
        });
      }
    };

    const handleHomeworkOverview = () => {
      router.push({
        pathname: `/dashboard/myclasses/${myclass?.code}`,
        query: {
          page: "assignments",
          action: "homeworkOverview",
          assignment: assignment?.code,
        },
      });
    };

    const menu = (
      <Menu vertical style={{ border: 'none', boxShadow: 'none' }}>
        <Menu.Item onClick={handleEdit} style={{ borderTop: 'none', borderBottom: 'none' }}>
          {t("assignment.edit")}
        </Menu.Item>
        <Menu.Item onClick={handlePreview} style={{ borderTop: 'none', borderBottom: 'none' }}>
          {t("assignment.preview")}
        </Menu.Item>
        <Menu.Item onClick={handleHomeworkOverview} style={{ borderTop: 'none', borderBottom: 'none' }}>
          {t("assignment.reviewSubmissions") || "Review Submissions"}
        </Menu.Item>
        <Menu.Item onClick={handlePublish} style={{ borderTop: 'none', borderBottom: 'none' }}>
          {isPublished ? t("assignment.unpublish") : t("assignment.publishToStudents")}
        </Menu.Item>
        <Menu.Item onClick={handleDelete} style={{ color: '#d32f2f', borderTop: 'none', borderBottom: 'none' }}>
          <Icon name="trash" style={{ color: '#d32f2f' }} />
          {t("assignment.delete")}
        </Menu.Item>
      </Menu>
    );

    return (
      <Popup
        trigger={
          <Button
            icon="ellipsis vertical"
            style={{ 
              borderRadius: '100px',
              border: '1.5px solid #336F8A',
              background: '#ffffff',
              color: '#336F8A',
              padding: '8px 16px',
            }}
          >
            See actions
          </Button>
        }
        content={menu}
        on="click"
        position="bottom right"
        style={{ zIndex: 10000 }}
      />
    );
  };

  // Column definitions
  const columnDefs = [
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
      field: "status",
      headerName: t("assignment.status"),
      cellRenderer: StatusRenderer,
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      valueGetter: (params) => params?.data?.public ? "Published" : "Unpublished",
    },
    {
      field: "completedHomework",
      headerName: t("assignment.completedHomework"),
      cellRenderer: CompletedHomeworkRenderer,
      filter: "agNumberColumnFilter",
      sortable: true,
      flex: 1,
      valueGetter: (params) => getCompletedHomeworkCount(params?.data?.homework),
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
    },
    {
      field: "actions",
      headerName: t("assignment.actions"),
      cellRenderer: ActionsRenderer,
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

  if (!assignments || assignments.length === 0) {
    return null;
  }

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <button
          type="button"
          onClick={() => handlePublishedFilterToggle(true)}
          style={{
            ...styledChipPublished,
            backgroundColor: selectedPublishedFilter === true ? "#DEF8FB" : "#ffffff",
            borderColor: selectedPublishedFilter === true ? "#625B71" : "#A1A1A1",
          }}
        >
          {t("assignment.published") || "Published"}
        </button>
        <button
          type="button"
          onClick={() => handlePublishedFilterToggle(false)}
          style={{
            ...styledChipUnpublished,
            backgroundColor: selectedPublishedFilter === false ? "#F3F3F3" : "#ffffff",
            borderColor: selectedPublishedFilter === false ? "#625B71" : "#A1A1A1",
          }}
        >
          {t("assignment.unpublished") || "Unpublished"}
        </button>
      </div>

      <div style={{ width: "100%", height: "600px" }}>
        <div className="ag-theme-quartz" style={{ height: "100%", width: "100%" }}>
          <AgGridReact
            rowData={filteredAssignments}
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
    </div>
  );
}
