import { useMutation, useQuery } from "@apollo/client";
import { Dropdown, Modal, Button } from "semantic-ui-react";
import styled from "styled-components";
import { useState } from "react";

import { UPDATE_PROJECT_BOARD } from "../../Mutations/Proposal";
import { GET_PROJECT_STUDY } from "../../Queries/Proposal";
import { MY_STUDIES, TEACHER_STUDIES } from "../../Queries/Study";

export default function StudyDropdown({ user, project }) {
  const isTeacher = user?.permissions?.map((p) => p?.name).includes("TEACHER");
  const { data: studiesData } = useQuery(
    isTeacher ? TEACHER_STUDIES : MY_STUDIES,
    {
      variables: { id: user?.id },
    }
  );

  const [updateProject] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      {
        query: GET_PROJECT_STUDY,
        variables: { id: project?.id },
      },
    ],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudyId, setSelectedStudyId] = useState(null);

  const studies = studiesData?.studies || [];

  const studyOptions = studies.map((study) => ({
    key: study?.id,
    text: study?.title,
    value: study?.id,
  }));

  const handleStudyChange = (e, { value }) => {
    // Only open modal if the selected study is different from the current one
    if (value !== project?.study?.id) {
      setSelectedStudyId(value);
      setIsModalOpen(true);
    }
  };

  const handleConfirm = async () => {
    try {
      await updateProject({
        variables: {
          id: project?.id,
          input: {
            study: {
              connect: {
                id: selectedStudyId,
              },
            },
          },
        },
      });
      setIsModalOpen(false);
      setSelectedStudyId(null);
      window.location.reload();
    } catch (error) {
      console.error("Error updating study:", error);
      alert("Failed to update study connection");
      setIsModalOpen(false);
      setSelectedStudyId(null);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedStudyId(null);
  };

  return (
    <StyledStudyDropdown>
      <Label>Study:</Label>
      <Dropdown
        selection
        options={studyOptions}
        value={project?.study?.id || ""}
        onChange={handleStudyChange}
        placeholder="No study connected"
        disabled={!studies.length}
        className="study-selector"
        fluid
      />
      <StyledModal open={isModalOpen} onClose={handleCancel} size="tiny">
        <Modal.Header>Confirm Study Change</Modal.Header>
        <Modal.Content>
          <Modal.Description>
            Are you sure you want to switch the study for this project? This
            action may affect related data.
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={handleCancel} className="cancel-button">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="confirm-button" primary>
            Confirm
          </Button>
        </Modal.Actions>
      </StyledModal>
    </StyledStudyDropdown>
  );
}

const StyledStudyDropdown = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  width: 350px;

  .study-selector {
    width: 100%;
    font-family: Nunito, sans-serif !important;

    &.ui.dropdown {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background: #ffffff;
      position: relative;

      .dropdown.icon {
        margin: 0;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #666666;
      }

      .text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 24px;
      }

      .menu {
        max-width: 100%;
        width: auto;
        min-width: 100%;
        border: 1px solid #e0e0e0;
        margin-top: 4px;
      }

      &:hover {
        border-color: #3d85b0;

        .dropdown.icon {
          color: #3d85b0;
        }
      }

      &.active,
      &.selected {
        .dropdown.icon {
          top: 50%;
        }
      }
    }

    &.disabled {
      opacity: 0.6;

      .dropdown.icon {
        color: #999999;
      }
    }
  }
`;

const Label = styled.span`
  font-family: Nunito, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #00635a;
  flex-shrink: 0;
`;

const StyledModal = styled(Modal)`
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
