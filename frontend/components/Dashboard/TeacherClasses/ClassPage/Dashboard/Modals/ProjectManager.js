import { useMutation, useQuery } from "@apollo/client";
import { Modal, Icon, Dropdown, Button, Popup } from "semantic-ui-react";
import { useState } from "react";
import styled from "styled-components";
import Link from "next/link";

import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
import { CLASS_PROJECTS_QUERY } from "../../../../../Queries/Proposal";
import { DEFAULT_PROJECT_BOARDS } from "../../../../../Queries/Proposal";
import { ASSIGN_STUDENT_TO_PROJECT } from "../../../../../Mutations/Classes";
import { COPY_PROPOSAL_MUTATION } from "../../../../../Mutations/Proposal";
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";

import StyledClass from "../../../../../styles/StyledClass";

export default function ProjectManager(props) {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("");

  const projects = props?.data?.projects || [];
  const hasProjects = projects.length > 0;

  // Sort projects: main projects (isMain: true) at the top
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    return 0;
  });

  const { data: classProjectsData } = useQuery(CLASS_PROJECTS_QUERY, {
    variables: { classId: props?.classId },
  });
  const availableProjects = classProjectsData?.proposalBoards || [];

  const projectOptions =
    availableProjects
      ?.filter((project) => !projects.some((p) => p.id === project.id))
      ?.map((project) => ({
        key: project?.id,
        text: project?.title,
        value: project?.id,
      })) || [];

  const { data: proposalData } = useQuery(DEFAULT_PROJECT_BOARDS);
  const defaultProposalBoardId =
    proposalData?.proposalBoards?.map((p) => p?.id)[0] || [];

  const [assignStudent] = useMutation(ASSIGN_STUDENT_TO_PROJECT, {
    variables: { studentId: props?.data?.id },
    refetchQueries: [
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

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

  const [updateProject, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_PROJECT_BOARD, {
      refetchQueries: [
        {
          query: GET_STUDENTS_DASHBOARD_DATA,
          variables: { classId: props?.classId },
        },
      ],
    });

  const assignToProject = async () => {
    if (!projectId) {
      return alert("Select a project first");
    }
    let studyId;
    const p = availableProjects
      .filter((p) => p?.id === projectId)
      .map((p) => p?.study?.id);
    if (p && p.length) {
      studyId = p[0];
    }
    await assignStudent({
      variables: {
        input: {
          collaboratorInProposal: { connect: { id: projectId } },
        },
      },
    });
    setProjectId(null);
    setIsOpen(false);
  };

  const disconnectFromProject = async (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    const studyId = project?.study?.id;
    await assignStudent({
      variables: {
        input: {
          collaboratorInProposal: { disconnect: { id: projectId } },
        },
      },
    });
  };

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
    setProjectName("");
    setIsOpen(false);
  };

  const toggleProjectAsMain = async ({ projectId, isMain }) => {
    try {
      await updateProject({
        variables: {
          id: projectId,
          input: {
            isMain,
          },
        },
      });
    } catch (err) {
      console.error("Error toggling main project:", err);
    }
  };

  return (
    <Modal
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      open={isOpen}
      trigger={
        <StyledTriggerButton>
          <Icon name="book" />
          Manage Projects ({projects.length})
        </StyledTriggerButton>
      }
      dimmer="blurring"
      size="large"
      closeIcon
    >
      <StyledModal>
        <Modal.Content>
          <div className="modalHeader">
            <h1>Manage Projects for {props?.data?.username}</h1>
            <p>View, disconnect, or assign new projects for the student</p>
          </div>
          {updateError && (
            <Message negative>
              <Message.Header>Error</Message.Header>
              <p>Failed to update project status. Please try again.</p>
            </Message>
          )}
          <StyledClass>
            <div className="dashboard">
              <div className="manageModal">
                {hasProjects ? (
                  <div className="section">
                    <h2>Current Projects</h2>
                    <div className="project-list">
                      {sortedProjects.map((project) => (
                        <div
                          key={project.id}
                          className={
                            project?.isMain
                              ? `project-item main-project`
                              : `project-item`
                          }
                          isMain={project.isMain}
                        >
                          <div className="project-header">
                            <h3>{project.title}</h3>
                            <Popup
                              content={
                                project.isMain
                                  ? "This is the main project. Click to unset."
                                  : "Set this as the main project for the student."
                              }
                              trigger={
                                <div className="main-toggle-container">
                                  <Button
                                    toggle
                                    active={project?.isMain}
                                    onClick={() =>
                                      toggleProjectAsMain({
                                        projectId: project?.id,
                                        isMain: !project?.isMain,
                                      })
                                    }
                                    disabled={updateLoading}
                                    aria-label={`Set ${project?.title} as main project`}
                                    className="main-toggle"
                                  />
                                  <span className="toggle-label">
                                    {project.isMain
                                      ? "Main Project"
                                      : "Set as Main"}
                                  </span>
                                </div>
                              }
                            />
                          </div>
                          <div className="project-info">
                            <p>{project.study?.title || "No study assigned"}</p>
                            <div className="collaborators">
                              <strong>Collaborators:</strong>{" "}
                              {project.collaborators?.length > 0
                                ? project.collaborators
                                    .map((c) => c.username)
                                    .join(", ")
                                : "None"}
                            </div>
                            <div className="mentors">
                              <strong>Mentors:</strong>{" "}
                              {project.study?.collaborators?.filter((c) =>
                                c.permissions.some((p) => p.name === "MENTOR")
                              ).length > 0
                                ? project.study.collaborators
                                    .filter((c) =>
                                      c.permissions.some(
                                        (p) => p.name === "MENTOR"
                                      )
                                    )
                                    .map((c) => c.username)
                                    .join(", ")
                                : "None"}
                            </div>
                            <Link
                              href={`/builder/projects?selector=${project.id}`}
                              target="_blank"
                              className="project-link"
                            >
                              View Project Board
                            </Link>
                          </div>
                          <button
                            className="disconnect-button"
                            onClick={() => disconnectFromProject(project.id)}
                          >
                            Disconnect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="section empty-state">
                    <h2>No Projects Assigned</h2>
                    <p>This student is not assigned to any projects yet.</p>
                  </div>
                )}
                <div>
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
                      disabled={projectOptions.length === 0}
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

  .icon {
    margin: 0 !important;
  }
`;

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
      margin-bottom: 32px;
      padding: 20px;
      border-radius: 8px;
      background: #f9f9f9;

      h2 {
        font-size: 18px;
        font-weight: 600;
        color: #333333;
        margin-bottom: 16px;
      }

      &.empty-state {
        text-align: center;
        p {
          font-size: 16px;
          color: #666666;
        }
      }

      .project-list {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .project-item {
        display: flex;
        flex-direction: column;
        padding: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        background: ${(props) => (props.isMain ? "#e6f0fa" : "#ffffff")};
        transition: background 0.2s ease;

        &:hover {
          background: ${(props) => (props.isMain ? "#d6e4f5" : "#f5f5f5")};
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          h3 {
            font-size: 16px;
            font-weight: 600;
            color: #333333;
            margin: 0;
          }

          .main-toggle-container {
            display: flex;
            align-items: center;
            gap: 8px;

            .main-toggle {
              .ui.toggle.button {
                width: 60px;
                height: 30px;
                background-color: ${(props) =>
                  props.active ? "#3d85b0" : "#b0b0b0"};
                color: #ffffff;
                font-size: 14px;
                padding: 6px 12px;

                &:hover {
                  background-color: ${(props) =>
                    props.active ? "#326d94" : "#999999"};
                }

                &.disabled {
                  background-color: #d0d0d0;
                  cursor: not-allowed;
                }
              }
            }

            .toggle-label {
              font-size: 14px;
              font-weight: 600;
              color: ${(props) => (props.isMain ? "#3d85b0" : "#666666")};
            }
          }
        }

        .project-info {
          p {
            font-size: 14px;
            color: #666666;
            margin: 0 0 8px;
          }

          .collaborators,
          .mentors {
            font-size: 14px;
            color: #333333;
            margin: 0 0 8px;

            strong {
              color: #3d85b0;
            }
          }

          .project-link {
            display: inline-block;
            background: #3d85b0;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
            text-decoration: none;
            transition: all 0.2s ease;

            &:hover {
              background: #326d94;
            }
          }
        }

        .disconnect-button {
          background: #d32f2f;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          align-self: flex-end;
          margin-top: 12px;

          &:hover {
            background: #b71c1c;
          }
        }

        &.main-project {
          background: #e6f0fa;
          border: 2px solid #3d85b0;

          &:hover {
            background: #d6e4f5;
          }
        }
      }

      .project-dropdown {
        &.ui.dropdown {
          border: 1px solid #d0d0d0;
          border-radius: 6px;
          background: #ffffff;
          font-size: 16px;
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
              font-size: 16px;
            }
          }

          &:hover {
            border-color: #3d85b0;

            .dropdown.icon {
              color: #3d85b0;
            }
          }

          &.disabled {
            background: #f0f0f0;
            cursor: not-allowed;
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
