import { useQuery } from "@apollo/client";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import {
  CLASS_PROJECTS_QUERY,
} from "../../../Queries/Proposal";
import ProjectsTemplatePanel from "./ProjectsTemplatePanel";
import ProjectsBoardEditor from "./ProjectsBoardEditor";
import ProjectsBoardCreate from "./ProjectsBoardCreate";

export default function ClassProjects({ myclass, user, query }) {
  const { t } = useTranslation("classes");
  const { action, board } = query || {};

  if (action === "edit" && board) {
    return (
      <ProjectsBoardEditor
        myclass={myclass}
        user={user}
        boardId={board}
      />
    );
  }

  if (action === "create") {
    return (
      <ProjectsBoardCreate
        myclass={myclass}
        query={query}
      />
    );
  }

  const { data } = useQuery(CLASS_PROJECTS_QUERY, {
    variables: { classId: myclass?.id },
  });

  const projects = data?.proposalBoards || [];

  const getCollaborators = (project) => {
    const names = [
      project?.author?.username,
      ...(project?.collaborators || []).map((c) => c?.username),
    ].filter(Boolean);
    return names.join(", ");
  };

  const columnDefs = [
    {
      field: "title",
      headerName: t("projects.projectTitle"),
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 2,
      minWidth: 180,
      wrapText: true,
      autoHeight: true,
      cellStyle: {
        whiteSpace: "normal",
        lineHeight: "1.5",
        display: "flex",
        alignItems: "center",
        wordBreak: "break-word",
      },
    },
    {
      field: "collaborators",
      headerName: t("projects.collaborators"),
      valueGetter: (params) => getCollaborators(params?.data),
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      minWidth: 160,
      wrapText: true,
      autoHeight: true,
      cellStyle: {
        whiteSpace: "normal",
        lineHeight: "1.5",
        display: "flex",
        alignItems: "center",
        wordBreak: "break-word",
      },
    },
    {
      field: "createdAt",
      headerName: t("projects.dateCreated"),
      valueGetter: (params) => params?.data?.createdAt || null,
      valueFormatter: (params) =>
        params.value ? moment(params.value).format("MMMM D, YYYY") : "",
      filter: "agDateColumnFilter",
      sortable: true,
      flex: 1,
      minWidth: 150,
    },
  ];

  return (
    <div className="classTabPage projects">
      <section className="classTabSection">
        <ProjectsTemplatePanel myclass={myclass} user={user} />
      </section>

      <section className="classTabSection">
        <div className="classTabSectionHeader">
          <h3>
            {t("projects.studentBoards", {}, { default: "Student boards" })}
          </h3>
          <p>
            {t(
              "projects.listDescription",
              { count: projects.length },
              {
                default: "{{count}} student project boards in this class.",
              }
            )}
          </p>
        </div>
        {projects.length === 0 ? (
          <div className="classTabEmpty">
            <div>{t("projects.noProjectsYet")}</div>
          </div>
        ) : (
          <div className="classTabTable ag-theme-quartz">
            <AgGridReact
              rowData={projects}
              columnDefs={columnDefs}
              getRowId={(params) => params.data?.id}
              pagination
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              autoSizeStrategy={{ type: "fitGridWidth", defaultMinWidth: 100 }}
              defaultColDef={{ resizable: true, sortable: true, filter: true }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
