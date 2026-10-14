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
import { MainProjectCell } from "./Renderers/MainProjectCell";
import { MilestoneStatusCell } from "./Renderers/MilestoneStatusCell";
import { MilestoneColumnHeader } from "./Renderers/MilestoneColumnHeader";
import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../Queries/Classes";
import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../../Queries/Proposal";
import {
  getClassTemplateBoards,
  getPrimaryTemplateBoardId,
} from "../../../../../lib/classTemplateBoards";
import { isOpenForComments } from "../../../../../lib/milestoneStatus";
import BoardMilestonesSync from "../../../BoardMilestonesSync";

import Button from "../../../../DesignSystem/Button";
import Card from "../../../../DesignSystem/Card";
import Chip from "../../../../DesignSystem/Chip";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import Input from "../../../../DesignSystem/Input";
import JustOneSecondNotice from "../../../../DesignSystem/JustOneSecondNotice";
import {
  canReopenMilestone,
  countReviewsForMilestone,
  deriveMilestoneStatus,
  firstQueryValue,
  isCompleteStatus,
  milestoneShowsReviews,
  parseStepKeys,
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
import { useClassTablePrefs } from "../useClassTablePrefs";

const CELL_ALIGN = {
  display: "flex",
  alignItems: "center",
};

// One saved column layout for the whole dashboard, restored once when the grid
// loads. A key per milestone combination made the hook re-apply a layout while
// AG Grid was still adding/removing columns, which left the header offset from
// the body.
const DASHBOARD_TABLE_ID = "dashboard";

const rowKey = (row) => row?.id || row?.publicId || row?.username;

function buildDashboardQuery({ template, steps, persistTemplate }) {
  const query = { page: "dashboard" };
  if (persistTemplate && template) query.template = template;
  if (steps?.length) query.steps = steps.join(",");
  return query;
}

export default function Dashboard({ myclass }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  // `?step=` is the pre-multi-select param; read it, then rewrite to `?steps=`.
  const hasLegacyStepParam = router.query?.step != null;
  const stepsKeyFromQuery = parseStepKeys(
    router.query?.steps ?? router.query?.step
  ).join(",");
  const stepsFromQuery = useMemo(
    () => (stepsKeyFromQuery ? stepsKeyFromQuery.split(",") : []),
    [stepsKeyFromQuery]
  );
  const templateFromQuery = firstQueryValue(router.query?.template);

  const { data, loading: studentsLoading } = useQuery(
    GET_STUDENTS_DASHBOARD_DATA,
    {
      variables: { classId: myclass?.id },
      skip: !myclass?.id,
    }
  );

  const {
    data: templateProjectsData,
    loading: templateProjectsLoading,
  } = useQuery(CLASS_TEMPLATE_PROJECTS_QUERY, {
    variables: { classId: myclass?.id },
    skip: !myclass?.id,
  });
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
    if (
      validTemplateId ||
      templateBoards.length < 2 ||
      !stepsFromQuery.length
    ) {
      return undefined;
    }
    if (boardsLoading) return undefined;
    const owner = templateBoards.find((board) =>
      (milestonesByBoard[board.id] || []).some((milestone) =>
        stepsFromQuery.includes(milestone.key)
      )
    );
    return owner?.id;
  }, [
    validTemplateId,
    templateBoards,
    stepsFromQuery,
    boardsLoading,
    milestonesByBoard,
  ]);

  const selectedBoardId = useMemo(() => {
    if (templateBoards.length === 1) return templateBoards[0].id;
    return validTemplateId || inferredTemplateId || undefined;
  }, [templateBoards, validTemplateId, inferredTemplateId]);

  const milestones = useMemo(
    () => (selectedBoardId ? milestonesByBoard[selectedBoardId] || [] : []),
    [selectedBoardId, milestonesByBoard]
  );
  const milestonesReady =
    !templateBoards.length || (selectedBoardId && loadingByBoard[selectedBoardId] === false);

  // Board order, not click order, so columns line up with the chip row.
  const selectedMilestones = useMemo(
    () =>
      milestones.filter((milestone) => stepsFromQuery.includes(milestone.key)),
    [milestones, stepsFromQuery]
  );
  const selectedStepsKey = selectedMilestones
    .map((milestone) => milestone.key)
    .join(",");

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
          steps: next.steps,
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

    const hasExplicitQuery = Boolean(
      templateFromQuery || stepsFromQuery.length
    );
    if (hasExplicitQuery) {
      hasRestoredDashboardPrefs.current = true;
      writeClassDashboardPrefs(myclass.id, {
        template: templateFromQuery,
        steps: stepsFromQuery,
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
    const storedSteps = parseStepKeys(stored.steps ?? stored.step).filter(
      (key) => boardMilestones.some((m) => m.key === key)
    );

    if (!storedTemplate && !storedSteps.length) return;

    replaceDashboardQuery({
      template: persistTemplate ? storedTemplate : undefined,
      steps: storedSteps,
    });
  }, [
    router.isReady,
    myclass?.id,
    boardsLoading,
    loadingByBoard,
    templateFromQuery,
    stepsFromQuery,
    templateBoards,
    milestonesByBoard,
    persistTemplate,
    replaceDashboardQuery,
  ]);

  useEffect(() => {
    if (!router.isReady || !myclass?.code || boardsLoading) return;

    const desiredTemplate = persistTemplate ? selectedBoardId : undefined;

    if (
      (templateFromQuery || undefined) === (desiredTemplate || undefined) &&
      stepsKeyFromQuery === selectedStepsKey &&
      !hasLegacyStepParam
    ) {
      return;
    }

    if (
      !desiredTemplate &&
      persistTemplate &&
      stepsFromQuery.length &&
      !selectedStepsKey
    ) {
      if (templateFromQuery && !validTemplateId) {
        replaceDashboardQuery({
          template: undefined,
          steps: stepsFromQuery,
        });
      }
      return;
    }

    replaceDashboardQuery({
      template: desiredTemplate,
      steps: selectedStepsKey ? selectedStepsKey.split(",") : [],
    });
  }, [
    router.isReady,
    myclass?.code,
    boardsLoading,
    persistTemplate,
    selectedBoardId,
    selectedStepsKey,
    templateFromQuery,
    stepsKeyFromQuery,
    stepsFromQuery,
    hasLegacyStepParam,
    validTemplateId,
    replaceDashboardQuery,
  ]);

  const selectTemplateBoard = useCallback(
    (boardId) => {
      if (!boardId) return;
      const nextMilestones = milestonesByBoard[boardId] || [];
      replaceDashboardQuery({
        template: boardId,
        steps: stepsFromQuery.filter((key) =>
          nextMilestones.some((milestone) => milestone.key === key)
        ),
      });
    },
    [milestonesByBoard, replaceDashboardQuery, stepsFromQuery]
  );

  const toggleStep = useCallback(
    (key) => {
      if (!key) return;
      const isSelected = stepsFromQuery.includes(key);
      const steps = milestones
        .map((milestone) => milestone.key)
        .filter((k) =>
          k === key ? !isSelected : stepsFromQuery.includes(k)
        );
      replaceDashboardQuery({
        template: selectedBoardId,
        steps,
      });
    },
    [milestones, replaceDashboardQuery, selectedBoardId, stepsFromQuery]
  );

  // Selection and the status modal hold row keys, not rows, so they always read
  // the latest data after a refetch.
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkMilestoneKey, setBulkMilestoneKey] = useState(null);
  const [projectRow, setProjectRow] = useState(null);
  const [studyRow, setStudyRow] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [search, setSearch] = useState("");

  const openStatusManager = useCallback(
    (row, milestone) => setStatusTarget({ rowKey: rowKey(row), milestone }),
    []
  );

  const students = data?.profiles || [];

  const studentsProcessed = useMemo(
    () =>
      students.flatMap((student) => {
        const classProjects = student?.collaboratorInProposal?.filter(
          (project) => project?.usedInClass?.id === myclass?.id
        );
        // With a template board selected, only boards cloned from it count, and
        // students without one are left out of the table.
        const boardProjects = selectedBoardId
          ? (classProjects || []).filter(
              (project) => project?.clonedFrom?.id === selectedBoardId
            )
          : classProjects;
        if (selectedBoardId && !boardProjects.length) return [];

        let project;
        let projects;
        let projectId;
        let projectTitle;
        let studyId;
        let studyTitle;

        if (boardProjects && boardProjects.length) {
          const mainProjects = boardProjects.filter((p) => p?.isMain);
          project = (mainProjects.length && mainProjects[0]) || boardProjects[0];
          projects = classProjects;
          projectId = project?.id;
          projectTitle = project?.title;
          studyId = project?.study?.id;
          studyTitle = project?.study?.title;
        }

        const studies = student?.collaboratorInStudy?.filter((study) =>
          study?.classes?.map((cl) => cl?.id).includes(myclass?.id)
        );

        const milestoneEntries = {};
        for (const milestone of selectedMilestones) {
          milestoneEntries[milestone.key] = {
            status: deriveMilestoneStatus(project, milestone, milestones),
            isOpen: isOpenForComments(project, milestone, milestones),
            reviewCount: milestoneShowsReviews(milestone)
              ? countReviewsForMilestone(project, milestone)
              : 0,
          };
        }

        return [{
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
          milestones: milestoneEntries,
        }];
      }),
    [students, myclass?.id, selectedBoardId, selectedMilestones, milestones]
  );

  const completionByKey = useMemo(() => {
    const totals = {};
    for (const milestone of selectedMilestones) {
      totals[milestone.key] = studentsProcessed.filter((student) =>
        isCompleteStatus(student.milestones[milestone.key]?.status)
      ).length;
    }
    return totals;
  }, [selectedMilestones, studentsProcessed]);

  const selectedStudents = useMemo(() => {
    const keys = new Set(selectedRowKeys);
    return studentsProcessed.filter((row) => keys.has(rowKey(row)));
  }, [selectedRowKeys, studentsProcessed]);

  // One bulk action per milestone column, each counting only the selected
  // students who have submitted that milestone.
  const bulkActions = useMemo(
    () =>
      selectedMilestones.map((milestone) => {
        const isStudy = milestone.statusTarget === "study";
        const eligible = selectedStudents.filter(
          (row) =>
            row.projectId &&
            canReopenMilestone(row.milestones[milestone.key]?.status, isStudy)
        ).length;
        return { milestone, isStudy, eligible };
      }),
    [selectedMilestones, selectedStudents]
  );
  const bulkMilestone = selectedMilestones.find(
    (milestone) => milestone.key === bulkMilestoneKey
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

    cols.push({
      field: "projectTitle",
      headerName: t("dashboard.mainProject", {}, {
        default: "Main Project",
      }),
      cellRenderer: MainProjectCell,
      minWidth: 200,
      width: 260,
    });

    for (const milestone of selectedMilestones) {
      cols.push({
        colId: `milestone:${milestone.key}`,
        headerName: milestone.title || milestone.key,
        headerComponent: MilestoneColumnHeader,
        headerComponentParams: {
          completed: completionByKey[milestone.key] || 0,
          total: studentsProcessed.length,
        },
        valueGetter: (params) =>
          params.data?.milestones?.[milestone.key]?.status || "NOT_STARTED",
        cellRenderer: MilestoneStatusCell,
        cellRendererParams: {
          milestone,
          onManageStatus: openStatusManager,
        },
        minWidth: 200,
        width: 260,
      });
    }

    cols.push(
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
  }, [
    t,
    selectedMilestones,
    completionByKey,
    studentsProcessed.length,
    openStatusManager,
  ]);

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

  const tablePrefs = useClassTablePrefs(
    myclass?.id,
    DASHBOARD_TABLE_ID,
    { fitToWidth: false }
  );

  const statusRow = statusTarget
    ? studentsProcessed.find((row) => rowKey(row) === statusTarget.rowKey)
    : null;
  const statusMilestone = statusTarget?.milestone;
  const statusEntry = statusRow?.milestones?.[statusMilestone?.key];
  const isStudyStatus = statusMilestone?.statusTarget === "study";
  const showCards = Boolean(selectedBoardId) && milestonesReady;
  const showChooserPrompt =
    persistTemplate && !selectedBoardId && !boardsLoading;
  const isDashboardQueryPending =
    (studentsLoading && !data) ||
    (templateProjectsLoading && !templateProjectsData);

  if (isDashboardQueryPending) {
    return (
      <StyledDashboard className="dashboard">
        <JustOneSecondNotice
          message={{
            h1: t("dashboard.loadingTitle", {}, {
              default: "Loading dashboard",
            }),
            p: t("dashboard.loadingBody", {}, {
              default:
                "Fetching students and project templates for this dashboard.",
            }),
          }}
        />
      </StyledDashboard>
    );
  }

  return (
    <StyledDashboard className="dashboard">
      {templateBoards.map((board) => (
        <BoardMilestonesSync
          key={board.id}
          board={board}
          onMilestones={onBoardMilestones}
        />
      ))}

      {templateBoards.length > 0 && boardsLoading ? (
        <JustOneSecondNotice
          message={{
            h1: t("dashboard.loadingMilestonesTitle", {}, {
              default: "Loading class milestones",
            }),
            p: t("dashboard.loadingMilestonesBody", {}, {
              default: "Fetching milestones from the class project templates.",
            }),
          }}
        />
      ) : null}

      <Card variant="outline" as="section" className="dashboardTools">
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

        {showCards && milestones.length > 0 ? (
          <p className="dashboardHint">
            {t("dashboard.milestoneReopenHint", {}, {
              default:
                "Select milestones to add them as columns. Submitting a milestone locks the student's work; click a student's status to see what it means or to reopen submitted work so they can edit and submit again.",
            })}
          </p>
        ) : null}

        <div className="dashboardFilterBar">
          {showCards && milestones.length > 0 ? (
            <div
              className="dashboardFilterChips"
              role="group"
              aria-label={t("dashboard.milestoneCardsNav", {}, {
                default: "Class milestones",
              })}
            >
              <span className="dashboardFilterLabel">
                {t("dashboard.milestoneFilter", {}, {
                  default: "Milestone filter",
                })}
              </span>
              {milestones.map((milestone) => {
                const selected = stepsFromQuery.includes(milestone.key);
                return (
                  <Chip
                    key={milestone.id || milestone.key}
                    label={milestone.title || milestone.key}
                    pressed={selected}
                    onClick={() => toggleStep(milestone.key)}
                    onClose={
                      selected ? () => toggleStep(milestone.key) : undefined
                    }
                  />
                );
              })}
            </div>
          ) : null}
          <div className="dashboardSearch">
            <Input
              value={search}
              onChange={setSearch}
              placeholder={t("dashboard.searchStudents", {}, {
                default: "Search students or projects",
              })}
              aria-label={t("dashboard.searchStudents", {}, {
                default: "Search students or projects",
              })}
            />
          </div>
        </div>
      </Card>

      {selectedStudents.length > 0 ? (
        <div className="dashboardToolbar">
          <span className="dashboardToolbarLabel">
            {t("dashboard.selectedCount", {
              count: selectedStudents.length,
            }, {
              default: "{{count}} selected",
            })}
          </span>
          {bulkActions.length === 0 ? (
            <span className="dashboardToolbarHint">
              {t("dashboard.bulkNeedsMilestone", {}, {
                default: "Add a milestone column to reopen it for these students.",
              })}
            </span>
          ) : (
            bulkActions.map(({ milestone, isStudy, eligible }) => {
              const stage = milestone.title || milestone.key;
              const vars = {
                stage,
                eligible,
                count: selectedStudents.length,
              };
              return (
                <Button
                  key={milestone.key}
                  variant="outline"
                  disabled={eligible === 0}
                  title={
                    eligible === 0
                      ? t("dashboard.bulkNoneSubmitted", { stage }, {
                          default:
                            "None of the selected students has submitted {{stage}}.",
                        })
                      : undefined
                  }
                  onClick={() => setBulkMilestoneKey(milestone.key)}
                >
                  {isStudy
                    ? t("dashboard.bulkUnlockButton", vars, {
                        default: "Unlock {{stage}} ({{eligible}} of {{count}})",
                      })
                    : t("dashboard.bulkReopenButton", vars, {
                        default: "Reopen {{stage}} ({{eligible}} of {{count}})",
                      })}
                </Button>
              );
            })
          )}
        </div>
      ) : null}

      {bulkMilestone ? (
        <SelectedStudentsModal
          key={bulkMilestone.key}
          isOpen
          onClose={() => setBulkMilestoneKey(null)}
          selectedStudents={selectedStudents}
          classId={myclass?.id}
          milestone={bulkMilestone}
        />
      ) : null}

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

      {statusEntry && isStudyStatus ? (
        <StudySubmissionStatusManager
          key={`${statusRow.id}:${statusMilestone.key}`}
          open
          onClose={() => setStatusTarget(null)}
          data={statusRow}
          value={statusEntry.status}
          openForParticipation={statusEntry.isOpen}
          classId={myclass?.id}
          milestone={statusMilestone}
          stage={statusMilestone.title || statusMilestone.key}
        />
      ) : null}

      {statusEntry && !isStudyStatus ? (
        <SubmissionStatusManager
          key={`${statusRow.id}:${statusMilestone.key}`}
          open
          onClose={() => setStatusTarget(null)}
          data={statusRow}
          value={statusEntry.status}
          openForComments={statusEntry.isOpen}
          classId={myclass?.id}
          milestone={statusMilestone}
          stage={statusMilestone.title || statusMilestone.key}
        />
      ) : null}

      <div className="ag-theme-quartz dashboardGrid">
        <AgGridReact
          rowData={studentsProcessed}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          suppressRowClickSelection
          rowHeight={56}
          quickFilterText={search}
          overlayNoRowsTemplate={
            students.length
              ? t("dashboard.noStudentsOnTemplateBoard", {}, {
                  default:
                    "No students have a project from this template board yet.",
                })
              : t("dashboard.noStudentsYet", {}, {
                  default: "No students have joined this class yet.",
                })
          }
          getRowId={(params) => rowKey(params.data)}
          onSelectionChanged={(event) => {
            setSelectedRowKeys(event.api.getSelectedRows().map(rowKey));
          }}
          {...tablePrefs}
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

  /* Board picker, hint, milestone filter and search share one outline card. */
  .dashboardTools {
    height: auto;
  }

  .dashboardTools > .DesignSystem-Card-content {
    gap: 12px;
  }

  .dashboardSourceBar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    max-width: 100%;
    min-width: 0;
  }

  .dashboardSourceLabel {
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .dashboardEmpty {
    margin: 0;
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .dashboardHint {
    margin: 0;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  /* Milestone chips on top, search underneath. */
  .dashboardFilterBar {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
  }

  .dashboardFilterChips {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .dashboardFilterLabel {
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .dashboardSearch {
    width: 100%;
  }

  .dashboardToolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .dashboardToolbarLabel {
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .dashboardToolbarHint {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
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
