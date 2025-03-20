import absoluteUrl from "next-absolute-url";
import { Icon } from "semantic-ui-react";
import moment from "moment";

import { GET_USER } from "../../Queries/User";
import { UPDATE_PROJECT_BOARD } from "../../Mutations/Proposal";
import { useMutation } from "@apollo/client";

export default function Projects({ query, user, profile }) {
  const { origin } = absoluteUrl();

  const [updateProject, { loading }] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [{ query: GET_USER, variables: { id: profile?.publicId } }],
  });

  const projects = [
    ...profile?.authorOfProposal?.map((project) => ({
      ...project,
      role: "Author",
    })),
    ...profile?.collaboratorInProposal?.map((project) => ({
      ...project,
      role: "Collaborator",
    })),
  ];

  const toggleProjectAsMain = async ({ projectId, isMain }) => {
    await updateProject({
      variables: {
        id: projectId,
        input: {
          isMain,
        },
      },
    });
  };

  if (projects.length === 0) {
    return (
      <div className="empty">
        <div>The student hasn’t created any projects yet.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="headerCreatedProjects">
        <div>Project title</div>
        <div>Role</div>
        <div>Date created</div>
        <div>Date updated</div>
        <div>Actions</div>
      </div>

      {projects.map((project, id) => (
        <div
          className={`rowCreatedProjects ${
            project?.isMain && "selectedAsMain"
          }`}
          key={id}
        >
          <div className="title">
            {project?.title}
            <a
              href={`${origin}/builder/projects?selector=${project.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="external alternate" />
            </a>
          </div>
          <div>{project?.role}</div>
          <div>{moment(project.createdAt).format("MMMM D, YYYY, h:mma")}</div>
          <div>
            {project?.isHidden && (
              <div className="errorMessage">The project has been deleted</div>
            )}
            {!project?.isHidden &&
              project.updatedAt &&
              moment(project.updatedAt).format("MMMM D, YYYY, h:mma")}
          </div>
          <div>
            {project?.isMain ? (
              <button
                className="mainProjectBtn"
                onClick={() =>
                  toggleProjectAsMain({
                    projectId: project?.id,
                    isMain: !project?.isMain,
                  })
                }
              >
                Deselect as Main Project
              </button>
            ) : (
              <button
                onClick={() =>
                  toggleProjectAsMain({
                    projectId: project?.id,
                    isMain: !project?.isMain,
                  })
                }
              >
                Select as Main Project
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
