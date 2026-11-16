import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import Button from "../../../DesignSystem/Button";
import Input from "../../../DesignSystem/Input";
import { AddIcon } from "../../../DesignSystem/Icons";
import { getClassTemplateBoards } from "../../../../lib/classTemplateBoards";
import { UPDATE_PROJECT_BOARD } from "../../../Mutations/Proposal";
import OwnedItemsShowcase from "./utils/OwnedItemsShowcase";
import { filterOwnedClassItems } from "./utils/ownedClassItems";
import { useClassTablePrefs } from "./useClassTablePrefs";
import {
  readClassTableOption,
  writeClassTableOption,
} from "./classPagePrefs";
import StudyCollaboratorsModal from "./StudyCollaboratorsModal";
import useRefetchOnFocus from "./useRefetchOnFocus";
import StudyMentorsModal from "./StudiesTab/StudyMentorsModal";
import NewStudyModal from "./StudiesTab/NewStudyModal";
import LinkStudyProjectModal from "./StudiesTab/LinkStudyProjectModal";
import {
  studyRefetchQueries,
  useClassStudyProjects,
  useClassTeachingStaff,
} from "./StudiesTab/studyProjects";
import {
  ParticipantLinkCell,
  ParticipantsCell,
  ProjectCell,
  StatusCell,
  StudyActionsCell,
  StudyBuilderCell,
  studyStatusOf,
} from "./StudiesTab/StudyCells";
import { SET_STUDY_DATA_COLLECTION } from "../../../Queries/Study";
import { DATA_COLLECTION_REFETCH } from "../../../Builder/shared/studyDataCollection/useStudyDataCollection";
import StudyDataCollectionDialog from "../../../Builder/shared/studyDataCollection/StudyDataCollectionDialog";
import DataCollectionMilestoneCard, {
  readMilestoneCardDismissed,
  writeMilestoneCardDismissed,
} from "./StudiesTab/DataCollectionMilestoneCard";
import { classFollowsDataCollection } from "../../../../lib/classDataCollection";

const STAGE_FILTERS = ["DESIGNING", "COLLECTING", "FINISHED"];

const WRAP_CELL = {
  whiteSpace: "normal",
  lineHeight: "1.5",
  display: "flex",
  alignItems: "center",
  wordBreak: "break-word",
};

const CENTER_CELL = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const NO_STUDIES = [];
const NO_MENTORS = new Set();

const CLICKABLE_CELL = {
  ...WRAP_CELL,
  cursor: "pointer",
  textDecoration: "underline",
  textDecorationColor: "var(--MH-Theme-Neutrals-Medium, #a1a1a1)",
  textUnderlineOffset: "3px",
};

