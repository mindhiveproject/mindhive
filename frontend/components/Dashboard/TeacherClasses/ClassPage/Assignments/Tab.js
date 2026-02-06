import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import moment from "moment";
import { useMutation } from "@apollo/client";
import { Button, Modal, Popup, Menu, Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

// Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-grid.css";
// Optional Theme applied to the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
// React Data Grid Component
import { AgGridReact } from "ag-grid-react";

import { EDIT_ASSIGNMENT, DELETE_ASSIGNMENT } from "../../../../Mutations/Assignment";
import { GET_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";
import ConnectAssignmentToCardModal from "./ConnectAssignmentToCardModal";

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
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: #ffffff;
  color: #434343;
  border: 1.5px solid #625B71;
  
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

// Toggle button matching Design System (Figma node 1049-3662) with optional active/pressed state
const LinkedCardsToggleButton = styled(SecondaryButton)`
  ${(props) =>
    props.$active &&
    `
    background: #DEF8FB;
    border-color: #625B71;
    color: #434343;
    &:hover {
      background: #DEF8FB;
      border-color: #625B71;
      color: #434343;
    }
    &:active {
      background: #DEF8FB;
      border-color: #625B71;
      color: #434343;
    }
  `}
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
  border-radius: 8px;
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
  border: 1.5px solid;
  background: transparent;
  
  ${props => props.isPublished ? `
    background: #def8fb;
    border-color: #625b71;
    color: #434343;
  ` : `
    background: #f3f3f3;
    border-color: #616161;
    color: #616161;
  `}
`;

// Chip for "Linked to card" column (Section > Card or "Click to connect to card")
const LinkedCardChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 8px;
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  border: 1px solid #625B71;
  background: ${(props) => (props.$placeholder ? "#D8D3E7" : "#F5F5F5")};
  color: #434343;
  margin: 2px 4px 2px 0;
`;

// Chip styles reused from LinkedItems.js (Published/Unpublished only)
// Fixed height; padding and width adapt to presence of cross icon
const styledChipPublished = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  height: "32px",
  boxSizing: "border-box",
  justifyContent: "center",
  flexShrink: "0",
  borderRadius: "8px",
  background: "#DEF8FB",
  border: "1px solid #625B71",
  maxWidth: '100%',
  wordBreak: 'break-word',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, border-color 0.2s ease',
  fontFamily: 'Lato',
  fontSize: '14px',
  fontWeight: 400,
  color: '#434343',
};

const styledChipUnpublished = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  height: "32px",
  boxSizing: "border-box",
  justifyContent: "center",
  flexShrink: "0",
  borderRadius: "8px",
  background: "#F3F3F3",
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  maxWidth: '100%',
  wordBreak: 'break-word',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, border-color 0.2s ease',
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
  const [showLinkedToCardColumn, setShowLinkedToCardColumn] = useState(false); // default: hide "Linked to card" column
  const [assignmentForConnectModal, setAssignmentForConnectModal] = useState(null);
  const [assignmentForPublishModal, setAssignmentForPublishModal] = useState(null);
  const [updatingStatusAssignmentId, setUpdatingStatusAssignmentId] = useState(null);

  const [editAssignment] = useMutation(EDIT_ASSIGNMENT, {
    refetchQueries: [
      {
        query: GET_CLASS_ASSIGNMENTS,
        variables: { classId: myclass?.id },
      },
    ],
  });

  const [deleteAssignment] = useMutation(DELETE_ASSIGNMENT, {
    refetchQueries: [
      {
        query: GET_CLASS_ASSIGNMENTS,
        variables: { classId: myclass?.id },
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

  const handleOpenPublishConfirm = (assignment) => {
    if (!assignment?.id) return;
    setAssignmentForPublishModal(assignment);
  };

  const handleConfirmPublishToggle = () => {
    if (!assignmentForPublishModal?.id) return;
    setUpdatingStatusAssignmentId(assignmentForPublishModal.id);
    setAssignmentForPublishModal(null);
    editAssignment({
      variables: {
        id: assignmentForPublishModal.id,
        input: { public: !assignmentForPublishModal.public },
      },
    }).finally(() => setUpdatingStatusAssignmentId(null));
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

  // Status chip renderer (clickable to toggle publish state)
  const StatusRenderer = (params) => {
    const assignment = params?.data;
    const isPublished = assignment?.public || false;
    const isUpdating = params?.context?.updatingStatusAssignmentId === assignment?.id;
    const onToggle = params?.context?.onTogglePublishStatus;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.(assignment);
        }}
        aria-label={isPublished ? t("assignment.unpublish") : t("assignment.publishToStudents")}
        disabled={isUpdating}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: isUpdating ? "wait" : "pointer",
          opacity: isUpdating ? 0.7 : 1,
        }}
        title={isUpdating ? t("common.loading", "Updating…") : (isPublished ? t("assignment.unpublish") : t("assignment.publishToStudents"))}
      >
        <StatusChip isPublished={isPublished}>
          {isUpdating ? t("common.loading", "Updating…") : (isPublished ? t("assignment.published") : t("assignment.unpublished"))}
        </StatusChip>
      </button>
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

  // Linked to card renderer: [Section] > [Card] (section and card each in a chip)
  const LinkedToCardRenderer = (params) => {
    const assignment = params?.data;
    const templateBoardId = myclass?.templateProposal?.id;
    const templateCards = (assignment?.proposalCards || []).filter(
      (c) => c?.section?.board?.id === templateBoardId
    );
    const handleClick = () => {
      if (!templateBoardId) {
        alert("No template board for this class.");
        return;
      }
      setAssignmentForConnectModal(assignment);
    };
    return (
      <button
        type="button"
        onClick={handleClick}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0,
        }}
      >
        {templateCards.length > 0 ? (
          templateCards.map((c, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                flexWrap: "wrap",
                marginRight: i < templateCards.length - 1 ? "8px" : 0,
              }}
            >
              <LinkedCardChip>{c?.section?.title || "Section"}</LinkedCardChip>
              <span style={{ margin: "0 4px", fontSize: "14px", color: "#616161" }}>&gt;</span>
              <LinkedCardChip>{c?.title || "Card"}</LinkedCardChip>
            </span>
          ))
        ) : (
          <LinkedCardChip $placeholder>Click to connect to card</LinkedCardChip>
        )}
      </button>
    );
  };

  // Actions dropdown renderer
  const ActionsRenderer = (params) => {
    const assignment = params?.data;
    const isPublished = assignment?.public || false;
    const isOwner = assignment?.author?.id === user?.id;
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
        {isOwner && (
          <Menu.Item onClick={handleEdit} style={{ borderTop: 'none', borderBottom: 'none' }}>
            {t("assignment.edit")}
          </Menu.Item>
        )}
        <Menu.Item onClick={handlePreview} style={{ borderTop: 'none', borderBottom: 'none' }}>
          {t("assignment.preview")}
        </Menu.Item>
        <Menu.Item onClick={handleHomeworkOverview} style={{ borderTop: 'none', borderBottom: 'none' }}>
          {t("assignment.reviewSubmissions") || "Review Submissions"}
        </Menu.Item>
        {isOwner && (
          <Menu.Item onClick={handlePublish} style={{ borderTop: 'none', borderBottom: 'none' }}>
            {isPublished ? t("assignment.unpublish") : t("assignment.publishToStudents")}
          </Menu.Item>
        )}
        {isOwner && (
          <Menu.Item onClick={handleDelete} style={{ color: '#d32f2f', borderTop: 'none', borderBottom: 'none' }}>
            <Icon name="trash" style={{ color: '#d32f2f' }} />
            {t("assignment.delete")}
          </Menu.Item>
        )}
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

  // Linked to card column definition (included in grid only when showLinkedToCardColumn is true)
  const linkedToCardColumnDef = {
    field: "linkedToCard",
    headerName: t("assignment.linkedToCard", "Linked to card"),
    cellRenderer: LinkedToCardRenderer,
    filter: "agTextColumnFilter",
    sortable: true,
    flex: 2,
    wrapText: true,
    autoHeight: true,
    cellStyle: {
      whiteSpace: "normal",
      lineHeight: "1.5",
      display: "flex",
      alignItems: "center",
      wordBreak: "break-word",
    },
    valueGetter: (params) => {
      const a = params?.data;
      const templateBoardId = params?.context?.templateBoardId;
      const templateCards = (a?.proposalCards || []).filter(
        (c) => c?.section?.board?.id === templateBoardId
      );
      return templateCards.length > 0
        ? templateCards.map((c) => `${c?.section?.title} > ${c?.title}`).join(", ")
        : "";
    },
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
    ...(showLinkedToCardColumn ? [linkedToCardColumnDef] : []),
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
          alignItems: "center", 
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
          borderTop: "1px solid #E0E0E0",
          paddingTop: "16px",
          marginBottom: "16px",
        }}
      >
        {/* <p style={{ margin: 0 }}>{t("assignment.filter")}</p> */}
        <LinkedCardsToggleButton
          type="button"
          $active={showLinkedToCardColumn}
          onClick={() => setShowLinkedToCardColumn((prev) => !prev)}
        >
          <span>{t("assignment.projectCard", "Project card")}</span>
          <img
            src={showLinkedToCardColumn ? "/assets/icons/eye_open.svg" : "/assets/icons/eye_close.svg"}
            alt=""
            width={18}
            height={18}
            style={{ flexShrink: 0 }}
          />
        </LinkedCardsToggleButton>
        |
        <button
          type="button"
          onClick={() => handlePublishedFilterToggle(true)}
          style={{
            ...styledChipPublished,
            padding: selectedPublishedFilter === true ? "6px 8px 6px 12px" : "6px 12px",
            backgroundColor: selectedPublishedFilter === true ? "#DEF8FB" : "#ffffff",
            borderColor: selectedPublishedFilter === true ? "#625B71" : "#A1A1A1",
          }}
        >
          <span>{t("assignment.published") || "Published"}</span>
          {selectedPublishedFilter === true && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                height: "18px",
                flexShrink: 0,
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handlePublishedFilterToggle(true);
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                  fill="#171717"
                />
              </svg>
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => handlePublishedFilterToggle(false)}
          style={{
            ...styledChipUnpublished,
            padding: selectedPublishedFilter === false ? "6px 8px 6px 12px" : "6px 12px",
            backgroundColor: selectedPublishedFilter === false ? "#F3F3F3" : "#ffffff",
            borderColor: selectedPublishedFilter === false ? "#625B71" : "#A1A1A1",
          }}
        >
          <span>{t("assignment.unpublished") || "Unpublished"}</span>
          {selectedPublishedFilter === false && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                height: "18px",
                flexShrink: 0,
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handlePublishedFilterToggle(false);
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                  fill="#171717"
                />
              </svg>
            </span>
          )}
        </button>
      </div>

      <div style={{ width: "100%", height: "600px" }}>
        <div className="ag-theme-quartz" style={{ height: "100%", width: "100%" }}>
          <AgGridReact
            rowData={filteredAssignments}
            columnDefs={columnDefs}
            context={{
              templateBoardId: myclass?.templateProposal?.id,
              onTogglePublishStatus: handleOpenPublishConfirm,
              updatingStatusAssignmentId,
            }}
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
      <ConnectAssignmentToCardModal
        open={!!assignmentForConnectModal}
        onClose={() => setAssignmentForConnectModal(null)}
        assignment={assignmentForConnectModal}
        myclass={myclass}
        onSuccess={() => setAssignmentForConnectModal(null)}
      />

      <Modal
        open={!!assignmentForPublishModal}
        onClose={() => setAssignmentForPublishModal(null)}
        size="small"
        style={{ borderRadius: "12px" }}
      >
        <Modal.Header>
          {assignmentForPublishModal?.public
            ? t("assignment.confirmUnpublishTitle", "Unpublish assignment?")
            : t("assignment.confirmPublishTitle", "Publish assignment?")}
        </Modal.Header>
        <Modal.Content>
          <p style={{ margin: 0 }}>
            {assignmentForPublishModal?.public
              ? t("assignment.confirmUnpublishMessage", "Students will no longer see this assignment in their list.")
              : t("assignment.confirmPublishMessage", "Students will see this assignment in their class.")}
          </p>
        </Modal.Content>
        <Modal.Actions style={{ padding: "1rem 1.5rem", gap: "8px" }}>
          <Button
            onClick={() => setAssignmentForPublishModal(null)}
            style={{
              borderRadius: "100px",
              border: "1px solid #336F8A",
              background: "white",
              color: "#336F8A",
            }}
          >
            {t("assignment.cancel", "Cancel")}
          </Button>
          <Button
            primary
            onClick={handleConfirmPublishToggle}
            style={{
              borderRadius: "100px",
              background: "#336F8A",
              color: "white",
            }}
          >
            {assignmentForPublishModal?.public
              ? t("assignment.unpublish", "Unpublish")
              : t("assignment.publishToStudents", "Publish to students")}
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
}
