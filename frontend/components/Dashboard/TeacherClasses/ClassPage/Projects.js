import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font-family: Lato, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
  text-align: center;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  background: #ffffff;
  color: #5d5763;
  border: 1.5px solid #5d5763;

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

import {
  CLASS_PROJECTS_QUERY,
} from "../../../Queries/Proposal";
import ProjectsTemplatePanel from "./ProjectsTemplatePanel";
import ProjectsBoardEditor from "./ProjectsBoardEditor";
import CreateTemplateBoardModal from "./CreateTemplateBoardModal";

export default function ClassProjects({ myclass, user, query }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { action, board, template } = query || {};

  const closeCreateModal = () => {
    router.replace({
      pathname: `/dashboard/myclasses/${myclass?.code}`,
      query: { page: "projects" },
    });
  };

  if (action === "edit" && board) {
    return (
      <ProjectsBoardEditor
        myclass={myclass}
        user={user}
        boardId={board}
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
    return [...new Set(names)].join(", ");
  };

  const ProjectBoardRenderer = (params) => {
    const project = params?.data;
    if (!project?.id) return null;
    return (
      <LinkButton
        href={`/builder/projects?selector=${project.id}`}
        target="_blank"
        rel="noreferrer"
      >
        {t("projects.viewBoard", {}, { default: "View board" })}
      </LinkButton>
    );
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
    {
      field: "viewBoard",
      headerName: t("projects.viewBoard", {}, { default: "View board" }),
      cellRenderer: ProjectBoardRenderer,
      suppressFilter: true,
      sortable: false,
      flex: 0,
      minWidth: 130,
      maxWidth: 150,
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    },
  ];

  return (
    <div className="classTabPage projects">
      <CreateTemplateBoardModal
        open={action === "create"}
        onClose={closeCreateModal}
        myclass={myclass}
        user={user}
        initialTemplateId={template || null}
      />

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
