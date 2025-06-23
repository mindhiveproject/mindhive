import { useMutation, useQuery } from "@apollo/client";
import { Modal, Icon, Dropdown, Button } from "semantic-ui-react";
import { useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
import { GET_CLASS } from "../../../../../Queries/Classes";
import { UPDATE_STUDY, CREATE_STUDY } from "../../../../../Mutations/Study";
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";

import StyledClass from "../../../../../styles/StyledClass";

export default function StudyManager(props) {
  const { t } = useTranslation("builder");
  const [isOpen, setIsOpen] = useState(false);
  const [studyId, setStudyId] = useState(null);
  const [studyName, setStudyName] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedStudyForProject, setSelectedStudyForProject] = useState(null);

  const projectId = props?.data?.projectId;
  const hasProject = !!projectId;
  const project = props?.data?.projects?.find((p) => p.id === projectId);
  const mainProjectStudy = project?.study;
  const collaboratorStudies = props?.data?.studies || [];
  const hasCollaboratorStudies = collaboratorStudies.length > 0;

  const { data: classData } = useQuery(GET_CLASS, {
    variables: { code: props?.classCode },
  });
  const availableStudies = classData?.class?.studies || [];

  // Include all class studies, including those where the student is a collaborator
  const studyOptions =
    availableStudies?.map((study) => ({
      key: study?.id,
      text: study?.title,
      value: study?.id,
    })) || [];

  const [assignStudentToStudy] = useMutation(UPDATE_STUDY, {
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
      {
        query: GET_CLASS,
        variables: { code: props?.classCode },
      },
    ],
  });

  const [updateProject] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

  const assignToStudy = async () => {
    if (!studyId) {
      return alert("Select a study first");
    }

    if (hasProject) {
      setSelectedStudyForProject(studyId);
      setIsConfirmModalOpen(true);
    } else {
      await assignStudentToStudy({
        variables: {
          id: studyId,
          input: {
            collaborators: {
              connect: { id: props?.data?.id },
            },
          },
        },
      });
      setStudyId(null);
      setIsOpen(false);
    }
  };

  const confirmStudyConnection = async () => {
    try {
      await assignStudentToStudy({
        variables: {
          id: selectedStudyForProject,
          input: {
            proposal: {
              connect: {
                id: projectId,
              },
            },
            collaborators: {
              connect: project?.collaborators.map((c) => ({
                id: c?.id,
              })),
            },
          },
        },
      });
      setIsConfirmModalOpen(false);
      setSelectedStudyForProject(null);
      setStudyId(null);
      setIsOpen(false);
    } catch (error) {
      console.error("Error connecting study to project:", error);
      alert("Failed to connect study to project");
      setIsConfirmModalOpen(false);
      setSelectedStudyForProject(null);
    }
  };

  const cancelStudyConnection = () => {
    setIsConfirmModalOpen(false);
    setSelectedStudyForProject(null);
  };

  const createNewStudy = async () => {
    if (!studyName) {
      return alert("Give the study a name first");
    }

    if (hasProject) {
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
                  connect: project?.collaborators.map((c) => ({
                    id: c?.id,
                  })),
                },
                settings: {
                  forbidRetake: true,
                  hideParticipateButton: false,
                  showEmailNotificationPropmt: false,
                  askStudentsNYC: false,
                  zipCode: false,
                  guestParticipation: true,
                  consentObtained: false,
                  proceedToFirstTask: true,
                  useExternalDevices: false,
                  sonaId: false,
                  minorsBlocked: false,
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
            settings: {
              forbidRetake: true,
              hideParticipateButton: false,
              showEmailNotificationPropmt: false,
              askStudentsNYC: false,
              zipCode: false,
              guestParticipation: true,
              consentObtained: false,
              proceedToFirstTask: true,
              useExternalDevices: false,
              sonaId: false,
              minorsBlocked: false,
            },
          },
        },
      });
    }
    setStudyName("");
    setIsOpen(false);
  };

  const disconnectFromStudy = async (studyId) => {
    await assignStudentToStudy({
      variables: {
        id: studyId,
        input: {
          collaborators: {
            disconnect: { id: props?.data?.id },
          },
        },
      },
    });
  };

  const disconnectMainProjectStudy = async () => {
    if (!mainProjectStudy) return;

    try {
      await updateProject({
        variables: {
          id: projectId,
          input: {
            study: {
              disconnect: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error disconnecting main project study:", error);
      alert("Failed to disconnect study from project");
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
          {t("studyManager.manageStudies", { count: collaboratorStudies.length })}
        </StyledTriggerButton>
      }
      dimmer="blurring"
      size="large"
      closeIcon
    >
      <StyledModal>
        <Modal.Content>
          <div className="modalHeader">
            <h1>{t("studyManager.manageStudiesFor", { username: props?.data?.username })}</h1>
            <p>{t("studyManager.viewCreateAssign")}</p>
          </div>
          <StyledClass>
            <div className="dashboard">
              <div className="manageModal">
                {hasProject && (
                  <div className="section">
                    <h2>{t("studyManager.mainProjectStudy")}</h2>
                    {mainProjectStudy ? (
                      <div className="study-item main-study">
                        <div className="study-info">
                          <h3>{mainProjectStudy.title}</h3>
                          <p>{t("studyManager.connectedToProject", { project: project?.title })}</p>
                          <div className="collaborators">
                            <strong>{t("studyManager.collaborators")}</strong>{" "}
                            {mainProjectStudy.collaborators?.length > 0
                              ? mainProjectStudy.collaborators
                                  .map((c) => c.username)
                                  .join(", ")
                              : t("studyManager.none")}
                          </div>
                          <div className="mentors">
                            <strong>{t("studyManager.mentors")}</strong>{" "}
                            {mainProjectStudy.collaborators?.filter((c) =>
                              c.permissions.some((p) => p.name === "MENTOR")
                            ).length > 0
                              ? mainProjectStudy.collaborators
                                  .filter((c) =>
                                    c.permissions.some(
                                      (p) => p.name === "MENTOR"
                                    )
                                  )
                                  .map((c) => c.username)
                                  .join(", ")
                              : t("studyManager.none")}
                          </div>
                          <Link
                            href={`/builder/projects?selector=${project.id}&tab=builder`}
                            target="_blank"
                            className="study-link"
                          >
                            {t("studyManager.viewStudy")}
                          </Link>
                        </div>
                        <button
                          className="disconnect-button"
                          onClick={disconnectMainProjectStudy}
                        >
                          {t("studyManager.disconnect")}
                        </button>
                      </div>
                    ) : (
                      <p>
                        {t("studyManager.noStudyConnected")}
                      </p>
                    )}
                  </div>
                )}
                {hasCollaboratorStudies ? (
                  <div className="section">
                    <h2>{t("studyManager.collaboratorStudies")}</h2>
                    <div className="study-list">
                      {collaboratorStudies
                        .filter(
                          (study) =>
                            !mainProjectStudy ||
                            study.id !== mainProjectStudy.id
                        )
                        .map((study) => (
                          <div key={study.id} className="study-item">
                            <div className="study-info">
                              <h3>{study.title}</h3>
                              <div className="collaborators">
                                <strong>{t("studyManager.collaborators")}</strong>{" "}
                                {study.collaborators?.length > 0
                                  ? study.collaborators
                                      .map((c) => c.username)
                                      .join(", ")
                                  : t("studyManager.none")}
                              </div>
                              <div className="mentors">
                                <strong>{t("studyManager.mentors")}</strong>{" "}
                                {study.collaborators?.filter((c) =>
                                  c.permissions.some((p) => p.name === "MENTOR")
                                ).length > 0
                                  ? study.collaborators
                                      .filter((c) =>
                                        c.permissions.some(
                                          (p) => p.name === "MENTOR"
                                        )
                                      )
                                      .map((c) => c.username)
                                      .join(", ")
                                  : t("studyManager.none")}
                              </div>
                              <Link
                                href={`/builder/studies?selector=${study.id}`}
                                target="_blank"
                                className="study-link"
                              >
                                {t("studyManager.viewStudy")}
                              </Link>
                            </div>
                            <button
                              className="disconnect-button"
                              onClick={() => disconnectFromStudy(study.id)}
                            >
                              {t("studyManager.removeCollaborator")}
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  !mainProjectStudy && (
                    <div className="section empty-state">
                      <h2>{t("studyManager.noCollaboratorStudiesAssigned")}</h2>
                      <p>
                        {t("studyManager.notAssignedToAnyStudies")}
                      </p>
                    </div>
                  )
                )}
                {hasProject ? (
                  <>
                    <div className="section">
                      <h2>{t("studyManager.project")}</h2>
                      <div className="project-info">
                        <p>
                          <strong>{t("studyManager.title")}</strong>{" "}
                          {project?.title || t("studyManager.unknownProject")}
                        </p>
                        <p>
                          <strong>{t("studyManager.collaborators")}</strong>{" "}
                          {project?.collaborators
                            ?.map((c) => c.username)
                            .join(", ") || t("studyManager.none")}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="section">
                        <h2>
                          {mainProjectStudy
                            ? t("studyManager.reassignToAnotherStudy")
                            : t("studyManager.assignToExistingStudy")}
                        </h2>
                        <p>
                          {mainProjectStudy
                            ? t("studyManager.selectDifferentStudy")
                            : t("studyManager.chooseExistingStudy")}
                        </p>
                        <Dropdown
                          selection
                          search
                          options={studyOptions}
                          value={studyId}
                          onChange={(e, data) => setStudyId(data?.value)}
                          fluid
                          className="study-dropdown"
                          placeholder={t("studyManager.selectAStudy")}
                          disabled={studyOptions.length === 0}
                        />
                      </div>
                      <div className="section">
                        <h2>{t("studyManager.createNewStudy")}</h2>
                        <p>{t("studyManager.createNewStudyToConnect")}</p>
                        <input
                          type="text"
                          name="studyName"
                          placeholder={t("studyManager.enterNewStudyName")}
                          value={studyName}
                          onChange={(e) => setStudyName(e?.target?.value)}
                          className="study-input"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="section">
                    <h2>{t("studyManager.createNewStudy")}</h2>
                    <p>
                      {t("studyManager.noProjectAssigned")}
                    </p>
                    <input
                      type="text"
                      name="studyName"
                      placeholder={t("studyManager.enterNewStudyName")}
                      value={studyName}
                      onChange={(e) => setStudyName(e?.target?.value)}
                      className="study-input"
                    />
                  </div>
                )}
              </div>
            </div>
          </StyledClass>
          <div className="footer">
            <button className="cancel-button" onClick={() => setIsOpen(false)}>
              {t("studyManager.cancel")}
            </button>
            {hasProject && (
              <button
                className="action-button"
                onClick={assignToStudy}
                disabled={!studyId}
              >
                {mainProjectStudy ? t("studyManager.reassignStudy") : t("studyManager.assignToStudy")}
              </button>
            )}
            <button
              className="action-button"
              onClick={createNewStudy}
              disabled={!studyName}
            >
              {t("studyManager.createStudy")}
            </button>
          </div>
        </Modal.Content>
      </StyledModal>
      {hasProject && (
        <StyledConfirmModal
          open={isConfirmModalOpen}
          onClose={cancelStudyConnection}
          size="tiny"
        >
          <Modal.Header>{t("studyManager.confirmStudyConnection")}</Modal.Header>
          <Modal.Content>
            <Modal.Description>
              {t("studyManager.confirmStudyConnectionDesc", {
                action: mainProjectStudy ? t("studyManager.reassign") : t("studyManager.connect"),
                project: project?.title
              })}
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={cancelStudyConnection} className="cancel-button">
              {t("studyManager.cancel")}
            </Button>
            <Button
              onClick={confirmStudyConnection}
              className="confirm-button"
              primary
            >
              {t("studyManager.confirm")}
            </Button>
          </Modal.Actions>
        </StyledConfirmModal>
      )}
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

      .project-info {
        p {
          font-size: 14px;
          color: #333333;
          margin-bottom: 8px;

          strong {
            color: #3d85b0;
          }
        }
      }

      .study-list {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .study-item {
        display: flex;
        flex-direction: column;
        padding: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        background: #ffffff;
        transition: background 0.2s ease;

        &:hover {
          background: #f5f5f5;
        }

        &.main-study {
          background: #e6f0fa;
          border: 2px solid #3d85b0;

          &:hover {
            background: #d6e4f5;
          }
        }

        .study-info {
          h3 {
            font-size: 16px;
            font-weight: 600;
            color: #333333;
            margin: 0 0 8px;
          }

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

          .study-link {
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
      }

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
            }
          }

          &.disabled {
            background: #f0f0f0;
            cursor: not-allowed;
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

const StyledConfirmModal = styled(Modal)`
  font-family: Nunito, sans-serif !important;

  .header {
    font-size: 18px !important;
    font-weight: 600 !important;
    color: #333333 !important;
    border-bottom: 1px solid #e0e0e0 !important;
    padding-bottom: 12px !important;
  }

  .content {
    padding: 20px !important;
    color: #666666 !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px !important;
    border-top: 1px solid #e0e0e0 !important;

    .cancel-button {
      background: #ffffff !important;
      color: #666666 !important;
      border: 1px solid #e0e0e0 !important;
      font-family: Nunito, sans-serif !important;

      &:hover {
        background: #f5f5f5 !important;
        color: #333333 !important;
      }
    }

    .confirm-button {
      font-family: Nunito, sans-serif !important;
      background: #3d85b0 !important;

      &:hover {
        background: #326d94 !important;
      }
    }
  }
`;