export default function Studies({ myclass, user, query, readOnly = false }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const tablePrefs = useClassTablePrefs(myclass?.id, "studies", {
    defaultPageSize: 20,
  });
  const [collaboratorsStudyId, setCollaboratorsStudyId] = useState(null);
  const [mentorsStudyId, setMentorsStudyId] = useState(null);
  const [linkStudyId, setLinkStudyId] = useState(null);
  const [creatingStudy, setCreatingStudy] = useState(false);

  // `?study=` (from the dashboard's study chip) fills the search.
  const studyFromQuery =
    typeof query?.study === "string" ? query.study : "";
  const [search, setSearch] = useState(studyFromQuery);
  useEffect(() => {
    if (studyFromQuery) setSearch(studyFromQuery);
  }, [studyFromQuery]);

  const changeSearch = (next) => {
    setSearch(next);
    // Drop the param once the teacher edits the search, so a reload doesn't
    // bring the old search back.
    if (studyFromQuery && myclass?.code) {
      const { study, ...rest } = router.query;
      router.replace(
        { pathname: router.pathname, query: rest },
        undefined,
        { shallow: true }
      );
    }
  };

  const { projects, projectsByStudyId, participationByStudyId, mentorIds } =
    useClassStudyProjects(myclass, { skip: readOnly });
  // Students change their studies' status from their own screens.
  useRefetchOnFocus(
    ["GET_CLASS", "CLASS_DASHBOARD_PROJECTS_QUERY", "CLASS_DASHBOARD_STUDIES_QUERY"],
    { skip: readOnly }
  );
  const { staff } = useClassTeachingStaff(myclass, { skip: readOnly });

  // Study collaborators shown in the Mentors column instead of Collaborators:
  // the teaching team and any mentor of the class's projects and studies.
  const mentorSet = useMemo(
    () =>
      readOnly
        ? NO_MENTORS
        : new Set([...mentorIds, ...staff.map((p) => p.id)]),
    [readOnly, mentorIds, staff]
  );

  const [updateProject] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: studyRefetchQueries(myclass),
  });

  // Submit/finish/reopen/participation, on the study and every board linked
  // to it (keystone/lib/studyDataCollection.js).
  const [setDataCollection] = useMutation(SET_STUDY_DATA_COLLECTION, {
    refetchQueries: [...studyRefetchQueries(myclass), ...DATA_COLLECTION_REFETCH],
  });
  // Finishing (with a ticked box) and reopening are confirmed in the shared
  // dialog, which lists who the change affects; native confirm() is blocked
  // in some browsers.
  const [dialogFor, setDialogFor] = useState(null);
  const runDataCollection = useCallback(
    async (study, action, variables = {}) => {
      if (action === "FINISH" || action === "REOPEN") {
        setDialogFor({ study, mode: action });
        return;
      }
      try {
        await setDataCollection({
          variables: { studyId: study.id, action, ...variables },
        });
      } catch (err) {
        alert(err?.message);
      }
    },
    [setDataCollection, t]
  );

  // No project board template → students have no class projects to link,
  // so the Project column would always be empty.
  const hasProjectTemplate = getClassTemplateBoards(myclass).length > 0;

  const studies = myclass?.studies || NO_STUDIES;
  const ownedStudies =
    readOnly && user?.id
      ? filterOwnedClassItems(studies, user.id)
      : [];

  const classFollows = classFollowsDataCollection(myclass);
  const rows = useMemo(() => {
    const withProjects = studies.map((study) => {
      const linkedProjects = projectsByStudyId.get(study.id) || [];
      const studyStatus = studyStatusOf(study, linkedProjects, { classFollows });
      return {
        ...study,
        linkedProjects,
        participation: participationByStudyId.get(study.id) || null,
        studyStatus,
        statusRank: studyStatus.rank,
      };
    });
    return readOnly
      ? withProjects
      : withProjects.sort((a, b) => a.statusRank - b.statusRank);
  }, [studies, projectsByStudyId, participationByStudyId, readOnly, classFollows]);

  // The milestone card's stage chips filter the table (one stage at a time).
  // Remembered per class in a cookie; read after mount to keep SSR in sync.
  const [stageFilter, setStageFilterState] = useState(null);
  useEffect(() => {
    const saved = readClassTableOption(myclass?.id, "studies", "stageFilter");
    setStageFilterState(STAGE_FILTERS.includes(saved) ? saved : null);
  }, [myclass?.id]);
  const setStageFilter = useCallback(
    (next) => {
      setStageFilterState(next);
      writeClassTableOption(myclass?.id, "studies", "stageFilter", next);
    },
    [myclass?.id]
  );
  // A teacher may hide the milestone card from this tab; the same control
  // stays in the class Settings tab, which can show the card again.
  // Remembered per class in a cookie.
  const [milestoneCardDismissed, setMilestoneCardDismissed] = useState(false);
  useEffect(() => {
    setMilestoneCardDismissed(readMilestoneCardDismissed(myclass?.id));
  }, [myclass?.id]);
  const dismissMilestoneCard = useCallback(() => {
    setMilestoneCardDismissed(true);
    writeMilestoneCardDismissed(myclass?.id, true);
    // Its stage chips go with it: show every study again.
    setStageFilter(null);
  }, [myclass?.id, setStageFilter]);

  const stageCounts = useMemo(() => {
    const counts = { DESIGNING: 0, COLLECTING: 0, FINISHED: 0 };
    rows.forEach((row) => {
      const stage = row.studyStatus?.stage;
      if (stage in counts) counts[stage] += 1;
    });
    return counts;
  }, [rows]);
  const visibleRows = useMemo(
    () =>
      stageFilter
        ? rows.filter((row) => row.studyStatus?.stage === stageFilter)
        : rows,
    [rows, stageFilter]
  );

  // The author and collaborators, without the mentors (their own column).
  const getCollaborators = useCallback(
    (study) => {
      const collaboratorMap = new Map();
      [study?.author, ...(study?.collaborators || [])].forEach((profile) => {
        const key = profile?.id || profile?.username;
        const isMentor =
          profile?.id !== study?.author?.id && mentorSet.has(profile?.id);
        if (key && profile?.username && !isMentor) {
          collaboratorMap.set(key, profile.username);
        }
      });
      return Array.from(collaboratorMap.values()).join(", ");
    },
    [mentorSet]
  );

  const getMentors = useCallback(
    (study) =>
      [
        ...new Set(
          (study?.collaborators || [])
            .filter(
              (p) => p?.id !== study?.author?.id && mentorSet.has(p?.id)
            )
            .map((p) => p.username)
            .filter(Boolean)
        ),
      ].join(", "),
    [mentorSet]
  );

  const unlinkProject = useCallback(
    async (project, study) => {
      if (
        !window.confirm(
          t(
            "studies.unlinkProject.confirm",
            { study: study.title, project: project.title },
            {
              default:
                "Unlink “{{study}}” from the project “{{project}}”? The study and its collaborators are kept.",
            }
          )
        )
      ) {
        return;
      }
      try {
        await updateProject({
          variables: {
            id: project.id,
            input: { study: { disconnect: true } },
          },
        });
      } catch (error) {
        alert(error?.message);
      }
    },
    [t, updateProject]
  );

  const openLinkProject = useCallback((study) => setLinkStudyId(study.id), []);

  const columnDefs = useMemo(() => [
    {
      field: "title",
      headerName: t("studies.studyTitle"),
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 2,
      minWidth: 180,
      wrapText: true,
      autoHeight: true,
      cellStyle: WRAP_CELL,
    },
    ...(!readOnly
      ? [
          {
            colId: "status",
            headerName: t("studies.status.header", {}, { default: "Status" }),
            valueGetter: (params) => params?.data?.statusRank ?? 99,
            cellRenderer: StatusCell,
            cellRendererParams: { onDataCollection: runDataCollection },
            filter: false,
            sortable: true,
            flex: 0,
            minWidth: 230,
            autoHeight: true,
            cellStyle: { display: "flex", alignItems: "center" },
          },
        ]
      : []),
    ...(!readOnly && hasProjectTemplate
      ? [
          {
            colId: "project",
            headerName: t("studies.projectColumn", {}, { default: "Project" }),
            valueGetter: (params) =>
              (params?.data?.linkedProjects || [])
                .map((p) => p.title)
                .join(", "),
            cellRenderer: ProjectCell,
            filter: "agTextColumnFilter",
            sortable: true,
            flex: 1,
            minWidth: 180,
            autoHeight: true,
            cellStyle: {
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
            },
          },
        ]
      : []),
    {
      field: "collaborators",
      headerName: t("studies.collaborators"),
      valueGetter: (params) => getCollaborators(params?.data),
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      minWidth: 160,
      wrapText: true,
      autoHeight: true,
      onCellClicked: (params) => setCollaboratorsStudyId(params?.data?.id),
      tooltipValueGetter: () =>
        readOnly
          ? t("studies.viewCollaborators", {}, { default: "View collaborators" })
          : t("studies.manageCollaborators", {}, {
              default: "Manage collaborators",
            }),
      cellClass: "classTabClickableCell",
      cellStyle: CLICKABLE_CELL,
    },
    ...(!readOnly
      ? [
          {
            colId: "mentors",
            headerName: t("studies.mentorsColumn", {}, { default: "Mentors" }),
            valueGetter: (params) =>
              getMentors(params?.data) ||
              t("studies.addMentors", {}, { default: "Add mentors" }),
            filter: "agTextColumnFilter",
            sortable: true,
            flex: 1,
            minWidth: 160,
            wrapText: true,
            autoHeight: true,
            onCellClicked: (params) => setMentorsStudyId(params?.data?.id),
            tooltipValueGetter: () =>
              t("studies.manageMentors", {}, { default: "Manage mentors" }),
            cellClass: "classTabClickableCell",
            cellStyle: CLICKABLE_CELL,
          },
        ]
      : []),
    {
      field: "participants",
      headerName: t("studies.participants"),
      ...(readOnly
        ? {
            valueGetter: (params) => params?.data?.participantsCount ?? 0,
            minWidth: 120,
            maxWidth: 140,
          }
        : {
            // Sorts and filters on real participants; the cell shows both.
            valueGetter: (params) =>
              params?.data?.participation?.real ??
              params?.data?.participantsCount ??
              0,
            cellRenderer: ParticipantsCell,
            headerTooltip: t("studies.participation.headerHint", {}, {
              default:
                "Real participants took part while the study was collecting data and are not on the study team. Test participants are the team trying the study, or runs before data collection. Hover a count for details.",
            }),
            minWidth: 150,
            maxWidth: 180,
            cellStyle: { display: "flex", alignItems: "center" },
          }),
      filter: "agNumberColumnFilter",
      sortable: true,
      flex: 0,
    },
    {
      field: "createdAt",
      headerName: t("studies.dateCreated"),
      valueGetter: (params) => params?.data?.createdAt || null,
      valueFormatter: (params) =>
        params.value ? moment(params.value).format("MMMM D, YYYY") : "",
      filter: "agDateColumnFilter",
      sortable: true,
      flex: 1,
      minWidth: 150,
    },
    {
      field: "studyPage",
      headerName: t("studies.studyPage"),
      cellRenderer: ParticipantLinkCell,
      filter: false,
      sortable: false,
      flex: 0,
      minWidth: 150,
      maxWidth: 170,
      autoHeight: true,
      cellStyle: CENTER_CELL,
    },
    ...(!readOnly
      ? [
          {
            field: "studyBuilder",
            headerName: t("studies.studyBuilder"),
            cellRenderer: StudyBuilderCell,
            filter: false,
            sortable: false,
            flex: 0,
            minWidth: 180,
            maxWidth: 200,
            autoHeight: true,
            cellStyle: CENTER_CELL,
          },
          {
            colId: "actions",
            headerName: "",
            cellRenderer: StudyActionsCell,
            cellRendererParams: {
              onLinkProject: openLinkProject,
              onUnlinkProject: unlinkProject,
              onDataCollection: runDataCollection,
            },
            filter: false,
            sortable: false,
            resizable: false,
            flex: 0,
            width: 64,
            minWidth: 64,
            maxWidth: 64,
            autoHeight: true,
            cellStyle: CENTER_CELL,
          },
        ]
      : []),
  ], [
    t,
    readOnly,
    hasProjectTemplate,
    getCollaborators,
    getMentors,
    openLinkProject,
    runDataCollection,
    unlinkProject,
  ]);

  return (
    <div className="classTabPage studies">
      <section className="classTabSection">
        <div className="studiesTabTop">
          <div className="studiesTabIntro">
            <div className="classTabSectionHeader">
              <h3>{t("main.studies", {}, { default: "Studies" })}</h3>
              <p>
                {t(
                  "studies.listDescription",
                  { count: studies.length },
                  {
                    default:
                      "{{count}} studies created by students in this class.",
                  }
                )}
              </p>
            </div>
            <OwnedItemsShowcase
              items={ownedStudies}
              userId={user?.id}
              title={t("studies.yourStudies", {}, { default: "Your studies" })}
              description={t(
                "studies.yourStudiesDescription",
                { count: ownedStudies.length },
                {
                  default:
                    "{{count}} studies in this class that you authored or collaborate on.",
                }
              )}
              getHref={(study) =>
                study?.id ? `/builder/studies/?selector=${study.id}` : null
              }
              actionLabel={t("studies.openInBuilder", {}, {
                default: "Open in builder",
              })}
            />
            {studies.length > 0 || !readOnly ? (
              <div className="classTabActionBar">
                {!readOnly ? (
                  <Button
                    variant="filled"
                    leadingIcon={<AddIcon />}
                    onClick={() => setCreatingStudy(true)}
                  >
                    {t("studies.newStudy.button", {}, { default: "New study" })}
                  </Button>
                ) : null}
                {studies.length > 0 ? (
                  <div style={{ flex: "1 1 280px", maxWidth: 480, minWidth: 0 }}>
                    <Input
                      value={search}
                      onChange={changeSearch}
                      placeholder={t("studies.searchStudies", {}, {
                        default: "Search studies, projects or people",
                      })}
                      aria-label={t("studies.searchStudies", {}, {
                        default: "Search studies, projects or people",
                      })}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          {!readOnly && !milestoneCardDismissed ? (
            <DataCollectionMilestoneCard
              myclass={myclass}
              onDismiss={dismissMilestoneCard}
              counts={stageCounts}
              stageFilter={stageFilter}
              onStageFilter={setStageFilter}
            />
          ) : null}
        </div>
        {studies.length === 0 ? (
          <div className="classTabEmpty">
            <div>{t("studies.noStudiesYet")}</div>
          </div>
        ) : (
          <div className="classTabTable ag-theme-quartz">
            <AgGridReact
              domLayout="autoHeight"
              rowData={visibleRows}
              columnDefs={columnDefs}
              getRowId={(params) => params.data?.id}
              quickFilterText={search}
              pagination
              paginationPageSizeSelector={[10, 20, 50, 100]}
              defaultColDef={{ resizable: true, sortable: true, filter: true }}
              {...tablePrefs}
            />
          </div>
        )}
      </section>
      {collaboratorsStudyId && (
        <StudyCollaboratorsModal
          study={studies.find((s) => s?.id === collaboratorsStudyId)}
          classId={myclass?.id}
          readOnly={readOnly}
          mentorSet={mentorSet}
          onClose={() => setCollaboratorsStudyId(null)}
        />
      )}
      {mentorsStudyId && (
        <StudyMentorsModal
          study={studies.find((s) => s?.id === mentorsStudyId)}
          staff={staff}
          mentorSet={mentorSet}
          onClose={() => setMentorsStudyId(null)}
        />
      )}
      {linkStudyId && (
        <LinkStudyProjectModal
          myclass={myclass}
          study={studies.find((s) => s?.id === linkStudyId)}
          projects={projects}
          onClose={() => setLinkStudyId(null)}
        />
      )}
      {dialogFor && (
        <StudyDataCollectionDialog
          studyId={dialogFor.study.id}
          studyTitle={dialogFor.study.title}
          mode={dialogFor.mode}
          userId={user?.id}
          onClose={() => setDialogFor(null)}
        />
      )}
      {creatingStudy && (
        <NewStudyModal
          myclass={myclass}
          projects={projects}
          mentorIds={mentorIds}
          onClose={() => setCreatingStudy(false)}
          onCreated={(title) => setSearch(title)}
        />
      )}
    </div>
  );
}
