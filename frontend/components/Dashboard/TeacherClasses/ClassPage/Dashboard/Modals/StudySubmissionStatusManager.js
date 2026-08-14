import { useMutation } from "@apollo/client";
import { Modal, Dropdown } from "semantic-ui-react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";
import { UPDATE_STUDY } from "../../../../../Mutations/Study";
import { buildDualWriteUpdate } from "../../../../../../lib/milestoneStatus";

export default function StudySubmissionStatusManager(props) {
  const { t } = useTranslation("classes");
  const isControlled = typeof props.open === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? props.open : internalOpen;
  const [status, setStatus] = useState(props?.value);
  const [participationAllowed, setParticipationAllowed] = useState(
    props?.openForParticipation ??
      props?.data?.project?.study?.dataCollectionOpenForParticipation
  );

  const closeModal = () => {
    if (isControlled) {
      props.onClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setStatus(props?.value);
    setParticipationAllowed(
      props?.openForParticipation ??
        props?.data?.project?.study?.dataCollectionOpenForParticipation
    );
  }, [
    isOpen,
    props?.value,
    props?.openForParticipation,
    props?.data?.id,
    props?.data?.project?.study?.dataCollectionOpenForParticipation,
  ]);

  const refetchDashboard = [
    {
      query: GET_STUDENTS_DASHBOARD_DATA,
      variables: { classId: props?.classId },
    },
  ];

  const [updateBoard, { loading: boardLoading, error: boardError }] =
    useMutation(UPDATE_PROJECT_BOARD, {
      refetchQueries: refetchDashboard,
    });

  const [updateStudy, { loading: studyLoading, error: studyError }] =
    useMutation(UPDATE_STUDY, {
      refetchQueries: refetchDashboard,
    });

  const loading = boardLoading || studyLoading;
  const error = boardError || studyError;

  const updateStudyStatus = async () => {
    try {
      if (props?.milestone && props?.data?.projectId) {
        await updateBoard({
          variables: {
            id: props.data.projectId,
            input: buildDualWriteUpdate(
              props.milestone,
              {
                status,
                openForParticipation: participationAllowed,
              },
              props?.data?.project?.milestoneStatus || {}
            ),
          },
        });
      } else {
        await updateStudy({
          variables: {
            id: props?.data?.project?.study?.id,
            input: {
              dataCollectionStatus: status,
              dataCollectionOpenForParticipation: participationAllowed,
            },
          },
        });
      }
      closeModal();
    } catch (err) {
      console.error("Error updating study status:", err);
    }
  };

  const statusOptions =
    [
      { label: t("dashboard.notStarted"), value: "NOT_STARTED" },
      { label: t("dashboard.inProgress"), value: "IN_PROGRESS" },
      { label: t("dashboard.submitted"), value: "SUBMITTED" },
      { label: t("dashboard.dataCollectionFinished"), value: "FINISHED" },
    ].map((status) => ({
      key: status?.value,
      text: status?.label,
      value: status?.value,
    })) || [];

  const participationOptions =
    [
      { label: t("dashboard.notAllowed"), value: false },
      { label: t("dashboard.allowed"), value: true },
    ].map((status) => ({
      key: status?.value,
      text: status?.label,
      value: status?.value,
    })) || [];

  return (
    <Modal
      onClose={closeModal}
      onOpen={() => {
        if (!isControlled) setInternalOpen(true);
      }}
      open={isOpen}
      trigger={isControlled ? undefined : <div>{props.value}</div>}
      dimmer="blurring"
      size="large"
      closeIcon
    >
      <StyledModal>
        <Modal.Content>
          <div className="modalHeader">
            <h1>{t("dashboard.manageStageStatus", { stage: props?.stage })}</h1>
            <p>
              {t("dashboard.updateStatusAndParticipation", { project: props?.data?.projectTitle })}
            </p>
          </div>
          <div className="modalTwoSideContent">
            <div className="firstSide">
              <h2>{t("dashboard.studyDetails")}</h2>
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
              <h2>{t("dashboard.participation")}</h2>
              <Dropdown
                selection
                options={participationOptions}
                value={participationAllowed}
                onChange={(e, data) => setParticipationAllowed(data?.value)}
                fluid
                className="participation-dropdown"
              />
            </div>
          </div>
          <div className="footer">
            <button className="cancel-button" onClick={closeModal}>
              {t("dashboard.cancel")}
            </button>
            <button
              className="update-button"
              onClick={updateStudyStatus}
              disabled={loading}
            >
              {loading ? t("dashboard.updating") : t("dashboard.updateStatus")}
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
      .participation-dropdown {
        margin-bottom: 24px;

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

      &: June {
        background: #b0b0b0;
        cursor: not-allowed;
      }
    }
  }
`;
