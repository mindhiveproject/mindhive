import absoluteUrl from "next-absolute-url";
import { Icon, Button, Message } from "semantic-ui-react";
import moment from "moment";
import styled from "styled-components";
import { useMutation } from "@apollo/client";

import { GET_USER } from "../../Queries/User";
import { UPDATE_PROJECT_BOARD } from "../../Mutations/Proposal";

export default function Projects({ query, user, profile }) {
  const { origin } = absoluteUrl();

  const [updateProject, { loading, error }] = useMutation(
    UPDATE_PROJECT_BOARD,
    {
      refetchQueries: [
        { query: GET_USER, variables: { id: profile?.publicId } },
      ],
    }
  );

  // Remove duplicates by creating a map of projects, prioritizing "Author" role
  const projectMap = new Map();
  [
    ...(profile?.authorOfProposal || []).map((project) => ({
      ...project,
      role: "Author",
    })),
    ...(profile?.collaboratorInProposal || []).map((project) => ({
      ...project,
      role: "Collaborator",
    })),
  ].forEach((project) => {
    if (!projectMap.has(project.id)) {
      projectMap.set(project.id, project);
    } else if (project.role === "Author") {
      // Update role to Author if the project is already in the map
      projectMap.set(project.id, {
        ...projectMap.get(project.id),
        role: "Author",
      });
    }
  });

  const projects = Array.from(projectMap.values());

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

  if (projects.length === 0) {
    return (
      <EmptyState>
        <p>The student hasn’t created any projects yet.</p>
      </EmptyState>
    );
  }

  return (
    <ProjectsContainer>
      {error && (
        <Message negative>
          <Message.Header>Error</Message.Header>
          <p>Failed to update project status. Please try again.</p>
        </Message>
      )}
      <Header>
        <div>Project Title</div>
        <div>Role</div>
        <div>Date Created</div>
        <div>Date Updated</div>
        <div>Main Project</div>
      </Header>
      {projects.map((project) => (
        <Row
          key={project.id}
          isMain={project?.isMain}
          isHidden={project?.isHidden}
        >
          <TitleCell>
            <span>{project?.title}</span>
            {!project?.isHidden && (
              <a
                href={`${origin}/builder/projects?selector=${project.id}`}
                target="_blank"
                rel="noreferrer"
                title="Open project in new tab"
              >
                <StyledIcon name="external alternate" />
              </a>
            )}
          </TitleCell>
          <Cell>{project?.role}</Cell>
          <Cell>{moment(project.createdAt).format("MMMM D, YYYY, h:mma")}</Cell>
          <Cell>
            {project?.isHidden ? (
              <DeletedMessage>Project deleted</DeletedMessage>
            ) : (
              project.updatedAt &&
              moment(project.updatedAt).format("MMMM D, YYYY, h:mma")
            )}
          </Cell>
          <Cell>
            <Button
              toggle
              active={project?.isMain}
              onClick={() =>
                toggleProjectAsMain({
                  projectId: project?.id,
                  isMain: !project?.isMain,
                })
              }
              disabled={loading || project?.isHidden}
              aria-label={`Set ${project?.title} as main project`}
            />
          </Cell>
        </Row>
      ))}
    </ProjectsContainer>
  );
}

const ProjectsContainer = styled.div`
  font-family: Nunito, sans-serif;
  /* max-width: 1200px; */
  margin: 0 auto;
  padding: 20px;
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-family: Nunito, sans-serif;
  font-size: 16px;
  color: #666666;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr 2fr 2fr 1fr;
  gap: 16px;
  padding: 12px 16px;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  text-transform: uppercase;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr 2fr 2fr 1fr;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: ${(props) => (props.isMain ? "#e6f0fa" : "#ffffff")};
  transition: background 0.2s ease;

  &:hover {
    background: ${(props) => (props.isMain ? "#d6e4f5" : "#f5f5f5")};
  }

  opacity: ${(props) => (props.isHidden ? 0.6 : 1)};
`;

const Cell = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #333333;
`;

const TitleCell = styled(Cell)`
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const StyledIcon = styled(Icon)`
  color: #3d85b0 !important;
  font-size: 14px !important;
  margin-left: 8px !important;

  &:hover {
    color: #326d94 !important;
  }
`;

const DeletedMessage = styled.span`
  color: #d32f2f;
  font-size: 14px;
  font-weight: 600;
`;

const StyledToggle = styled.div`
  .ui.toggle.checkbox {
    input:checked ~ label:before {
      background-color: #3d85b0 !important;
    }

    input:focus:checked ~ label:before {
      background-color: #326d94 !important;
    }

    label:before {
      background-color: #b0b0b0 !important;
    }
  }
`;
