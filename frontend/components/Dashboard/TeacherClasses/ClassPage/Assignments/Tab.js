import { useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import moment from "moment";
import { useMutation } from "@apollo/client";
import { Button, Modal } from "semantic-ui-react";
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
import BulkActionsModal from "./BulkActionsModal";
import DropdownMenu from "../../../../DesignSystem/DropdownMenu";

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
  padding: 6px 12px;
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
  color: #5D5763;
  border: 1.5px solid #5D5763;
  
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

// Wrapper for Bulk actions button: smooth appear/disappear
const BulkActionsButtonWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  max-width: ${(props) => (props.$visible ? "200px" : "0")};
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  overflow: hidden;
  transition: max-width 0.2s ease, opacity 0.2s ease;
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
  const [linkedCardFilter, setLinkedCardFilter] = useState(null); // { type: 'section'|'card', value: string } | null
  const [showLinkedToCardColumn, setShowLinkedToCardColumn] = useState(false); // default: hide "Linked to card" column
  const [assignmentForConnectModal, setAssignmentForConnectModal] = useState(null);
  const [assignmentForPublishModal, setAssignmentForPublishModal] = useState(null);
  const [updatingStatusAssignmentId, setUpdatingStatusAssignmentId] = useState(null);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [bulkActionsModalOpen, setBulkActionsModalOpen] = useState(false);
  const gridRef = useRef(null);

  const canManageAssignmentsBulk =
    myclass?.creator?.id === user?.id ||
    (myclass?.mentors || []).some((m) => m?.id === user?.id);

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

  const templateBoardId = myclass?.templateProposal?.id;

  // Filter assignments by published state, then by linked card (section/card) if set
  const filteredAssignments = (() => {
    let list = selectedPublishedFilter === null
      ? (assignments || [])
      : (assignments || []).filter((a) => a?.public === selectedPublishedFilter);
    if (linkedCardFilter && templateBoardId) {
      list = list.filter((a) => {
        const templateCards = (a?.proposalCards || []).filter(
          (c) => c?.section?.board?.id === templateBoardId
        );
        return templateCards.some((c) =>
          linkedCardFilter.type === "section"
            ? (c?.section?.title ?? "") === linkedCardFilter.value
            : (c?.title ?? "") === linkedCardFilter.value
        );
      });
    }
    return list;
  })();

  const clearLinkedCardFilter = () => setLinkedCardFilter(null);

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

  const chipButtonStyle = {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    textAlign: "left",
  };

  // Linked to card renderer: [Section] > [Card] (section and card each in its own button; clicking filters by that section/card)
  const LinkedToCardRenderer = (params) => {
    const assignment = params?.data;
    const boardId = params?.context?.templateBoardId ?? myclass?.templateProposal?.id;
    const templateCards = (assignment?.proposalCards || []).filter(
      (c) => c?.section?.board?.id === boardId
    );
    const onLinkedCardFilterClick = params?.context?.onLinkedCardFilterClick;
    const handleConnectClick = () => {
      if (!boardId) {
        alert(t("assignment.connectModal.noTemplate", "No template board for this class."));
        return;
      }
      setAssignmentForConnectModal(assignment);
    };
    if (templateCards.length === 0) {
      return (
        <button
          type="button"
          onClick={handleConnectClick}
          style={{ ...chipButtonStyle, display: "flex", alignItems: "center" }}
        >
          <LinkedCardChip $placeholder>Click to connect to card</LinkedCardChip>
        </button>
      );
    }
    return (
      <span
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0,
        }}
      >
        {templateCards.map((c, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              flexWrap: "wrap",
              marginRight: i < templateCards.length - 1 ? "8px" : 0,
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLinkedCardFilterClick?.("section", c?.section?.title ?? "");
              }}
              style={chipButtonStyle}
            >
              <LinkedCardChip>{c?.section?.title || "Section"}</LinkedCardChip>
            </button>
            <span style={{ margin: "0 4px", fontSize: "14px", color: "#616161" }}>&gt;</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLinkedCardFilterClick?.("card", c?.title ?? "");
              }}
              style={chipButtonStyle}
            >
              <LinkedCardChip>{c?.title || "Card"}</LinkedCardChip>
            </button>
          </span>
        ))}
      </span>
    );
  };

  // Change link: opens connect-to-card modal for this row (only shown when Linked to card column is visible)
  const ChangeLinkRenderer = (params) => {
    const assignment = params?.data;
    const templateBoardId = params?.context?.templateBoardId ?? myclass?.templateProposal?.id;
    const handleClick = () => {
      if (!templateBoardId) {
        alert(t("assignment.connectModal.noTemplate", "No template board for this class."));
        return;
      }
      setAssignmentForConnectModal(assignment);
    };
    return (
      <EditButton type="button" onClick={handleClick}>
        {t("assignment.changeLinkToCard", "Change card")}
      </EditButton>
    );
  };

  // Actions dropdown renderer (uses DesignSystem DropdownMenu)
  const ActionsRenderer = (params) => {
    const assignment = params?.data;
    const isPublished = assignment?.public || false;
    const isOwner = assignment?.author?.id === user?.id;
    const isClassTeacherOrMentor =
      myclass?.creator?.id === user?.id ||
      (myclass?.mentors || []).some((m) => m?.id === user?.id);
    const canManageAssignment = isOwner || isClassTeacherOrMentor;
    const router = useRouter();

    const items = [
      ...(canManageAssignment
        ? [
            {
              key: "edit",
              label: t("assignment.edit"),
              onClick: () =>
                router.push({
                  pathname: `/dashboard/myclasses/${myclass?.code}`,
                  query: { page: "assignments", action: "edit", assignment: assignment?.code },
                }),
            },
          ]
        : []),
      {
        key: "preview",
        label: t("assignment.preview"),
        onClick: () =>
          router.push({
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: { page: "assignments", action: "view", assignment: assignment?.code },
          }),
      },
      {
        key: "homeworkOverview",
        label: t("assignment.reviewSubmissions", "Review submissions"),
        onClick: () =>
          router.push({
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: { page: "assignments", action: "homeworkOverview", assignment: assignment?.code },
          }),
      },
      ...(canManageAssignment
        ? [
            {
              key: "publish",
              label: isPublished ? t("assignment.unpublish") : t("assignment.publishToStudents"),
              onClick: () => {
                const confirmMessage = isPublished
                  ? t("assignment.revokeConfirm")
                  : t("assignment.submitConfirm");
                if (confirm(confirmMessage)) {
                  editAssignment({
                    variables: { id: assignment?.id, input: { public: !isPublished } },
                  }).catch((err) => alert(err.message));
                }
              },
            },
            ...(isOwner
              ? [{
                  key: "delete",
                  label: t("assignment.delete"),
                  danger: true,
                  onClick: () => {
                    if (confirm(t("assignment.deleteConfirm"))) {
                      deleteAssignment({ variables: { id: assignment?.id } }).catch((err) =>
                        alert(err.message)
                      );
                    }
                  },
                }]
              : []),
          ]
        : []),
    ];

    return (
      <DropdownMenu
        triggerLabel={t("assignment.more", "More")}
        items={items}
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

  const changeLinkColumnDef = {
    field: "changeLink",
    headerName: "",
    cellRenderer: ChangeLinkRenderer,
    suppressFilter: true,
    sortable: false,
    flex: 0,
    minWidth: 90,
    maxWidth: 120,
    cellStyle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };

  // Column definitions
  const columnDefs = [
    {
      field: "selection",
      headerName: "",
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 48,
      minWidth: 48,
      maxWidth: 52,
      pinned: "left",
      suppressFilter: true,
      sortable: false,
      resizable: false,
    },
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
    ...(showLinkedToCardColumn ? [linkedToCardColumnDef, changeLinkColumnDef] : []),
    ...(!showLinkedToCardColumn
      ? [
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
              params.value ? moment(params.value).format("MMMM D, YYYY") : "",
            filter: "agDateColumnFilter",
            sortable: true,
            flex: 1,
          },
        ]
      : []),
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
        overflow: 'visible',
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
        <BulkActionsButtonWrapper
          $visible={canManageAssignmentsBulk && selectedAssignments.length > 0}
        >
          <SecondaryButton
            type="button"
            onClick={() => setBulkActionsModalOpen(true)}
          >
            {t("assignment.bulkActions", "Bulk actions")}
          </SecondaryButton>
        </BulkActionsButtonWrapper>
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
        {linkedCardFilter != null && (
          <>
          |
            <button
              type="button"
              onClick={clearLinkedCardFilter}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                height: "32px",
                boxSizing: "border-box",
                justifyContent: "center",
                fontSize: "14px",
                flexShrink: 0,
                borderRadius: "8px",
                padding: "6px 8px 6px 12px",
                background: "#E4DFF6",
                border: "1px solid #625B71",
                color: "#625B71",
                maxWidth: "100%",
                wordBreak: "break-word",
                cursor: "pointer",
              }}
            >
              <span>{t("assignment.removeCardColumnFilter", "Remove card/column filter")}</span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "18px",
                  height: "18px",
                  flexShrink: 0,
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
            </button>
          </>
        )}
      </div>

      <div style={{ width: "100%", height: "600px" }}>
        <div className="ag-theme-quartz" style={{ height: "100%", width: "100%" }}>
          <AgGridReact
            ref={gridRef}
            rowData={filteredAssignments}
            columnDefs={columnDefs}
            rowSelection="multiple"
            suppressRowClickSelection
            getRowId={(params) => params.data?.id}
            onSelectionChanged={(e) => {
              if (e.api) setSelectedAssignments(e.api.getSelectedRows());
            }}
            context={{
              templateBoardId: myclass?.templateProposal?.id,
              onTogglePublishStatus: handleOpenPublishConfirm,
              updatingStatusAssignmentId,
              onLinkedCardFilterClick: (type, value) => setLinkedCardFilter({ type, value }),
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

      <BulkActionsModal
        open={bulkActionsModalOpen}
        onClose={() => setBulkActionsModalOpen(false)}
        selectedAssignments={selectedAssignments}
        myclass={myclass}
        onSuccess={() => {
          gridRef.current?.api?.deselectAll();
        }}
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
