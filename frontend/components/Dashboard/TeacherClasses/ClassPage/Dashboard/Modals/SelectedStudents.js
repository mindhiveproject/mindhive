import { useMutation } from "@apollo/client";
import { Modal, Dropdown, Button } from "semantic-ui-react";
import { useState } from "react";
import styled from "styled-components";
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
      alert("Failed to update project status. Please try again.");
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
      alert("Failed to update study status. Please try again.");
    }
  };

  const projectStatusOptions = [
    { label: "Not started", value: "NOT_STARTED" },
    { label: "In progress", value: "IN_PROGRESS" },
    { label: "Submitted", value: "SUBMITTED" },
    { label: "Review is finished", value: "FINISHED" },
  ].map((status) => ({
    key: status.value,
    text: status.label,
    value: status.value,
  }));

  const statusTypeOptions = [
    { label: "Proposal Status", value: "submitProposalStatus" },
    { label: "Peer Feedback Status", value: "peerFeedbackStatus" },
    { label: "Project Report Status", value: "projectReportStatus" },
  ].map((type) => ({
    key: type.value,
    text: type.label,
    value: type.value,
  }));

  const commentsOptions = [
    { label: "Not allowed", value: false },
    { label: "Allowed", value: true },
  ].map((status) => ({
    key: status.value,
    text: status.label,
    value: status.value,
  }));

  const studyStatusOptions = [
    { label: "Not started", value: "NOT_STARTED" },
    { label: "In progress", value: "IN_PROGRESS" },
    { label: "Submitted", value: "SUBMITTED" },
    { label: "Data collection is finished", value: "FINISHED" },
  ].map((status) => ({
    key: status.value,
    text: status.label,
    value: status.value,
  }));

  const participationOptions = [
    { label: "Not allowed", value: false },
    { label: "Allowed", value: true },
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
              <h1>Selected Students</h1>
              <p>Manage {selectedStudents.length} selected student(s)</p>
            </div>
            {(boardError || cardError || studyError) && (
              <div className="error-message">
                Error: Failed to update status. Please try again.
              </div>
            )}
            <div className="section">
              <h2>Selected Students</h2>
              {selectedStudents.length === 0 ? (
                <p>No students selected.</p>
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
                      <span>Project: {student.projectTitle || "None"}</span>
                      <span>Study: {student.studyTitle || "None"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="section">
              <h2>Bulk Update Project Status</h2>
              <Dropdown
                selection
                options={statusTypeOptions}
                value={statusType}
                onChange={(e, { value }) => setStatusType(value)}
                fluid
                placeholder="Select a status type"
                className="status-type-dropdown"
              />
              <Dropdown
                selection
                options={projectStatusOptions}
                value={projectStatus}
                onChange={(e, { value }) => setProjectStatus(value)}
                fluid
                placeholder="Select a project status"
                className="status-dropdown"
                disabled={!statusType}
              />
              <Dropdown
                selection
                options={commentsOptions}
                value={commentsAllowed}
                onChange={(e, { value }) => setCommentsAllowed(value)}
                fluid
                placeholder="Select comments setting"
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
                  ? "Updating..."
                  : "Update Project Status"}
              </button>
            </div>
            <div className="section">
              <h2>Bulk Update Study Status</h2>
              <Dropdown
                selection
                options={studyStatusOptions}
                value={studyStatus}
                onChange={(e, { value }) => setStudyStatus(value)}
                fluid
                placeholder="Select a study status"
                className="status-dropdown"
              />
              <Dropdown
                selection
                options={participationOptions}
                value={participationAllowed}
                onChange={(e, { value }) => setParticipationAllowed(value)}
                fluid
                placeholder="Select participation setting"
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
                {studyLoading ? "Updating..." : "Update Study Status"}
              </button>
            </div>
            <div className="footer">
              <button className="cancel-button" onClick={onClose}>
                Close
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
        <Modal.Header>Confirm Card Status Update</Modal.Header>
        <Modal.Content>
          <Modal.Description>
            Setting the status to "Review is finished" can update all submitted
            cards in these projects to "Needs revision". Would you like to
            proceed with this change?
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
            No, Keep Card Statuses
          </Button>
          <Button
            onClick={() => updateProjectStatus(true)}
            className="confirm-button"
            primary
            disabled={boardLoading || cardLoading}
          >
            Yes, Update Cards
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
