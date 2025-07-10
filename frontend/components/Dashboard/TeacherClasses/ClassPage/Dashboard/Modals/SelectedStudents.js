import { useMutation } from "@apollo/client";
import { Modal, Dropdown, Button } from "semantic-ui-react";
import { useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";
import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
import {
  UPDATE_PROJECT_BOARD,
  UPDATE_PROPOSAL_CARD,
} from "../../../../../Mutations/Proposal";
import { UPDATE_STUDY } from "../../../../../Mutations/Study";

// Component for the selected students modal
export const SelectedStudentsModal = ({
  isOpen,
  onClose,
  selectedStudents,
  classId,
}) => {
  const { t } = useTranslation("classes");
  const [projectStatus, setProjectStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [commentsAllowed, setCommentsAllowed] = useState(null);
  const [studyStatus, setStudyStatus] = useState("");
  const [participationAllowed, setParticipationAllowed] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [updateProject, { loading: boardLoading, error: boardError }] =
    useMutation(UPDATE_PROJECT_BOARD, {
      refetchQueries: [
        {
          query: GET_STUDENTS_DASHBOARD_DATA,
          variables: { classId },
        },
      ],
    });

  const [updateCard, { loading: cardLoading, error: cardError }] = useMutation(
    UPDATE_PROPOSAL_CARD,
    {
      refetchQueries: [
        {
          query: GET_STUDENTS_DASHBOARD_DATA,
          variables: { classId },
        },
      ],
    }
  );

  const [updateStudy, { loading: studyLoading, error: studyError }] =
    useMutation(UPDATE_STUDY, {
      refetchQueries: [
        {
          query: GET_STUDENTS_DASHBOARD_DATA,
          variables: { classId },
        },
      ],
    });

  const handleUpdateProjectStatus = () => {
    // Trigger confirmation modal only for peerFeedbackStatus set to FINISHED
    if (statusType === "peerFeedbackStatus" && projectStatus === "FINISHED") {
      setConfirmModalOpen(true);
    } else {
      updateProjectStatus(false);
    }
  };

  const updateProjectStatus = async (updateCardsToNeedsRevision = false) => {
    try {
      // Filter out students without a projectId to avoid invalid mutations
      const validStudents = selectedStudents.filter(
        (student) => student.projectId
      );

      // Map status type to corresponding comment field
      const commentFieldMap = {
        submitProposalStatus: "submitProposalOpenForComments",
        peerFeedbackStatus: "peerFeedbackOpenForComments",
        projectReportStatus: "projectReportOpenForComments",
      };
      const commentField = commentFieldMap[statusType];

      // Update the selected status type and comments for all valid selected students
      await Promise.all(
        validStudents.map((student) =>
          updateProject({
            variables: {
              id: student.projectId,
              input: {
                [statusType]: projectStatus,
                [commentField]: commentsAllowed,
              },
            },
          })
        )
      );

      // If updating cards to "Needs revision" for FINISHED peerFeedbackStatus
      if (updateCardsToNeedsRevision) {
        for (const student of validStudents) {
          const sections = student.project?.sections || [];
          const cardsToUpdate = sections
            .flatMap((section) => section.cards || [])
            .filter((card) => card.settings?.includeInReport);

          // Update each card individually
          await Promise.all(
            cardsToUpdate.map((card) =>
              updateCard({
                variables: {
                  where: { id: card.id },
                  data: {
                    settings: {
                      ...card.settings,
                      status: "Needs revision",
                    },
                  },
                },
              })
            )
          );
        }
      }

      setProjectStatus("");
      setStatusType("");
      setCommentsAllowed(null);
      setConfirmModalOpen(false);
      onClose();
    } catch (error) {
      console.error("Error updating project status:", error);
      alert(t("dashboard.failedToUpdateProjectStatus"));
    }
  };

  const handleUpdateStudyStatus = () => {
    updateStudyStatus();
  };

  const updateStudyStatus = async () => {
    try {
      // Filter out students without a studyId to avoid invalid mutations
      const validStudents = selectedStudents.filter(
        (student) => student.studyId
      );

      // Update study status for all valid selected students
      await Promise.all(
        validStudents.map((student) =>
          updateStudy({
            variables: {
              id: student.studyId,
              input: {
                dataCollectionStatus: studyStatus,
                dataCollectionOpenForParticipation: participationAllowed,
              },
            },
          })
        )
      );

      setStudyStatus("");
      setParticipationAllowed(null);
      onClose();
    } catch (error) {
      console.error("Error updating study status:", error);
      alert(t("dashboard.failedToUpdateStudyStatus"));
    }
  };

  const projectStatusOptions = [
    { label: t("dashboard.notStarted"), value: "NOT_STARTED" },
    { label: t("dashboard.inProgress"), value: "IN_PROGRESS" },
    { label: t("dashboard.submitted"), value: "SUBMITTED" },
    { label: t("dashboard.reviewFinished"), value: "FINISHED" },
  ].map((status) => ({
    key: status.value,
    text: status.label,
    value: status.value,
  }));

  const statusTypeOptions = [
    { label: t("dashboard.proposalStatus"), value: "submitProposalStatus" },
    { label: t("dashboard.peerFeedbackStatus"), value: "peerFeedbackStatus" },
    { label: t("dashboard.projectReportStatus"), value: "projectReportStatus" },
  ].map((type) => ({
    key: type.value,
    text: type.label,
    value: type.value,
  }));

  const commentsOptions = [
    { label: t("dashboard.notAllowed"), value: false },
    { label: t("dashboard.allowed"), value: true },
  ].map((status) => ({
    key: status.value,
    text: status.label,
    value: status.value,
  }));

  const studyStatusOptions = [
    { label: t("dashboard.notStarted"), value: "NOT_STARTED" },
    { label: t("dashboard.inProgress"), value: "IN_PROGRESS" },
    { label: t("dashboard.submitted"), value: "SUBMITTED" },
    { label: t("dashboard.dataCollectionFinished"), value: "FINISHED" },
  ].map((status) => ({
    key: status.value,
    text: status.label,
    value: status.value,
  }));

  const participationOptions = [
    { label: t("dashboard.notAllowed"), value: false },
    { label: t("dashboard.allowed"), value: true },
  ].map((status) => ({
    key: status.value,
    text: status.label,
    value: status.value,
  }));

  return (
    <>
      <Modal open={isOpen} onClose={onClose} size="large" closeIcon>
        <StyledModal>
          <Modal.Content>
            <div className="modalHeader">
              <h1>{t("dashboard.selectedStudents")}</h1>
              <p>{t("dashboard.manageSelectedStudentsInfo", { count: selectedStudents.length })}</p>
            </div>
            {(boardError || cardError || studyError) && (
              <div className="error-message">
                {t("dashboard.failedToUpdateStatus")}
              </div>
            )}
            <div className="section">
              <h2>{t("dashboard.selectedStudents")}</h2>
              {selectedStudents.length === 0 ? (
                <p>{t("dashboard.noStudentsSelected")}</p>
              ) : (
                <div className="student-list">
                  {selectedStudents.map((student, index) => (
                    <div
                      key={student.id || student.publicId || student.username}
                      className="student-item"
                    >
                      <span>
                        <strong>
                          {index + 1}. {student.username}
                        </strong>
                      </span>
                      <span>{t("dashboard.projectLabel", { project: student.projectTitle || t("dashboard.none") })}</span>
                      <span>{t("dashboard.studyLabel", { study: student.studyTitle || t("dashboard.none") })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="section">
              <h2>{t("dashboard.bulkUpdateProjectStatus")}</h2>
              <Dropdown
                selection
                options={statusTypeOptions}
                value={statusType}
                onChange={(e, { value }) => setStatusType(value)}
                fluid
                placeholder={t("dashboard.selectStatusType")}
                className="status-type-dropdown"
              />
              <Dropdown
                selection
                options={projectStatusOptions}
                value={projectStatus}
                onChange={(e, { value }) => setProjectStatus(value)}
                fluid
                placeholder={t("dashboard.selectProjectStatus")}
                className="status-dropdown"
                disabled={!statusType}
              />
              <Dropdown
                selection
                options={commentsOptions}
                value={commentsAllowed}
                onChange={(e, { value }) => setCommentsAllowed(value)}
                fluid
                placeholder={t("dashboard.selectCommentsSetting")}
                className="comments-dropdown"
                disabled={!statusType}
              />
              <button
                className="update-button"
                onClick={handleUpdateProjectStatus}
                disabled={
                  !projectStatus ||
                  !statusType ||
                  commentsAllowed === null ||
                  selectedStudents.length === 0 ||
                  boardLoading ||
                  cardLoading
                }
              >
                {boardLoading || cardLoading
                  ? t("dashboard.updating")
                  : t("dashboard.updateProjectStatus")}
              </button>
            </div>
            <div className="section">
              <h2>{t("dashboard.bulkUpdateStudyStatus")}</h2>
              <Dropdown
                selection
                options={studyStatusOptions}
                value={studyStatus}
                onChange={(e, { value }) => setStudyStatus(value)}
                fluid
                placeholder={t("dashboard.selectStudyStatus")}
                className="status-dropdown"
              />
              <Dropdown
                selection
                options={participationOptions}
                value={participationAllowed}
                onChange={(e, { value }) => setParticipationAllowed(value)}
                fluid
                placeholder={t("dashboard.selectParticipationSetting")}
                className="participation-dropdown"
              />
              <button
                className="update-button"
                onClick={handleUpdateStudyStatus}
                disabled={
                  !studyStatus ||
                  participationAllowed === null ||
                  selectedStudents.length === 0 ||
                  studyLoading
                }
              >
                {studyLoading ? t("dashboard.updating") : t("dashboard.updateStudyStatus")}
              </button>
            </div>
            <div className="footer">
              <button className="cancel-button" onClick={onClose}>
                {t("dashboard.close")}
              </button>
            </div>
          </Modal.Content>
        </StyledModal>
      </Modal>
      <StyledConfirmModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        size="tiny"
      >
        <Modal.Header>{t("dashboard.confirmCardStatusUpdate")}</Modal.Header>
        <Modal.Content>
          <Modal.Description>
            {t("dashboard.confirmCardStatusUpdateDesc")}
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button
            onClick={() => {
              updateProjectStatus(false);
              setConfirmModalOpen(false);
            }}
            className="cancel-button"
          >
            {t("dashboard.noKeepCardStatuses")}
          </Button>
          <Button
            onClick={() => updateProjectStatus(true)}
            className="confirm-button"
            primary
            disabled={boardLoading || cardLoading}
          >
            {t("dashboard.yesUpdateCards")}
          </Button>
        </Modal.Actions>
      </StyledConfirmModal>
    </>
  );
};

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

  .error-message {
    background: #ffe6e6;
    color: #d32f2f;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 14px;
    text-align: center;
  }

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

    .student-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .student-item {
      display: flex;
      gap: 16px;
      padding: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      background: #ffffff;
      font-size: 14px;
      color: #666666;

      span {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        strong {
          color: #3d85b0;
        }
      }
    }

    .status-type-dropdown,
    .status-dropdown,
    .comments-dropdown,
    .participation-dropdown {
      margin-bottom: 12px;

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

    .update-button {
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
