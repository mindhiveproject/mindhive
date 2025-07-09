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

export default function SubmissionStatusManager(props) {
  const { t } = useTranslation("classes");
  const [isOpen, setIsOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [status, setStatus] = useState(props?.value);
  const [commentsAllowed, setCommentsAllowed] = useState(
    props?.data?.project && props?.data?.project[props?.commentField]
  );

  const [updateStatus, { loading: boardLoading, error: boardError }] =
    useMutation(UPDATE_PROJECT_BOARD, {
      variables: {
        id: props?.data?.projectId,
      },
      refetchQueries: [
        {
          query: GET_STUDENTS_DASHBOARD_DATA,
          variables: { classId: props?.classId },
        },
      ],
    });

  const [updateCard, { loading: cardLoading, error: cardError }] = useMutation(
    UPDATE_PROPOSAL_CARD,
    {
      refetchQueries: [
        {
          query: GET_STUDENTS_DASHBOARD_DATA,
          variables: { classId: props?.classId },
        },
      ],
    }
  );

  const handleUpdateStatus = () => {
    if (status === "FINISHED") {
      setConfirmModalOpen(true);
    } else {
      updateProjectStatus();
    }
  };

  const updateProjectStatus = async (updateCardsToNeedsRevision = false) => {
    try {
      await updateStatus({
        variables: {
          input: {
            [props?.type]: status,
            [props?.commentField]: commentsAllowed,
          },
        },
      });

      if (updateCardsToNeedsRevision) {
        // Fetch all sections of the project board
        const sections = props?.data?.project?.sections || [];
        const cardsToUpdate = sections
          .flatMap((section) => section.cards || [])
          .filter((card) => !!card.settings?.includeInReport);

        // Update each card individually
        for (const card of cardsToUpdate) {
          await updateCard({
            variables: {
              where: { id: card.id },
              data: {
                settings: {
                  ...card?.settings,
                  status: "Needs revision",
                },
              },
            },
          });
        }
      }

      setIsOpen(false);
      setConfirmModalOpen(false);
    } catch (error) {
      console.error("Error updating status:", error);
      alert(t("dashboard.failedToUpdateStatusOrCards"));
    }
  };

  const statusOptions =
    [
      { label: t("dashboard.notStarted"), value: "NOT_STARTED" },
      { label: t("dashboard.inProgress"), value: "IN_PROGRESS" },
      { label: t("dashboard.submitted"), value: "SUBMITTED" },
      { label: t("dashboard.reviewFinished"), value: "FINISHED" },
    ].map((status) => ({
      key: status?.value,
      text: status?.label,
      value: status?.value,
    })) || [];

  const commentsOptions =
    [
      { label: t("dashboard.notAllowed"), value: false },
      { label: t("dashboard.allowed"), value: true },
    ].map((status) => ({
      key: status?.value,
      text: status?.label,
      value: status?.value,
    })) || [];

  return (
    <>
      <Modal
        onClose={() => setIsOpen(false)}
        onOpen={() => setIsOpen(true)}
        open={isOpen}
        trigger={<div>{props.value}</div>}
        dimmer="blurring"
        size="large"
        closeIcon
      >
        <StyledModal>
          <Modal.Content>
            <div className="modalHeader">
              <h1>{t("dashboard.manageStageStatus", { stage: props?.stage })}</h1>
              <p>
                {t("dashboard.updateStatusAndComments", { project: props?.data?.projectTitle })}
              </p>
            </div>
            {(boardError || cardError) && (
              <div className="error-message">
                {t("dashboard.failedToUpdateStatusOrCards")}
              </div>
            )}
            <div className="modalTwoSideContent">
              <div className="firstSide">
                <h2>{t("dashboard.projectDetails")}</h2>
                <p>
                  <strong>{t("dashboard.stage")}</strong> {props?.stage}
                </p>
                <p>
                  <strong>{t("dashboard.project")}</strong> {props?.data?.projectTitle}
                </p>
              </div>
              <div className="secondSide">
                <h2>{t("dashboard.status")}</h2>
                <Dropdown
                  selection
                  options={statusOptions}
                  value={status}
                  onChange={(e, data) => setStatus(data?.value)}
                  fluid
                  className="status-dropdown"
                />
                <h2>{t("dashboard.comments")}</h2>
                <Dropdown
                  selection
                  options={commentsOptions}
                  value={commentsAllowed}
                  onChange={(e, data) => setCommentsAllowed(data?.value)}
                  fluid
                  className="comments-dropdown"
                />
              </div>
            </div>
            <div className="footer">
              <button
                className="cancel-button"
                onClick={() => setIsOpen(false)}
              >
                {t("dashboard.cancel")}
              </button>
              <button
                className="update-button"
                onClick={handleUpdateStatus}
                disabled={boardLoading || cardLoading}
              >
                {boardLoading || cardLoading ? t("dashboard.updating") : t("dashboard.updateStatus")}
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
            {t("dashboard.confirmCardStatusUpdateDescSingle")}
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

  .error-message {
    background: #ffe6e6;
    color: #d32f2f;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 14px;
    text-align: center;
  }

  .modalTwoSideContent {
    display: flex;
    gap: 32px;
    margin-bottom: 32px;

    .firstSide,
    .secondSide {
      flex: 1;
      padding: 16px;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .firstSide {
      h2 {
        font-size: 18px;
        font-weight: 600;
        color: #333333;
        margin-bottom: 16px;
      }

      p {
        font-size: 14px;
        color: #666666;
        margin: 8px 0;
        line-height: 1.5;

        strong {
          color: #333333;
        }
      }
    }

    .secondSide {
      h2 {
        font-size: 18px;
        font-weight: 600;
        color: #333333;
        margin-bottom: 12px;
      }

      .status-dropdown,
      .comments-dropdown {
        margin-bottom: 24px;

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
