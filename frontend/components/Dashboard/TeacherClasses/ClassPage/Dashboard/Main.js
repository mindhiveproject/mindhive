import { useQuery } from "@apollo/client";
import { useState, useMemo } from "react";
import { Icon } from "semantic-ui-react";
import styled from "styled-components";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";
import { StudentPageLink } from "./Renderers/StudentPageLink";
import { ProjectManagerLink } from "./Renderers/ProjectManagerLink";
import { StudyManagerLink } from "./Renderers/StudyManagerLink";
import { SubmissionStatusLink } from "./Renderers/SubmissionStatusLink";
import { StudySubmissionStatusLink } from "./Renderers/StudySubmissionStatusLink";
import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../Queries/Classes";

import { SelectedStudentsModal } from "./Modals/SelectedStudents";

const countAndFormat = (arr) => {
  const counts = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
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
  return statuses?.length ? countAndFormat(statuses) : null;
};

export default function Dashboard({ myclass, user, query }) {
  const { data, loading, error } = useQuery(GET_STUDENTS_DASHBOARD_DATA, {
    variables: { classId: myclass?.id },
  });

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const students = data?.profiles || [];

  const studentsProcessed = students.map((student) => {
    const classProjects = student?.collaboratorInProposal?.filter(
      (project) => project?.usedInClass?.id === myclass?.id
    );

    let project,
      projects,
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
      dataCollectionStatus,
      dataCollectionOpenForParticipation,
      projectReportStatus,
      isProjectReportOpenForComments;

    if (classProjects && classProjects.length) {
      const mainProjects = classProjects.filter((p) => p?.isMain);
      project = (mainProjects.length && mainProjects[0]) || classProjects[0];
      projects = classProjects;
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
      dataCollectionStatus = project?.study?.dataCollectionStatus;
      dataCollectionOpenForParticipation = project?.study
        ?.dataCollectionOpenForParticipation
        ? "Open for participation"
        : "Not open for participation";
      projectReportStatus = project?.projectReportStatus;
      isProjectReportOpenForComments = project?.projectReportOpenForComments
        ? "Open for comments"
        : "Not open for comments";
    }

    const studies = student?.collaboratorInStudy?.filter((study) =>
      study?.classes?.map((cl) => cl?.id).includes(myclass?.id)
    );

    return {
      id: student?.id,
      publicId: student?.publicId,
      username: student?.username,
      project,
      projects,
      projectId,
      projectTitle,
      projectCollaborators,
      projectMentors,
      studies,
      studyId: studyId,
      studyTitle: studyTitle,
      studyCollaborators,
      proposalStatus,
      commentsReceivedOnProposal,
      isProposalOpenForComments,
      peerFeedbackStatus,
      isPeerFeedbackOpenForComments,
      dataCollectionStatus,
      dataCollectionOpenForParticipation,
      projectReportStatus,
      isProjectReportOpenForComments,
      projects,
    };
  });

  const columnDefs = useMemo(
    () => [
      {
        field: "selection",
        headerName: "",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 50,
        pinned: "left",
      },
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
      {
        field: "projectTitle",
        headerName: "Main Project",
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
      {
        field: "studyTitle",
        headerName: "Main Study",
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
        field: "dataCollectionStatus",
        cellRenderer: StudySubmissionStatusLink,
        cellRendererParams: {
          classId: myclass?.id,
          stage: "Data collection",
        },
      },
      { field: "dataCollectionOpenForParticipation" },
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
    ],
    [myclass]
  );

  return (
    <div className="dashboard">
      <div className="mb-4">
        <StyledTriggerButton
          onClick={() => setIsModalOpen(true)}
          disabled={selectedStudents.length === 0}
        >
          <Icon name="users" />
          Manage Selected Students ({selectedStudents.length})
        </StyledTriggerButton>
      </div>
      <SelectedStudentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedStudents={selectedStudents}
        classId={myclass?.id}
      />
      <div className="ag-theme-quartz" style={{ height: 500 }}>
        <AgGridReact
          rowData={studentsProcessed}
          columnDefs={columnDefs}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          getRowId={(params) =>
            params.data.id || params.data.publicId || params.data.username
          }
          onSelectionChanged={(event) => {
            const selectedRows = event.api.getSelectedRows();
            setSelectedStudents(selectedRows);
          }}
          frameworkComponents={{
            studentPageLink: StudentPageLink,
            projectManagerLink: ProjectManagerLink,
            studyManagerLink: StudyManagerLink,
            submissionStatusLink: SubmissionStatusLink,
            studySubmissionStatusLink: StudySubmissionStatusLink,
          }}
        />
      </div>
    </div>
  );
}

const StyledTriggerButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #3d85b0;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-family: Nunito, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #326d94;
  }

  &:disabled {
    background: #b0b0b0;
    cursor: not-allowed;
  }

  .icon {
    margin: 0 !important;
  }
`;
