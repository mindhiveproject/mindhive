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
import { StudyManagerLink } from "./Renderers/StudyManagerLink";
import { SubmissionStatusLink } from "./Renderers/SubmissionStatusLink";

const countAndFormat = (arr) => {
  // First count occurrences
  const counts = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});

  // Convert to string format
  return Object.entries(counts)
    .map(([value, count]) => `${value}:${count}`)
    .join(", ");
};

const aggregateProposalFeedback = ({ project }) => {
  const statuses = project?.reviews
    ?.filter((review) => review?.stage === "SUBMITTED_AS_PROPOSAL")
    .map((review) =>
      review?.content
        .filter((question) => question?.responseType === "selectOne")
        .map((question) => question?.answer)
    )
    .flat();
  let res;
  if (statuses && statuses.length) {
    res = countAndFormat(statuses);
  }
  return res;
};

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
      projectCollaborators,
      projectMentors,
      studyId,
      studyTitle,
      studyCollaborators,
      proposalStatus,
      commentsReceivedOnProposal,
      isProposalOpenForComments,
      peerFeedbackStatus,
      isPeerFeedbackOpenForComments,
      projectReportStatus,
      isProjectReportOpenForComments;

    if (projects && projects.length) {
      const mainProjects = projects.filter((p) => p?.isMain);
      project = (mainProjects.length && mainProjects[0]) || projects[0];
      projectId = project?.id;
      projectTitle = project?.title;
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
      proposalStatus = project?.submitProposalStatus;
      commentsReceivedOnProposal = aggregateProposalFeedback({ project });
      isProposalOpenForComments = project?.submitProposalOpenForComments
        ? "Open for comments"
        : "Not open for comments";
      peerFeedbackStatus = project?.peerFeedbackStatus;
      isPeerFeedbackOpenForComments = project?.peerFeedbackOpenForComments
        ? "Open for comments"
        : "Not open for comments";
      projectReportStatus = project?.projectReportStatus;
      isProjectReportOpenForComments = project?.projectReportOpenForComments
        ? "Open for comments"
        : "Not open for comments";
    }

    return {
      id: student?.id,
      publicId: student?.publicId,
      username: student?.username,
      project,
      projectId,
      projectTitle,
      projectCollaborators,
      projectMentors,
      studyId,
      studyTitle,
      studyCollaborators,
      proposalStatus,
      commentsReceivedOnProposal,
      isProposalOpenForComments,
      peerFeedbackStatus,
      isPeerFeedbackOpenForComments,
      projectReportStatus,
      isProjectReportOpenForComments,
      projects,
    };
  });

  const [colDefs, setColDefs] = useState([
    {
      field: "username",
      pinned: "left",
      headerName: "Username",
      cellRenderer: StudentPageLink,
      cellRendererParams: {
        baseUrl: "/students",
      },
    },
    {
      field: "projectTitle",
      headerName: "Create | Manage Project",
      cellRenderer: ProjectManagerLink,
      cellRendererParams: {
        classId: myclass?.id,
        classProposalBoardId: myclass?.templateProposal?.id,
      },
    },
    { field: "projectCollaborators" },
    { field: "projectMentors" },
    {
      field: "studyTitle",
      headerName: "Create | Manage Study",
      cellRenderer: StudyManagerLink,
      cellRendererParams: {
        classId: myclass?.id,
        classProposalBoardId: myclass?.templateProposal?.id,
        classCode: myclass?.code,
      },
    },
    { field: "studyCollaborators" },
    {
      field: "proposalStatus",
      cellRenderer: SubmissionStatusLink,
      cellRendererParams: {
        classId: myclass?.id,
        type: "submitProposalStatus",
        stage: "Proposal review",
        commentField: "submitProposalOpenForComments",
      },
    },
    { field: "commentsReceivedOnProposal" },
    { field: "isProposalOpenForComments" },
    {
      field: "peerFeedbackStatus",
      cellRenderer: SubmissionStatusLink,
      cellRendererParams: {
        classId: myclass?.id,
        type: "peerFeedbackStatus",
        stage: "Peer review",
        commentField: "peerFeedbackOpenForComments",
      },
    },
    { field: "isPeerFeedbackOpenForComments" },
    {
      field: "projectReportStatus",
      cellRenderer: SubmissionStatusLink,
      cellRendererParams: {
        classId: myclass?.id,
        type: "projectReportStatus",
        stage: "Project report",
        commentField: "projectReportOpenForComments",
      },
    },
    { field: "isProjectReportOpenForComments" },
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
            projectManagerLink: ProjectManagerLink,
            studyManagerLink: StudyManagerLink,
            submissionStatusLink: SubmissionStatusLink,
          }}
        />
      </div>
    </div>
  );
}
