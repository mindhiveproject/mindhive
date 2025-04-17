import { useMutation, useQuery } from "@apollo/client";
import { Modal, Icon, Dropdown } from "semantic-ui-react";
import { useState } from "react";
import styled from "styled-components";

import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
import { CLASS_PROJECTS_QUERY } from "../../../../../Queries/Proposal";
import { DEFAULT_PROJECT_BOARDS } from "../../../../../Queries/Proposal";
import { ASSIGN_STUDENT_TO_PROJECT } from "../../../../../Mutations/Classes";
import { COPY_PROPOSAL_MUTATION } from "../../../../../Mutations/Proposal";

import StyledClass from "../../../../../styles/StyledClass";

export default function ProjectManager(props) {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");

  const { data: classProjectsData } = useQuery(CLASS_PROJECTS_QUERY, {
    variables: { classId: props?.classId },
  });
  const projects = classProjectsData?.proposalBoards || [];

  const projectOptions =
    projects?.map((project) => ({
      key: project?.id,
      text: project?.title,
      value: project?.id,
    })) || [];

  const { data: proposalData } = useQuery(DEFAULT_PROJECT_BOARDS);
  const defaultProposalBoardId =
    proposalData?.proposalBoards?.map((p) => p?.id)[0] || [];

  const [updateStudent] = useMutation(ASSIGN_STUDENT_TO_PROJECT, {
    variables: { studentId: props?.data?.id },
    refetchQueries: [
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

  const assignToProject = async () => {
    if (!projectId) {
      return alert("Select the project first");
    }
    let studyId;
    const p = projects
      .filter((p) => p?.id === projectId)
      .map((p) => p?.study?.id);
    if (p && p.length) {
      studyId = p[0];
    }
    await updateStudent({
      variables: {
        input: {
          collaboratorInProposal: { connect: { id: projectId } },
          collaboratorInStudy: studyId ? { connect: { id: studyId } } : null,
        },
      },
    });
    setIsOpen(false);
  };

  const [copyProposal] = useMutation(COPY_PROPOSAL_MUTATION, {
    variables: {},
    refetchQueries: [
      { query: CLASS_PROJECTS_QUERY, variables: { classId: props?.classId } },
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

  const createNewProject = async () => {
    if (!projectName) {
      return alert("Give the project a name first");
    }
    await copyProposal({
      variables: {
        id: props?.classProposalBoardId || defaultProposalBoardId,
        title: projectName,
        classIdUsed: props?.classId,
        collaborators: [props?.data?.id],
      },
    });
    setIsOpen(false);
  };

  return (
    <Modal
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      open={isOpen}
      trigger={<div>Create</div>}
      dimmer="blurring"
      size="large"
      closeIcon
    >
      <StyledModal>
        <Modal.Content>
          <div className="modalHeader">
            <h1>Manage Project for {props?.data?.username}</h1>
            <p>Assign or create a project for the student</p>
          </div>
          <StyledClass>
            <div className="dashboard">
              <div className="manageModal">
                <div className="section">
                  <h2>Assign to Existing Project</h2>
                  <Dropdown
                    selection
                    options={projectOptions}
                    value={projectId}
                    onChange={(e, data) => setProjectId(data?.value)}
                    fluid
                    className="project-dropdown"
                    placeholder="Select a project"
                  />
                </div>
                <div className="section">
                  <h2>Create New Project</h2>
                  <input
                    type="text"
                    name="projectName"
                    placeholder="Enter the name of the new project"
                    value={projectName}
                    onChange={(e) => setProjectName(e?.target?.value)}
                    className="project-input"
                  />
                </div>
              </div>
            </div>
          </StyledClass>
          <div className="footer">
            <button className="cancel-button" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
            <button
              className="action-button"
              onClick={assignToProject}
              disabled={!projectId}
            >
              Assign to Project
            </button>
            <button
              className="action-button"
              onClick={createNewProject}
              disabled={!projectName}
            >
              Create Project
            </button>
          </div>
        </Modal.Content>
      </StyledModal>
    </Modal>
  );
}

const StyledModal = styled.div`
  font-family: Nunito, sans-serif !important;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin: 0 auto;

  .modalHeader {
    text-align: center;
    margin-bottom: 24px;

    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #333333;
      margin: 0 0 8px;
    }

    p {
      font-size: 16px;
      color: #666666;
      margin: 0;
    }
  }

  .dashboard {
    .section {
      margin-bottom: 24px;
      padding: 16px;
      border-radius: 8px;
      background: #f9f9f9;

      h2 {
        font-size: 18px;
        font-weight: 600;
        color: #333333;
        margin-bottom: 12px;
      }

      .project-dropdown {
        &.ui.dropdown {
          border: 1px solid #d0d0d0;
          border-radius: 6px;
          background: #ffffff;
          font-size: 16px; /* Increased font size */
          color: #333333;
          padding: 10px;

          .dropdown.icon {
            color: #666666;
            top: 50%;
            transform: translateY(-50%);
            right: 10px;
          }

          .menu {
            .item {
              font-size: 16px; /* Increased font size for menu items */
            }
          }

          &:hover {
            border-color: #3d85b0;

            .dropdown.icon {
              color: #3d85b0;
            }
          }
        }
      }

      .project-input {
        width: 100%;
        border: 1px solid #d0d0d0;
        border-radius: 6px;
        padding: 10px;
        font-size: 16px;
        color: #333333;
        font-family: Nunito, sans-serif;

        &:focus {
          outline: none;
          border-color: #3d85b0;
        }
      }
    }
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;

    .cancel-button {
      background: #ffffff;
      border: 1px solid #d0d0d0;
      border-radius: 6px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      color: #666666;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #f5f5f5;
        color: #333333;
      }
    }

    .action-button {
      background: #3d85b0;
      border: none;
      border-radius: 6px;
      padding: 10px 20px;
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
    }
  }
`;
