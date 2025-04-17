import { useMutation, useQuery } from "@apollo/client";
import { Modal, Icon, Dropdown } from "semantic-ui-react";
import { useState } from "react";
import styled from "styled-components";

import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
import { GET_CLASS } from "../../../../../Queries/Classes";
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";
import { CREATE_STUDY, UPDATE_STUDY } from "../../../../../Mutations/Study";

import StyledClass from "../../../../../styles/StyledClass";

export default function ProjectManager(props) {
  const [isOpen, setIsOpen] = useState(false);
  const [studyId, setStudyId] = useState("");
  const [studyName, setStudyName] = useState("");
  const [projectId, setProjectId] = useState(props?.data?.projectId);

  const projectOptions =
    props?.data?.projects.map((project) => ({
      key: project?.id,
      text: project?.title,
      value: project?.id,
    })) || [];

  const { data: dataClass } = useQuery(GET_CLASS, {
    variables: { code: props?.classCode },
  });

  const studies = dataClass?.class?.studies || [];
  const studyOptions =
    studies?.map((study) => ({
      key: study?.id,
      text: study?.title,
      value: study?.id,
    })) || [];

  const [updateProject] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

  const [updateStudy] = useMutation(UPDATE_STUDY, {
    refetchQueries: [
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

  const [createStudy] = useMutation(CREATE_STUDY, {
    refetchQueries: [
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

  const assignToStudy = async () => {
    if (!studyId) {
      return alert("Select the study first");
    }

    if (projectId) {
      await updateStudy({
        variables: {
          id: studyId,
          input: {
            proposal: {
              connect: {
                id: projectId,
              },
            },
            collaborators: {
              connect: props?.data?.project?.collaborators.map((c) => ({
                id: c?.id,
              })),
            },
          },
        },
      });
    } else {
      await updateStudy({
        variables: {
          id: studyId,
          input: {
            collaborators: {
              connect: { id: props?.data?.id },
            },
          },
        },
      });
    }

    setIsOpen(false);
  };

  const createNewStudy = async () => {
    if (!studyName) {
      return alert("Give the study a name first");
    }

    if (projectId) {
      await updateProject({
        variables: {
          id: projectId,
          input: {
            study: {
              create: {
                title: studyName,
                classes: {
                  connect: {
                    id: props?.classId,
                  },
                },
                collaborators: {
                  connect: props?.data?.project?.collaborators.map((c) => ({
                    id: c?.id,
                  })),
                },
              },
            },
          },
        },
      });
    } else {
      await createStudy({
        variables: {
          input: {
            title: studyName,
            classes: {
              connect: {
                id: props?.classId,
              },
            },
            collaborators: {
              connect: { id: props?.data?.id },
            },
          },
        },
      });
    }

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
            <h1>Manage Study for {props?.data?.username}</h1>
            <p>Assign or create a study for the student's project</p>
          </div>
          <StyledClass>
            <div className="dashboard">
              {projectOptions.length > 1 && (
                <div className="section">
                  <h2>Select Project</h2>
                  <Dropdown
                    selection
                    search
                    options={projectOptions}
                    value={projectId}
                    onChange={(e, data) => setProjectId(data?.value)}
                    fluid
                    className="project-dropdown"
                    placeholder="Select a project"
                  />
                </div>
              )}
              <div className="manageModal">
                <div className="section">
                  <h2>Assign to Existing Study</h2>
                  <Dropdown
                    selection
                    search
                    options={studyOptions}
                    value={studyId}
                    onChange={(e, data) => setStudyId(data?.value)}
                    fluid
                    className="study-dropdown"
                    placeholder="Select a study"
                  />
                </div>
                <div className="section">
                  <h2>Create New Study</h2>
                  <input
                    type="text"
                    name="studyName"
                    placeholder="Enter the name of the new study"
                    value={studyName}
                    onChange={(e) => setStudyName(e?.target?.value)}
                    className="study-input"
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
              onClick={assignToStudy}
              disabled={!studyId}
            >
              Assign to Study
            </button>
            <button
              className="action-button"
              onClick={createNewStudy}
              disabled={!studyName}
            >
              Create Study
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

      .project-dropdown,
      .study-dropdown {
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
           734}
          }
        }
      }

      .study-input {
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
