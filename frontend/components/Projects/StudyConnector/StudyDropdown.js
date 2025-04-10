import { useMutation, useQuery } from "@apollo/client";
import { Dropdown } from "semantic-ui-react";
import styled from "styled-components";

import { UPDATE_PROJECT_BOARD } from "../../Mutations/Proposal";
import { GET_PROJECT_STUDY } from "../../Queries/Proposal";
import { MY_STUDIES } from "../../Queries/Study";

export default function StudyDropdown({ user, project }) {
  const { data: studiesData } = useQuery(MY_STUDIES, {
    variables: { id: user?.id },
  });

  const [updateProject] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      {
        query: GET_PROJECT_STUDY,
        variables: { id: project?.id },
      },
    ],
  });

  const studies = studiesData?.studies || [];

  const studyOptions = studies.map((study) => ({
    key: study?.id,
    text: study?.title,
    value: study?.id,
  }));

  const handleStudyChange = async (e, { value }) => {
    try {
      await updateProject({
        variables: {
          id: project?.id,
          input: {
            study: {
              connect: {
                id: value,
              },
            },
          },
        },
      });
      window.location.reload();
    } catch (error) {
      console.error("Error updating study:", error);
      alert("Failed to update study connection");
    }
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
      position: relative; // Ensures proper positioning context

      // Fix arrow positioning
      .dropdown.icon {
        margin: 0;
        right: 12px; // Align arrow inside the border
        top: 50%;
        transform: translateY(-50%);
        color: #666666;
      }

      .text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 24px; // Make room for the arrow
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
          top: 50%; // Maintain centering when active
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
  color: #666666;
  flex-shrink: 0;
`;
