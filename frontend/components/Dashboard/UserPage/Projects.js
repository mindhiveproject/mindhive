import absoluteUrl from "next-absolute-url";
import { Icon } from "semantic-ui-react";
import moment from "moment";
import styled from "styled-components";
import useTranslation from 'next-translate/useTranslation';
import Link from "next/link";

export default function Projects({ query, user, profile }) {
  const { t } = useTranslation('common');
  const { origin } = absoluteUrl();

  // Remove duplicates by creating a map of projects, prioritizing "Author" role
  const projectMap = new Map();
  [
    ...(profile?.authorOfProposal || []).map((project) => ({
      ...project,
      role: t('projects.author', 'Author'),
    })),
    ...(profile?.collaboratorInProposal || []).map((project) => ({
      ...project,
      role: t('projects.collaborator', 'Collaborator'),
    })),
  ].forEach((project) => {
    if (!projectMap.has(project.id)) {
      projectMap.set(project.id, project);
    } else if (project.role === t('projects.author', 'Author')) {
      // Update role to Author if the project is already in the map
      projectMap.set(project.id, {
        ...projectMap.get(project.id),
        role: t('projects.author', 'Author'),
      });
    }
  });

  const projects = Array.from(projectMap.values());

  if (projects.length === 0) {
    return (
      <EmptyState>
        <p>{t('projects.noProjectsYet', "The student hasn’t created any projects yet.")}</p>
      </EmptyState>
    );
  }

  return (
    <ProjectsContainer>
      <Header>
        <div>{t('projects.projectTitle', 'Project Title')}</div>
        <div>{t('projects.role', 'Role')}</div>
        <div>{t('projects.dateCreated', 'Date Created')}</div>
        <div>{t('projects.dateUpdated', 'Date Updated')}</div>
        <div>{t('projects.class', 'Class')}</div>
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
              <Link
                href={{
                  pathname: `/builder/projects`,
                  query: { selector: project.id }
                }}
                target="_blank"
                rel="noreferrer"
                title={t('projects.openInNewTab', 'Open project in new tab')}
              >
                <StyledIcon name="external alternate" />
              </Link>
            )}
          </TitleCell>
          <Cell>{project?.role}</Cell>
          <Cell>{moment(project.createdAt).format("MMMM D, YYYY, h:mma")}</Cell>
          <Cell>
            {project?.isHidden ? (
              <DeletedMessage>{t('projects.projectDeleted', 'Project deleted')}</DeletedMessage>
            ) : (
              project.updatedAt &&
              moment(project.updatedAt).format("MMMM D, YYYY, h:mma")
            )}
          </Cell>
          {/* Read-only: the main project is set on the project board or in
              the class dashboard, where the one-per-class rule is explained. */}
          <Cell>
            {project?.isMain && project?.usedInClass?.id
              ? t(
                  'projects.mainProjectIn',
                  { title: project.usedInClass.title },
                  `★ Main project in ${project.usedInClass.title}`
                )
              : project?.usedInClass?.title || ''}
          </Cell>
        </Row>
      ))}
    </ProjectsContainer>
  );
}

const ProjectsContainer = styled.div`
  /* max-width: 1200px; */
  margin: 0 auto;
  padding: 20px;
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;
  color: #666666;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr 2fr 2fr 1fr;
  gap: 16px;
  padding: 12px 16px;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
  font: var(--MH-Type-Label-Small);
  letter-spacing: 0;
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
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;
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
  font: var(--MH-Type-Title-Small);
  letter-spacing: 0;
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
