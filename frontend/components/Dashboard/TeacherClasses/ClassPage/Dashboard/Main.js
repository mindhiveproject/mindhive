import Link from "next/link";
import { useQuery } from "@apollo/client";
import { useState } from "react";

import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../Queries/Classes";

// Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-grid.css";
// Optional Theme applied to the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
// React Data Grid Component
import { AgGridReact } from "ag-grid-react";

// Renderers
import { StudentPageLink } from "./Renderers/StudentPageLink";
import { ProjectManagerLink } from "./Renderers/ProjectManagerLink";

export default function Dashboard({ myclass, user, query }) {
  const { data, loading, error } = useQuery(GET_STUDENTS_DASHBOARD_DATA, {
    variables: { classId: myclass?.id },
  });

  const students = data?.profiles || [];

  const studentsProcessed = students.map((student) => {
    const projects = student?.collaboratorInProposal?.filter(
      (project) => project?.usedInClass?.id === myclass?.id
    );

    let project,
      projectId,
      projectTitle,
      projectStatus,
      projectCollaborators,
      projectMentors,
      studyId,
      studyTitle,
      studyCollaborators;
    if (projects && projects.length) {
      project = projects[0];
      projectId = project?.id;
      projectTitle = project?.title;
      projectStatus = project?.status;
      projectCollaborators = project?.collaborators
        ?.filter((c) => c?.permissions?.map((p) => p?.name).includes("STUDENT"))
        .map((c) => c?.username);
      projectMentors = project?.collaborators
        ?.filter((c) => c?.permissions?.map((p) => p?.name).includes("MENTOR"))
        ?.map((c) => c?.username);
      studyId = project?.study?.id;
      studyTitle = project?.study?.title;
      studyCollaborators = project?.study?.collaborators
        ?.filter((c) => c?.permissions?.map((p) => p?.name).includes("STUDENT"))
        .map((c) => c?.username);
    }

    return {
      username: student?.username,
      projectId,
      projectTitle,
      projectStatus,
      projectCollaborators,
      projectMentors,
      studyId,
      studyTitle,
      studyCollaborators,
    };
  });

  console.log({ students });

  const [colDefs, setColDefs] = useState([
    {
      field: "username",
      headerName: "Username",
      cellRenderer: StudentPageLink,
      cellRendererParams: {
        baseUrl: "/students",
      },
    },
    {
      field: "projectTitle",
      headerName: "Create | Manage Project",
      cellRenderer: ProjectManagerLink,
    },
    { field: "projectStatus" },
    { field: "projectCollaborators" },
    { field: "projectMentors" },
    { field: "studyTitle" },
    { field: "studyCollaborators" },
  ]);

  return (
    <div className="dashboard">
      <div
        className="ag-theme-quartz" // applying the Data Grid theme
        style={{ height: 500 }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact
          rowData={studentsProcessed}
          columnDefs={colDefs}
          frameworkComponents={{
            studentPageLink: StudentPageLink,
          }}
        />
      </div>
    </div>
  );
}
