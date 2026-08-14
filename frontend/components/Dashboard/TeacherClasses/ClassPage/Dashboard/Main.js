import { useQuery } from "@apollo/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";
import useTranslation from "next-translate/useTranslation";

import { StudentPageLink } from "./Renderers/StudentPageLink";
import { ManageProjectCell } from "./Renderers/ManageProjectCell";
import { ManageStudyCell } from "./Renderers/ManageStudyCell";
import { StatusChipCell } from "./Renderers/StatusChipCell";
import { OpenChipCell } from "./Renderers/OpenChipCell";
import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../Queries/Classes";
import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../../Queries/Proposal";
import {
  getClassTemplateBoards,
  getPrimaryTemplateBoardId,
} from "../../../../../lib/classTemplateBoards";
import {
  isOpenForComments,
  readMilestoneStatus,
} from "../../../../../lib/milestoneStatus";
import { getMilestonesForTemplateBoard } from "../../../../../lib/templateBoardActionCards";
import { useBoardMilestones } from "../../../../../lib/useBoardMilestones";

import Button from "../../../../DesignSystem/Button";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import DashboardAssetIcon from "./DashboardAssetIcon";
import MilestoneCards from "./MilestoneCards";
import {
  aggregateReviewsForMilestone,
  DASHBOARD_PROJECTS_CARD_KEY,
  firstQueryValue,
  isCompleteStatus,
  milestoneShowsReviews,
} from "./dashboardUtils";
import { SelectedStudentsModal } from "./Modals/SelectedStudents";
import ProjectManager from "./Modals/ProjectManager";
import StudyManager from "./Modals/StudyManager";
import SubmissionStatusManager from "./Modals/SubmissionStatusManager";
import StudySubmissionStatusManager from "./Modals/StudySubmissionStatusManager";
import {
  readClassPrefs,
  writeClassDashboardPrefs,
} from "../classPagePrefs";

const CELL_ALIGN = {
  display: "flex",
  alignItems: "center",
};

function BoardMilestonesSync({ board, onMilestones }) {
  const { milestones, loading } = useBoardMilestones(board?.id);
  const hasCardInventory = Array.isArray(board?.sections);
  const listed = useMemo(
    () =>
      hasCardInventory
        ? getMilestonesForTemplateBoard(board, milestones)
        : [],
    [board, milestones, hasCardInventory]
  );

  useEffect(() => {
    onMilestones(board?.id, listed, loading || !hasCardInventory);
  }, [board?.id, listed, loading, hasCardInventory, onMilestones]);

  return null;
}

function buildDashboardQuery({ template, step, persistTemplate }) {
  const query = { page: "dashboard" };
  if (persistTemplate && template) query.template = template;
  if (step) query.step = step;
  return query;
}

