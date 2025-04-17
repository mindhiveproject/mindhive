import { useMutation } from "@apollo/client";
import { Modal, Dropdown } from "semantic-ui-react";
import { useState } from "react";
import styled from "styled-components";

import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
import { UPDATE_STUDY } from "../../../../../Mutations/Study";

export default function StudySubmissionStatusManager(props) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(props?.value);
  const [participationAllowed, setParticipationAllowed] = useState(
    props?.data?.project?.study?.dataCollectionOpenForParticipation
  );

  const [updateStatus, { loading, error }] = useMutation(UPDATE_STUDY, {
    variables: {
      id: props?.data?.project?.study?.id,
    },
    refetchQueries: [
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

  const updateStudyStatus = () => {
    updateStatus({
      variables: {
        input: {
          dataCollectionStatus: status,
          dataCollectionOpenForParticipation: participationAllowed,
        },
      },
    });
    setIsOpen(false);
  };

  const statusOptions =
    [
      { label: "Not started", value: "NOT_STARTED" },
      { label: "In progress", value: "IN_PROGRESS" },
      { label: "Submitted", value: "SUBMITTED" },
      { label: "Data collection is finished", value: "FINISHED" },
    ].map((status) => ({
      key: status?.value,
      text: status?.label,
      value: status?.value,
    })) || [];

  const participationOptions =
    [
      { label: "Not allowed", value: false },
      { label: "Allowed", value: true },
    ].map((status) => ({
      key: status?.value,
      text: status?.label,
      value: status?.value,
    })) || [];

  return (
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
            <h1>Manage {props?.stage} Status</h1>
            <p>
              Update the status and participation settings for{" "}
              {props?.data?.projectTitle}
            </p>
          </div>
          <div className="modalTwoSideContent">
            <div className="firstSide">
              <h2>Study Details</h2>
              <p>
                <strong>Stage:</strong> {props?.stage}
              </p>
              <p>
                <strong>Project:</strong> {props?.data?.projectTitle}
              </p>
            </div>
            <div className="secondSide">
              <h2>Status</h2>
              <Dropdown
                selection
                options={statusOptions}
                value={status}
                onChange={(e, data) => setStatus(data?.value)}
                fluid
                className="status-dropdown"
              />
              <h2>Participation</h2>
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
            <button className="cancel-button" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
            <button
              className="update-button"
              onClick={updateStudyStatus}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Status"}
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