export default function Dashboard({ myclass }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const stepFromQuery = firstQueryValue(router.query?.step);
  const templateFromQuery = firstQueryValue(router.query?.template);

  const { data } = useQuery(GET_STUDENTS_DASHBOARD_DATA, {
    variables: { classId: myclass?.id },
    skip: !myclass?.id,
  });

  const { data: templateProjectsData } = useQuery(
    CLASS_TEMPLATE_PROJECTS_QUERY,
    {
      variables: { classId: myclass?.id },
      skip: !myclass?.id,
    }
  );
  const templateBoards = useMemo(() => {
    const boardsFromQuery = templateProjectsData?.proposalBoards || [];
    const listed = getClassTemplateBoards(myclass).filter((board) => board?.id);
    if (!listed.length) return boardsFromQuery.filter((board) => board?.id);
    return listed.map((board) => {
      const withCards = boardsFromQuery.find((item) => item.id === board.id);
      return withCards ? { ...board, ...withCards } : board;
    });
  }, [myclass, templateProjectsData?.proposalBoards]);
  const persistTemplate = templateBoards.length > 1;
  const primaryBoardId = getPrimaryTemplateBoardId(myclass);

  const validTemplateId = useMemo(() => {
    if (!templateFromQuery) return undefined;
    return templateBoards.some((board) => board.id === templateFromQuery)
      ? templateFromQuery
      : undefined;
  }, [templateBoards, templateFromQuery]);

  const [milestonesByBoard, setMilestonesByBoard] = useState({});
  const [loadingByBoard, setLoadingByBoard] = useState({});

  const onBoardMilestones = useCallback((boardId, milestones, loading) => {
    setMilestonesByBoard((prev) => {
      if (prev[boardId] === milestones) return prev;
      return { ...prev, [boardId]: milestones };
    });
    setLoadingByBoard((prev) => {
      if (prev[boardId] === loading) return prev;
      return { ...prev, [boardId]: loading };
    });
  }, []);

  const boardsLoading = templateBoards.some(
    (board) => loadingByBoard[board.id] !== false
  );

  const inferredTemplateId = useMemo(() => {
    if (validTemplateId || templateBoards.length < 2 || !stepFromQuery) {
      return undefined;
    }
    if (boardsLoading) return undefined;
    const owner = templateBoards.find((board) =>
      (milestonesByBoard[board.id] || []).some(
        (milestone) => milestone.key === stepFromQuery
      )
    );
    return owner?.id;
  }, [
    validTemplateId,
    templateBoards,
    stepFromQuery,
    boardsLoading,
    milestonesByBoard,
  ]);

  const selectedBoardId = useMemo(() => {
    if (templateBoards.length === 1) return templateBoards[0].id;
    return validTemplateId || inferredTemplateId || undefined;
  }, [templateBoards, validTemplateId, inferredTemplateId]);

  const milestones = selectedBoardId
    ? milestonesByBoard[selectedBoardId] || []
    : [];
  const milestonesReady =
    !templateBoards.length || (selectedBoardId && loadingByBoard[selectedBoardId] === false);

  const selectedMilestone = useMemo(() => {
    if (!stepFromQuery || !milestones.length) return null;
    return milestones.find((milestone) => milestone.key === stepFromQuery) || null;
  }, [milestones, stepFromQuery]);

  const replaceDashboardQuery = useCallback(
    (next) => {
      if (!myclass?.code) return;
      const query = buildDashboardQuery({
        ...next,
        persistTemplate,
      });
      if (myclass?.id) {
        writeClassDashboardPrefs(myclass.id, {
          template: query.template,
          step: query.step,
        });
      }
      router.replace(
        {
          pathname: `/dashboard/myclasses/${myclass.code}`,
          query,
        },
        undefined,
        { shallow: true }
      );
    },
    [myclass?.code, myclass?.id, persistTemplate, router]
  );

  const hasRestoredDashboardPrefs = useRef(false);

  useEffect(() => {
    if (!router.isReady || !myclass?.id || boardsLoading) {
      return;
    }
    if (hasRestoredDashboardPrefs.current) return;

    const hasExplicitQuery = Boolean(templateFromQuery || stepFromQuery);
    if (hasExplicitQuery) {
      hasRestoredDashboardPrefs.current = true;
      writeClassDashboardPrefs(myclass.id, {
        template: templateFromQuery,
        step: stepFromQuery,
      });
      return;
    }

    const stored = readClassPrefs(myclass.id)?.dashboard;
    if (!stored) {
      hasRestoredDashboardPrefs.current = true;
      return;
    }

    const storedTemplate =
      stored.template &&
      templateBoards.some((board) => board.id === stored.template)
        ? stored.template
        : undefined;
    const boardIdForStep =
      storedTemplate ||
      (templateBoards.length === 1 ? templateBoards[0].id : undefined);

    if (boardIdForStep && loadingByBoard[boardIdForStep] !== false) {
      return;
    }

    hasRestoredDashboardPrefs.current = true;

    const boardMilestones = boardIdForStep
      ? milestonesByBoard[boardIdForStep] || []
      : [];
    const storedStep =
      stored.step && boardMilestones.some((m) => m.key === stored.step)
        ? stored.step
        : undefined;

    if (!storedTemplate && !storedStep) return;

    replaceDashboardQuery({
      template: persistTemplate ? storedTemplate : undefined,
      step: storedStep,
    });
  }, [
    router.isReady,
    myclass?.id,
    boardsLoading,
    loadingByBoard,
    templateFromQuery,
    stepFromQuery,
    templateBoards,
    milestonesByBoard,
    persistTemplate,
    replaceDashboardQuery,
  ]);

  useEffect(() => {
    if (!router.isReady || !myclass?.code || boardsLoading) return;

    const desiredTemplate = persistTemplate ? selectedBoardId : undefined;
    const desiredStep = selectedMilestone?.key;

    if (
      (templateFromQuery || undefined) === (desiredTemplate || undefined) &&
      (stepFromQuery || undefined) === (desiredStep || undefined)
    ) {
      return;
    }

    if (!desiredTemplate && persistTemplate && stepFromQuery && !desiredStep) {
      if (templateFromQuery && !validTemplateId) {
        replaceDashboardQuery({
          template: undefined,
          step: stepFromQuery,
        });
      }
      return;
    }

    replaceDashboardQuery({
      template: desiredTemplate,
      step: desiredStep,
    });
  }, [
    router.isReady,
    myclass?.code,
    boardsLoading,
    persistTemplate,
    selectedBoardId,
    selectedMilestone?.key,
    templateFromQuery,
    stepFromQuery,
    validTemplateId,
    replaceDashboardQuery,
  ]);

  const selectTemplateBoard = useCallback(
    (boardId) => {
      if (!boardId) return;
      const nextMilestones = milestonesByBoard[boardId] || [];
      const keepStep =
        stepFromQuery &&
        nextMilestones.some((milestone) => milestone.key === stepFromQuery);
      replaceDashboardQuery({
        template: boardId,
        step: keepStep ? stepFromQuery : undefined,
      });
    },
    [milestonesByBoard, replaceDashboardQuery, stepFromQuery]
  );

  const selectStep = useCallback(
    (key) => {
      if (!key) return;
      if (key === DASHBOARD_PROJECTS_CARD_KEY) {
        replaceDashboardQuery({
          template: selectedBoardId,
          step: undefined,
        });
        return;
      }
      const nextStep = stepFromQuery === key ? undefined : key;
      replaceDashboardQuery({
        template: selectedBoardId,
        step: nextStep,
      });
    },
    [replaceDashboardQuery, selectedBoardId, stepFromQuery]
  );

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [projectRow, setProjectRow] = useState(null);
  const [studyRow, setStudyRow] = useState(null);
  const [statusRow, setStatusRow] = useState(null);

  const students = data?.profiles || [];

  const studentsProcessed = useMemo(
    () =>
      students.map((student) => {
        const classProjects = student?.collaboratorInProposal?.filter(
          (project) => project?.usedInClass?.id === myclass?.id
        );

        let project;
        let projects;
        let projectId;
        let projectTitle;
        let studyId;
        let studyTitle;

        if (classProjects && classProjects.length) {
          const mainProjects = classProjects.filter((p) => p?.isMain);
          project = (mainProjects.length && mainProjects[0]) || classProjects[0];
          projects = classProjects;
          projectId = project?.id;
          projectTitle = project?.title;
          studyId = project?.study?.id;
          studyTitle = project?.study?.title;
        }

        const studies = student?.collaboratorInStudy?.filter((study) =>
          study?.classes?.map((cl) => cl?.id).includes(myclass?.id)
        );

        const statusEntry = selectedMilestone
          ? readMilestoneStatus(project, selectedMilestone.key, milestones)
          : { status: "NOT_STARTED" };

        return {
          id: student?.id,
          publicId: student?.publicId,
          username: student?.username,
          project,
          projects,
          projectId,
          projectTitle,
          studies,
          studyId,
          studyTitle,
          milestoneStatusValue: statusEntry?.status || "NOT_STARTED",
          milestoneIsOpen: selectedMilestone
            ? isOpenForComments(project, selectedMilestone, milestones)
            : false,
          commentsReceived: aggregateReviewsForMilestone(
            project,
            selectedMilestone
          ),
        };
      }),
    [students, myclass?.id, selectedMilestone, milestones]
  );

  const completionByKey = useMemo(() => {
    const totals = {};
    for (const milestone of milestones) {
      totals[milestone.key] = studentsProcessed.filter((student) => {
        const entry = readMilestoneStatus(
          student.project,
          milestone.key,
          milestones
        );
        return isCompleteStatus(entry?.status);
      }).length;
    }
    return totals;
  }, [milestones, studentsProcessed]);

  const showReviewsColumn = milestoneShowsReviews(selectedMilestone);
  const isStudyMilestone = selectedMilestone?.statusTarget === "study";
  const projectsAssignedCount = useMemo(
    () => studentsProcessed.filter((student) => student.projectId).length,
    [studentsProcessed]
  );

  const boardOptions = useMemo(
    () =>
      templateBoards.map((board) => ({
        value: board.id,
        label:
          board?.title ||
          t("dashboard.untitledTemplateBoard", {}, {
            default: "Untitled template",
          }),
      })),
    [templateBoards, t]
  );

  const columnDefs = useMemo(() => {
    const cols = [
      {
        field: "selection",
        headerName: "",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 52,
        minWidth: 52,
        maxWidth: 56,
        pinned: "left",
        sortable: false,
        filter: false,
        resizable: false,
        suppressHeaderMenuButton: true,
      },
      {
        field: "username",
        pinned: "left",
        headerName: t("dashboard.username", {}, { default: "Username" }),
        cellRenderer: StudentPageLink,
        cellRendererParams: {
          baseUrl: "/students",
        },
        width: 180,
        minWidth: 140,
      },
    ];

    if (!selectedMilestone) {
      cols.push(
        {
          field: "projectTitle",
          headerName: t("dashboard.mainProject", {}, {
            default: "Main Project",
          }),
          minWidth: 160,
          flex: 1,
        },
        {
          colId: "manageProject",
          field: "projectTitle",
          headerName: t("dashboard.manageProject", {}, {
            default: "Manage project",
          }),
          cellRenderer: ManageProjectCell,
          cellRendererParams: {
            onManageProject: setProjectRow,
          },
          sortable: false,
          filter: false,
          minWidth: 200,
          width: 220,
        },
        {
          colId: "manageStudy",
          field: "studyTitle",
          headerName: t("dashboard.manageStudy", {}, {
            default: "Manage study",
          }),
          cellRenderer: ManageStudyCell,
          cellRendererParams: {
            onManageStudy: setStudyRow,
          },
          sortable: false,
          filter: false,
          minWidth: 200,
          width: 220,
        }
      );
      return cols;
    }

    cols.push({
      field: "milestoneStatusValue",
      headerName: t("dashboard.statusColumn", {}, { default: "Status" }),
      cellRenderer: StatusChipCell,
      cellRendererParams: {
        onManageStatus: setStatusRow,
        statusTarget: selectedMilestone.statusTarget,
      },
      minWidth: 180,
      width: 200,
    });
    cols.push({
      field: "milestoneIsOpen",
      headerName: isStudyMilestone
        ? t("dashboard.participationSetting", {}, {
            default: "Open for participation",
          })
        : t("dashboard.openSetting", {}, { default: "Open for comments" }),
      cellRenderer: OpenChipCell,
      cellRendererParams: {
        statusTarget: selectedMilestone.statusTarget,
        onManageStatus: setStatusRow,
      },
      minWidth: 200,
      width: 220,
    });
    if (showReviewsColumn) {
      cols.push({
        field: "commentsReceived",
        headerName: t("dashboard.commentsReceived", {}, {
          default: "Comments received",
        }),
        minWidth: 160,
        flex: 1,
      });
    }

    return cols;
  }, [t, selectedMilestone, isStudyMilestone, showReviewsColumn]);

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      minWidth: 120,
      cellStyle: CELL_ALIGN,
    }),
    []
  );

  const statusManagerValue = statusRow?.milestoneStatusValue;
  const statusManagerOpen = Boolean(statusRow && selectedMilestone);
  const showCards = Boolean(selectedBoardId) && milestonesReady;
  const showChooserPrompt = persistTemplate && !selectedBoardId;

  return (
    <StyledDashboard className="dashboard">
      {templateBoards.map((board) => (
        <BoardMilestonesSync
          key={board.id}
          board={board}
          onMilestones={onBoardMilestones}
        />
      ))}

      {templateBoards.length === 0 ? (
        <div className="dashboardSourceBar">
          <p className="dashboardEmpty">
            {t("dashboard.noTemplateBoards", {}, {
              default:
                "This class has no template boards, so there are no class milestones to show.",
            })}
          </p>
        </div>
      ) : null}

      {templateBoards.length > 1 ? (
        <div className="dashboardSourceBar">
          <span className="dashboardSourceLabel">
            {t("dashboard.templateBoardLabel", {}, {
              default: "Template board",
            })}
            :
          </span>
          <DropdownSelect
            value={selectedBoardId || ""}
            onChange={selectTemplateBoard}
            options={boardOptions}
            placeholder={t("dashboard.selectTemplateBoard", {}, {
              default: "Select a template board",
            })}
            ariaLabel={t("dashboard.templateBoardLabel", {}, {
              default: "Template board",
            })}
            fitContent
          />
        </div>
      ) : null}

      {showChooserPrompt ? (
        <p className="dashboardEmpty">
          {t("dashboard.chooseTemplateBoard", {}, {
            default: "Choose a template board to see its milestones.",
          })}
        </p>
      ) : null}

      {showCards && milestones.length === 0 ? (
        <p className="dashboardEmpty">
          {t("dashboard.noTemplateMilestones", {}, {
            default: "This template board has no class milestones yet.",
          })}
        </p>
      ) : null}

      {showCards ? (
        <MilestoneCards
          milestones={milestones}
          selectedKey={
            selectedMilestone?.key || DASHBOARD_PROJECTS_CARD_KEY
          }
          onSelect={selectStep}
          completionByKey={completionByKey}
          totalStudents={studentsProcessed.length}
          projectsAssignedCount={projectsAssignedCount}
        />
      ) : null}

      {selectedStudents.length > 1 ? (
        <div className="dashboardToolbar">
          <Button
            variant="tonal"
            leadingIcon={
              <DashboardAssetIcon src="/assets/icons/profile/people.svg" />
            }
            onClick={() => setIsBulkOpen(true)}
          >
            {t("dashboard.manageSelectedStudents", {
              count: selectedStudents.length,
            }, {
              default: "Manage Selected Students ({{count}})",
            })}
          </Button>
        </div>
      ) : null}

      <SelectedStudentsModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        selectedStudents={selectedStudents}
        classId={myclass?.id}
        milestone={selectedMilestone}
      />

      {projectRow ? (
        <ProjectManager
          key={projectRow.id}
          open
          onClose={() => setProjectRow(null)}
          data={projectRow}
          classId={myclass?.id}
          classProposalBoardId={selectedBoardId || primaryBoardId}
        />
      ) : null}

      {studyRow ? (
        <StudyManager
          key={studyRow.id}
          open
          onClose={() => setStudyRow(null)}
          data={studyRow}
          classId={myclass?.id}
          classCode={myclass?.code}
        />
      ) : null}

      {statusManagerOpen && isStudyMilestone ? (
        <StudySubmissionStatusManager
          key={statusRow.id}
          open
          onClose={() => setStatusRow(null)}
          data={statusRow}
          value={statusManagerValue}
          openForParticipation={statusRow.milestoneIsOpen}
          classId={myclass?.id}
          milestone={selectedMilestone}
          stage={selectedMilestone.title || selectedMilestone.key}
        />
      ) : null}

      {statusManagerOpen && !isStudyMilestone ? (
        <SubmissionStatusManager
          key={statusRow.id}
          open
          onClose={() => setStatusRow(null)}
          data={statusRow}
          value={statusManagerValue}
          openForComments={statusRow.milestoneIsOpen}
          classId={myclass?.id}
          milestone={selectedMilestone}
          stage={selectedMilestone.title || selectedMilestone.key}
        />
      ) : null}

      <div className="ag-theme-quartz dashboardGrid">
        <AgGridReact
          rowData={studentsProcessed}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          suppressRowClickSelection
          rowHeight={48}
          overlayNoRowsTemplate={t("dashboard.noStudentsYet", {}, {
            default: "No students have joined this class yet.",
          })}
          getRowId={(params) =>
            params.data.id || params.data.publicId || params.data.username
          }
          onSelectionChanged={(event) => {
            setSelectedStudents(event.api.getSelectedRows());
          }}
        />
      </div>
    </StyledDashboard>
  );
}

const StyledDashboard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  box-sizing: border-box;
  min-height: min(70vh, calc(100vh - 280px));

  .dashboardSourceBar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    max-width: 100%;
    min-width: 0;
  }

  .dashboardSourceLabel {
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .dashboardEmpty {
    margin: 0;
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .dashboardToolbar {
    display: flex;
    align-items: center;
  }

  .dashboardGrid {
    position: relative;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    flex: 1;
    min-height: 360px;
    height: min(70vh, calc(100vh - 360px));

    /* AG Grid's root uses height: 100%; that collapses to ~0 in a flex
       column unless the theme container establishes a definite box and
       the generated child is stretched to fill it. */
    > div {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
  }

  .ag-cell {
    overflow: visible;
  }
`;
